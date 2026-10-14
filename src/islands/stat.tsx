import { Numbers } from "@sfinterface/numbers";
import { inView } from "motion";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { NumberPart } from "../i18n.ts";
import { isLocale, type Locale, localeInfo } from "../locale.ts";

export type StatProps = {
  locale: Locale;
  /** The measurement as `Translator.numbers` cut it: "12,801", or "3 of 3" as number, words, number. */
  parts: readonly NumberPart[];
  /** Its place in the row, from 0: each measurement rolls a little after the one before. */
  order: number;
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
  if (!("order" in value) || typeof value.order !== "number" || !Number.isInteger(value.order))
    return false;
  return "parts" in value && Array.isArray(value.parts) && value.parts.every(isNumberPart);
}

/**
 * Where the figures stand: the real values as served; at zero, set without motion; or rolling up
 * to the real values.
 */
type Phase = { $: "Served" } | { $: "Zero" } | { $: "Rolling" };

/** How long the figures take to roll up, and how far apart the measurements of the row start. */
const roll = { length: 1400, stagger: 140 };

/**
 * One of the homepage's measurements, its figures set by `@sfinterface/numbers` in the page's
 * language. The server sets the real values, which is all a page without JavaScript, or a visitor
 * who asks for reduced motion, ever sees. Hydrated, the figures go to zero at once and roll up to
 * their values, slowly and one measurement after another, once most of the row is in view; a row
 * already in view rolls at once.
 */
export function Stat({ locale, parts, order }: StatProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>({ $: "Served" });
  const format = new Intl.NumberFormat(localeInfo[locale].tag);

  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) throw new Error("The measurement's figures are missing.");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    setPhase({ $: "Zero" });
    let timer = 0;
    // Returning nothing from the callback makes Motion stop watching: the roll plays once.
    const stop = inView(
      element,
      () => {
        timer = window.setTimeout(() => setPhase({ $: "Rolling" }), order * roll.stagger);
      },
      { amount: 0.6 },
    );
    return () => {
      stop();
      window.clearTimeout(timer);
    };
  }, [order]);

  let duration: number;
  switch (phase.$) {
    case "Served":
    case "Rolling":
      duration = roll.length;
      break;
    case "Zero":
      duration = 0;
      break;
    default: {
      const _: never = phase;
      return _;
    }
  }

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
                value={phase.$ === "Zero" ? 0 : part.value}
                // At zero, every column the value needs shows a 0, so each one turns up to its
                // digit, as on an odometer, rather than new columns simply appearing.
                format={phase.$ === "Zero" ? zeros(part.value) : plain}
                locale={localeInfo[locale].tag}
                label={format.format(part.value)}
                duration={duration}
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
