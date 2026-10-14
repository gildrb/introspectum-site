import { Numbers } from "@sfinterface/numbers";
import { inView } from "motion";
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
 * One of the homepage's measurements, its figures set by `@sfinterface/numbers` in the page's
 * language. The server sets the real values, which is all a page without JavaScript, or a visitor
 * who asks for reduced motion, ever sees. Hydrated below or above the screen, the figures drop to
 * zero out of sight and roll up to their values once the whole measurement comes into view, a
 * single time; hydrated on screen, they stay as they are, so nothing visibly falls back.
 */
export function Stat({ locale, parts }: StatProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [arrived, setArrived] = useState(true);
  const format = new Intl.NumberFormat(localeInfo[locale].tag);

  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) throw new Error("The measurement's figures are missing.");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { top, bottom } = element.getBoundingClientRect();
    if (!still && (bottom <= 0 || top >= innerHeight)) setArrived(false);
    // Returning nothing from the callback makes Motion stop watching: the roll plays once. Where
    // the figures never dropped, coming into view changes nothing.
    return inView(
      element,
      () => {
        setArrived(true);
      },
      { amount: "all" },
    );
  }, []);

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
                value={arrived ? part.value : 0}
                locale={localeInfo[locale].tag}
                label={format.format(part.value)}
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
