import { createIntl } from "@formatjs/intl";
import type { ComponentChildren, VNode } from "preact";
import { type Locale, localeInfo, perLocale } from "./locale.ts";
import type { Product } from "./site.ts";
import de from "./locales/de.json";
import en from "./locales/en.json";

/**
 * Every user-facing string lives in `src/locales/<locale>.json` as an ICU MessageFormat message,
 * keyed by ID. `en.json` is the source: each entry carries a description for translators, and a
 * `maxLength` where space is tight. `translate: false` marks names that stay the same in every
 * language. A translation records as `source` the English it was made from, so a change to the
 * English shows which translations it left behind. `i18n-check.ts` holds the other catalogs to
 * the source at build time.
 */
export type SourceEntry = {
  message: string;
  description: string;
  maxLength?: number;
  translate?: boolean;
};

export type MessageId = keyof typeof en;

export const source: Readonly<Record<MessageId, SourceEntry>> = en;

/** A translated message and the English `message` it translates. */
type TargetEntry = { source: string; message: string };

/** Every catalog but the source's, keyed by locale. */
export const targets: Readonly<
  Record<Exclude<Locale, "en">, Readonly<Record<string, TargetEntry>>>
> = { de };

function messages(locale: Locale): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).map(([id, entry]) => {
      if (locale === "en" || entry.translate === false) return [id, entry.message];
      const target = targets[locale][id];
      if (target === undefined) throw new Error(`No ${locale} translation for ${id}`);
      return [id, target.message];
    }),
  );
}

export type Values = Readonly<Record<string, string | number | Date>>;
/** Builds the element for one `<tag>…</tag>` part of a rich message from what it wraps. */
export type Tag = (chunks: Array<string | VNode>) => VNode;

export type Translator = {
  locale: Locale;
  /** A message as plain text. */
  text(id: MessageId, values?: Values): string;
  /** A message whose `<tag>…</tag>` parts each become the element `tags` builds for them. */
  rich(id: MessageId, tags: Readonly<Record<string, Tag>>, values?: Values): ComponentChildren;
  /** The name of a language, written in this one: "German" in English, "Englisch" in German. */
  language(of: Locale): string;
  /** Items as one list. English joins the last two with "&", as the brand writes it: "A, B & C"; German with "und", which is more formal. */
  list(items: readonly string[]): string;
};

/** Each locale's names of languages, & its list format joining items with "and". */
const languageNames: Readonly<Record<Locale, Intl.DisplayNames>> = {
  en: new Intl.DisplayNames([localeInfo.en.tag], { type: "language" }),
  de: new Intl.DisplayNames([localeInfo.de.tag], { type: "language" }),
};
const listFormats: Readonly<Record<Locale, Intl.ListFormat>> = {
  en: new Intl.ListFormat(localeInfo.en.tag, { type: "conjunction" }),
  de: new Intl.ListFormat(localeInfo.de.tag, { type: "conjunction" }),
};

function translator(locale: Locale): Translator {
  const tag = localeInfo[locale].tag;
  // Rich-text tags render to Preact elements; plain messages still format to strings.
  const intl = createIntl<VNode>({
    locale: tag,
    defaultLocale: localeInfo.en.tag,
    messages: messages(locale),
    // Post dates are calendar days, written as midnight UTC.
    timeZone: "UTC",
    // A missing message or value fails the build instead of showing an ID on the page.
    onError: (error) => {
      throw error;
    },
  });
  const names = languageNames[locale];
  const lists = listFormats[locale];
  return {
    locale,
    text: (id, values) => intl.formatMessage({ id }, values),
    rich: (id, tags, values) => intl.formatMessage({ id }, { ...values, ...tags }),
    language: (of) => {
      const name = names.of(of);
      if (name === undefined) throw new Error(`No ${locale} name for the language ${of}`);
      return name;
    },
    list: (items) => {
      if (locale === "de") return lists.format(items);
      // The language's separators, except the one before the last item, which is "&".
      const parts = lists.formatToParts(items);
      const last = parts.findLastIndex((part) => part.type === "literal");
      return parts.map((part, index) => (index === last ? " & " : part.value)).join("");
    },
  };
}

export const translators: Readonly<Record<Locale, Translator>> = perLocale(translator);

/** A calendar day (`2026-10-14`) as the Date the formatters expect: midnight UTC. */
export function day(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/**
 * The sentence a person agrees to when joining a product's waiting list, in their language. The
 * form shows it and the Worker stores it with the entry, so both must build it the same way.
 */
export function waitlistConsent(locale: Locale, product: Product): string {
  const t = translators[locale];
  return t.text("waitlist_consent", { product: t.text(product.name) });
}
