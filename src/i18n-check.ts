import { type MessageFormatElement, parse, TYPE } from "@formatjs/icu-messageformat-parser";
import { source, targets } from "./i18n.ts";
import glossary from "./locales/glossary.json";

/**
 * Holds every translation to the source catalog before a page is built. It fails on a message that
 * is missing, extra, or does not parse; that names other placeholders or tags than the source;
 * that is longer than its `maxLength`; that is the untranslated English; or that leaves out a
 * glossary term the English uses.
 */

type Term = { en: string; de: string; match?: string; note: string };
const terms: readonly Term[] = glossary;

type Shape = {
  /** All literal text, every branch included. */
  text: string;
  /** Characters of the longest rendering, placeholders not counted. */
  length: number;
  /** Placeholders and tags, as `name:kind`. */
  slots: string[];
};

function shape(elements: readonly MessageFormatElement[]): Shape {
  let text = "";
  let length = 0;
  const slots: string[] = [];
  for (const element of elements) {
    switch (element.type) {
      case TYPE.literal:
        text += element.value;
        length += element.value.length;
        break;
      case TYPE.argument:
        slots.push(`${element.value}:argument`);
        break;
      case TYPE.number:
        slots.push(`${element.value}:number`);
        break;
      case TYPE.date:
        slots.push(`${element.value}:date`);
        break;
      case TYPE.time:
        slots.push(`${element.value}:time`);
        break;
      case TYPE.pound:
        break;
      case TYPE.select:
      case TYPE.plural: {
        slots.push(`${element.value}:${element.type === TYPE.plural ? "plural" : "select"}`);
        const branches = Object.values(element.options).map((option) => shape(option.value));
        text += branches.map((branch) => branch.text).join(" ");
        length += Math.max(0, ...branches.map((branch) => branch.length));
        slots.push(...branches.flatMap((branch) => branch.slots));
        break;
      }
      case TYPE.tag: {
        const inner = shape(element.children);
        slots.push(`<${element.value}>`, ...inner.slots);
        text += inner.text;
        length += inner.length;
        break;
      }
      default: {
        const _: never = element;
        return _;
      }
    }
  }
  return { text, length, slots };
}

/** The same letters in any case, with no-break spaces read as spaces. */
const fold = (text: string) => text.replaceAll("\u00a0", " ").toLocaleLowerCase("en");

const escapeRegExp = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function checkTranslations(): void {
  const problems: string[] = [];
  const parsed = (where: string, message: string): Shape | undefined => {
    try {
      return shape(parse(message));
    } catch (error) {
      problems.push(`${where}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  };
  const sources = Object.entries(source).map(([id, entry]) => ({
    id,
    entry,
    shape: parsed(`en:${id}`, entry.message),
  }));
  for (const { id, entry, shape: english } of sources) {
    if (entry.description.trim() === "") problems.push(`en:${id}: needs a description`);
    if (entry.maxLength !== undefined && english && english.length > entry.maxLength)
      problems.push(`en:${id}: ${english.length} characters, max ${entry.maxLength}`);
  }
  for (const [locale, catalog] of Object.entries(targets)) {
    const expected = new Set(
      sources.filter(({ entry }) => entry.translate !== false).map(({ id }) => id),
    );
    for (const id of Object.keys(catalog))
      if (!expected.has(id))
        problems.push(`${locale}:${id}: not in en.json, or marked translate: false`);
    for (const { id, entry, shape: english } of sources) {
      if (!expected.has(id) || english === undefined) continue;
      const target = catalog[id];
      if (target === undefined) {
        problems.push(`${locale}:${id}: missing`);
        continue;
      }
      const translated = parsed(`${locale}:${id}`, target.message);
      if (translated === undefined) continue;
      const want = [...new Set(english.slots)].toSorted().join(" ");
      const have = [...new Set(translated.slots)].toSorted().join(" ");
      if (want !== have)
        problems.push(`${locale}:${id}: placeholders and tags [${have}] differ from en [${want}]`);
      if (entry.maxLength !== undefined && translated.length > entry.maxLength)
        problems.push(`${locale}:${id}: ${translated.length} characters, max ${entry.maxLength}`);
      const keeps = terms.some(
        (term) => fold(term.en) === fold(entry.message) && term.en === term.de,
      );
      if (target.message === entry.message && /\p{L}/u.test(english.text) && !keeps)
        problems.push(`${locale}:${id}: same as en, translate it`);
      for (const term of terms) {
        const used = new RegExp(`(^|[^\\p{L}])${escapeRegExp(fold(term.en))}`, "u");
        if (
          used.test(fold(english.text)) &&
          !fold(translated.text).includes(fold(term.match ?? term.de))
        )
          problems.push(`${locale}:${id}: use the glossary term "${term.de}" for "${term.en}"`);
      }
    }
  }
  if (problems.length > 0)
    throw new Error(
      `Translations need work:\n${problems.map((problem) => `- ${problem}`).join("\n")}`,
    );
}
