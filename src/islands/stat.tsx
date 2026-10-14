import { Numbers } from "@sfinterface/numbers";
import { type AnimationPlaybackControls, animate, inView } from "motion";
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
 * Where the figures stand. `Pending`: as served, the real values, their card kept out of sight by
 * the page's stylesheet (`pendingCss`) until the script takes over, or shown by it as it is if the
 * script is late. `Served`: the real values in sight, still. `Hidden`: zeros, the card out of
 * sight, waiting to be seen. `Rolling`: the card rising into sight while its figures roll up from
 * the zeros to the real values.
 */
type Phase = { $: "Pending" } | { $: "Served" } | { $: "Hidden" } | { $: "Rolling" };

/**
 * How long a card takes to rise into sight (as the homepage's opening does, on Linear's measured
 * rhythm), how long its figures take to roll up, and how far apart the cards of the row start,
 * from left to right.
 */
const motion = { rise: 1, roll: 1400, stagger: 0.15 };

/** How long the stylesheet waits for the script before it shows the cards as they are. */
const patience = 3000;

/**
 * The stylesheet the homepage carries for its measurement cards (`data-stat-card`): served, they
 * wait out of sight for this island, which brings them in. Shown at once with reduced motion and
 * without JavaScript (`noscriptCss`), and after `patience` when the script is late, so a card is
 * never missing for long and never shows anything but its real value or a roll up to it.
 */
export const pendingCss = `[data-stat-card]{opacity:0;animation:stat-patience 0s ${patience}ms both}@keyframes stat-patience{to{opacity:1}}@media (prefers-reduced-motion:reduce){[data-stat-card]{opacity:1;animation:none}}`;
export const noscriptCss = "[data-stat-card]{opacity:1;animation:none}";

/**
 * One of the homepage's measurements, its figures set by `@sfinterface/numbers` in the page's
 * language. Once most of its card is in view, the card rises into sight out of a blur, a little
 * after the card to its left, while its figures roll up from zeros: the figures are never shown at
 * their values and then taken back. With reduced motion, without JavaScript, or with a script
 * later than `patience`, the cards stand there with their real values.
 */
export function Stat({ locale, parts, order }: StatProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>({ $: "Pending" });
  const format = new Intl.NumberFormat(localeInfo[locale].tag);

  useLayoutEffect(() => {
    const card = root.current?.closest<HTMLElement>("[data-stat-card]");
    if (card === null || card === undefined) throw new Error("The measurement has no card.");
    // Already in sight, through reduced motion or a late script: it stays as it is.
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      getComputedStyle(card).opacity === "1"
    ) {
      setPhase({ $: "Served" });
      return undefined;
    }
    // Held out of sight by the script from here on, not by the stylesheet's patience.
    card.style.opacity = "0";
    card.style.animation = "none";
    setPhase({ $: "Hidden" });
    let rising: AnimationPlaybackControls | null = null;
    let timer = 0;
    // Returning nothing from the callback makes Motion stop watching: the card comes in once.
    const stop = inView(
      card,
      () => {
        const delay = order * motion.stagger;
        rising = animate(
          card,
          { opacity: [0, 1], y: [16, 0], filter: ["blur(10px)", "blur(0px)"] },
          { duration: motion.rise, delay, ease: [0.25, 0.1, 0.25, 1] },
        );
        // The figures start turning as the card starts rising.
        timer = window.setTimeout(() => setPhase({ $: "Rolling" }), delay * 1000);
        // Settled, the card keeps no trace of its entrance: no blur layer, no transform. Motion
        // writes the final values as it finishes, so they go a frame later.
        void rising.finished.then(() =>
          requestAnimationFrame(() => {
            card.style.removeProperty("filter");
            card.style.removeProperty("transform");
          }),
        );
      },
      { amount: 0.6 },
    );
    return () => {
      stop();
      window.clearTimeout(timer);
      rising?.stop();
    };
  }, [order]);

  const zero = phase.$ === "Hidden";

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
                duration={zero ? 0 : motion.roll}
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
