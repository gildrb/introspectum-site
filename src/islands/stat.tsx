import { Numbers } from "@sfinterface/numbers";
import { readyAttribute, riseEvent, risenAttribute } from "../stat-cards.ts";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { NumberPart } from "../i18n.ts";
import { isLocale, type Locale, localeInfo } from "../locale.ts";

export type StatProps = {
  locale: Locale;
  /** The measurement as `Translator.numbers` cut it: "12,801", or "3 of 3" as number, words, number. */
  parts: readonly NumberPart[];
};

function isNumberPart(value: unknown): value is NumberPart {
  if (typeof value !== "object" || value === null || !("$" in value)) return false;
  if (value.$ === "Text") return "text" in value && typeof value.text === "string";
  if (value.$ === "Number")
    return "value" in value && typeof value.value === "number" && Number.isFinite(value.value);
  return false;
}

export function isStatProps(value: unknown): value is StatProps {
  if (typeof value !== "object" || value === null) return false;
  if (!("locale" in value) || typeof value.locale !== "string" || !isLocale(value.locale))
    return false;
  return "parts" in value && Array.isArray(value.parts) && value.parts.every(isNumberPart);
}

/**
 * Where the figures stand. `Served`: the real values, still: as served, and for a card that rose
 * before the island arrived. `Zero`: zeros, the card still out of sight, waiting to rise.
 * `Rolling`: rolling up from the zeros to the real values as the card rises.
 */
type Phase = { $: "Served" } | { $: "Zero" } | { $: "Rolling" };

/** How long the figures take to roll up, in milliseconds. */
const rollLength = 1400;

/**
 * One of the homepage's measurements, its figures set by `@sfinterface/numbers` in the page's
 * language. The card's entrance belongs to the page's script (`stat-cards.ts`): this island only
 * sets the figures to zero while the card is out of sight and rolls them up as it rises, so they
 * are never shown at their values and then taken back. A card that rose before the island
 * arrived, reduced motion, and no JavaScript all keep the real values standing still.
 */
export function Stat({ locale, parts }: StatProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>({ $: "Served" });
  const format = new Intl.NumberFormat(localeInfo[locale].tag);

  useLayoutEffect(() => {
    const card = root.current?.closest<HTMLElement>("[data-stat-card]");
    if (card === null || card === undefined) throw new Error("The measurement has no card.");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || card.hasAttribute(risenAttribute))
      return undefined;
    setPhase({ $: "Zero" });
    let timer = 0;
    const onRise = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "number")
        throw new Error("A card rose without its delay.");
      const delay = event.detail;
      // The figures start turning as the card starts rising.
      timer = window.setTimeout(() => setPhase({ $: "Rolling" }), delay * 1000);
    };
    card.addEventListener(riseEvent, onRise, { once: true });
    card.setAttribute(readyAttribute, "");
    return () => {
      card.removeEventListener(riseEvent, onRise);
      window.clearTimeout(timer);
    };
  }, []);

  const zero = phase.$ === "Zero";

  return (
    <span ref={root}>
      {parts.map((part, index) => {
        switch (part.$) {
          case "Text":
            return part.text;
          case "Number":
            // A screen reader always hears the real value, whatever the digits show.
            return (
              <Numbers
                key={index}
                value={zero ? 0 : part.value}
                // At zero, every column the value needs shows a 0, so each one turns up to its
                // digit, as on an odometer, rather than new columns simply appearing.
                format={zero ? zeros(part.value) : plain}
                locale={localeInfo[locale].tag}
                label={format.format(part.value)}
                duration={zero ? 0 : rollLength}
                style={figures}
              />
            );
          default: {
            const _: never = part;
            return _;
          }
        }
      })}
    </span>
  );
}

/** The real values' format: the locale's plain one. */
const plain: Intl.NumberFormatOptions = {};

/** One format per width, reused, so the figures keep their columns between renders. */
const zeroFormats = new Map<number, Intl.NumberFormatOptions>();

/** A format that writes zero with as many integer digits as `value` has: `00,000` for 12,801. */
function zeros(value: number): Intl.NumberFormatOptions {
  const digits = String(Math.trunc(Math.abs(value))).length;
  const known = zeroFormats.get(digits);
  if (known !== undefined) return known;
  const made = { minimumIntegerDigits: digits };
  zeroFormats.set(digits, made);
  return made;
}

/**
 * The figures set as the words around them: the measurement's lining figures (its stylesheet would
 * set its own). Each digit keeps its taller window, so the digits passing by stay out of sight, but
 * takes only one line of the measurement, so the card keeps its height. Inline, as the stylesheet's
 * own layer comes after StyleX's and would win over a class.
 */
const figures = {
  fontVariantNumeric: "inherit",
  fontFeatureSettings: "inherit",
  marginBlock: "calc((1lh - var(--sfi-numbers-cell)) / 2)",
};
