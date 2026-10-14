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
 * Where the figures stand. `Pending`: as served, the real values, kept out of sight by the page's
 * stylesheet (`pendingCss`) until the script takes over, or shown by it as they are if the script
 * is late. `Served`: the real values in sight, still. `Hidden`: zeros, out of sight, waiting to be
 * seen. `Rolling`: coming into sight while rolling up from the zeros to the real values.
 */
type Phase = { $: "Pending" } | { $: "Served" } | { $: "Hidden" } | { $: "Rolling" };

/**
 * How long the figures take to roll up and to come into sight, and how far apart the measurements
 * of the row start.
 */
const roll = { length: 1400, fade: 700, stagger: 140 };

/** How long the stylesheet waits for the script before it shows the real values as they are. */
const patience = 3000;

/**
 * The stylesheet the homepage carries for its measurements: served, they wait out of sight for
 * this island, which brings them in rolling. Shown at once with reduced motion and without
 * JavaScript (`noscriptCss`), and after `patience` when the script is late, so a figure is never
 * missing for long and never shows anything but its real value or a roll up to it.
 */
export const pendingCss = `[data-stat-pending]{opacity:0;animation:stat-patience 0s ${patience}ms both}@keyframes stat-patience{to{opacity:1}}@media (prefers-reduced-motion:reduce){[data-stat-pending]{opacity:1;animation:none}}`;
export const noscriptCss = "[data-stat-pending]{opacity:1;animation:none}";

/**
 * One of the homepage's measurements, its figures set by `@sfinterface/numbers` in the page's
 * language. Its figures first appear rolling up from zeros, slowly and one measurement after
 * another, once most of the row is in view; they are never shown at their values and then taken
 * back. With reduced motion, without JavaScript, or with a script later than `patience`, they
 * show their real values, still.
 */
export function Stat({ locale, parts, order }: StatProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>({ $: "Pending" });
  const format = new Intl.NumberFormat(localeInfo[locale].tag);

  useLayoutEffect(() => {
    const element = root.current;
    if (element === null) throw new Error("The measurement's figures are missing.");
    // Already in sight, through reduced motion or a late script: they stay as they are.
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      getComputedStyle(element).opacity === "1"
    ) {
      setPhase({ $: "Served" });
      return undefined;
    }
    setPhase({ $: "Hidden" });
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

  let zero: boolean;
  let style: Record<string, string | number> | undefined;
  switch (phase.$) {
    case "Pending":
    case "Served":
      zero = false;
      style = undefined;
      break;
    case "Hidden":
      zero = true;
      style = { opacity: 0 };
      break;
    case "Rolling":
      zero = false;
      style = { opacity: 1, transition: `opacity ${roll.fade}ms cubic-bezier(0.25, 0.1, 0.25, 1)` };
      break;
    default: {
      const _: never = phase;
      return _;
    }
  }

  return (
    <span ref={root} data-stat-pending={phase.$ === "Pending" ? "" : undefined} style={style}>
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
                duration={zero ? 0 : roll.length}
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
