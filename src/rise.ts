import { inView } from "motion";
// The browser's own animations (WAAPI), without Motion's JavaScript engine: a fraction of the code,
// so this script never competes with the page's fonts for the first paint.
import { animate } from "motion/mini";

/**
 * The homepage's motion, as the reader reaches each part. The page's own script stages it as soon
 * as the parser is past a part, not once the page has been read (`client.ts`).
 *
 * Cards marked `data-rise` come into sight rising out of a blur over a second. Cards that come into
 * view together rise one after another in the page's order, `stagger` apart, so the eye reads them
 * in turn; a card that comes into view alone rises at once. A card always rises, it never just
 * appears.
 *
 * A measurement & its figures (`islands/stat.tsx`) meet on its card: the island marks the card
 * `ready` once its figures stand at zero, and hears `riseEvent` when it starts to rise; a card
 * already `risen` when the island arrives keeps its real values. A card that comes into view
 * before its figures are ready waits for them `wait` seconds at most, then rises with its real
 * values standing still.
 *
 * Titles marked `data-sweep` (`Sweep`) turn to the ink word by word once half of them is in view
 * (`rise-css.ts` holds the timing), leading the eye into the part they open.
 */

/** Set by the island once the card's figures stand at zero, ready to roll. */
export const readyAttribute = "data-rise-ready";
/** Set here once the part has started to rise, or was in sight before this script ran. */
export const risenAttribute = "data-risen";
/** Sent to the part as it starts to rise. */
export const riseEvent = "rise";

/**
 * One second per card on CSS `ease`, as the opening (`Hero`); cards that come into view together
 * 150 ms apart. A card rises once a quarter of it is in view. A measurement waits for its figures
 * up to 2.5 s, longer than its island takes to arrive on a slow connection (0.8 s from a reload
 * with the dev server, 15 October 2026): a card that waited only a moment rose before its figures
 * could roll whenever the page was reloaded with the measurements in view. The stylesheet's own
 * fallback (`rise-css.ts`) rises the same way, from `fallback` milliseconds after the page started.
 */
const entrance = {
  rise: 1,
  stagger: 0.15,
  wait: 2.5,
  ease: [0.25, 0.1, 0.25, 1],
  fallback: 3000,
} as const;

/** The parts already taken over from the stylesheet. */
const staged = new WeakSet<HTMLElement>();

/** The parts taken over that have not started to rise: shown at once if the page is printed. */
const waiting = new Set<HTMLElement>();

/** When the last part started to rise, in `performance.now()` milliseconds. */
let lastStart = Number.NEGATIVE_INFINITY;

/**
 * Settles once the last part that came into view has started to rise. Each part waits for the one
 * before it, so parts rise in the order they came into view, however late a card's figures are.
 */
let queue = Promise.resolve();

/**
 * The parts that have just come into view, not yet queued. The browser reports each part on its
 * own, in no set order: they are gathered for one task, then queued in the page's order.
 */
const entering: HTMLElement[] = [];

/** Queues the parts that have come into view since the last call, in the page's order. */
function queueEntering(): void {
  const parts = entering
    .splice(0)
    .toSorted((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  for (const part of parts) queue = Promise.all([ready(part), queue]).then(() => rise(part));
}

/** Printed, the parts still waiting stand in sight, without an entrance. */
function showWaiting(): void {
  for (const part of waiting) part.style.opacity = "1";
  waiting.clear();
}

/**
 * Takes over from the stylesheet the titles in `titles` not yet taken, & turns each to the ink as
 * the reader reaches it. A title the stylesheet has started on already is left to it.
 */
export function stageSweep(titles: readonly HTMLElement[]): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const started = Number(document.timeline.currentTime ?? 0) >= entrance.fallback;
  for (const title of titles) {
    if (staged.has(title) || started) continue;
    staged.add(title);
    title.setAttribute("data-staged", "");
    // Returning nothing from the callback makes Motion stop watching: the title turns once.
    inView(title, () => title.setAttribute("data-swept", ""), { amount: 0.5 });
  }
}

/**
 * Takes over from the stylesheet the cards in `parts` not yet taken, & brings each in as the
 * reader reaches it. Called again as the page arrives, for the cards the parser has read since.
 */
export function stageRise(parts: readonly HTMLElement[]): void {
  // The same listener twice is added once.
  addEventListener("beforeprint", showWaiting);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const part of parts) {
    if (staged.has(part)) continue;
    staged.add(part);
    // Already coming in by the stylesheet: let it finish, figures standing still.
    if (getComputedStyle(part).opacity !== "0") {
      part.setAttribute(risenAttribute, "");
      continue;
    }
    part.style.opacity = "0";
    part.style.animation = "none";
    waiting.add(part);
    // Returning nothing from the callback makes Motion stop watching: the part comes in once.
    inView(
      part,
      () => {
        if (entering.push(part) === 1) window.setTimeout(queueEntering, 0);
      },
      { amount: 0.25 },
    );
  }
}

/**
 * Resolves once the card's figures stand at zero, at once for a part without figures, or after
 * `entrance.wait` without them.
 */
function ready(part: HTMLElement): Promise<void> {
  if (part.hasAttribute(readyAttribute) || part.querySelector('[data-island="stat"]') === null)
    return Promise.resolve();
  const { promise, resolve } = Promise.withResolvers<void>();
  const watcher = new MutationObserver(() => {
    if (!part.hasAttribute(readyAttribute)) return;
    watcher.disconnect();
    window.clearTimeout(timer);
    resolve();
  });
  watcher.observe(part, { attributes: true, attributeFilter: [readyAttribute] });
  const timer = window.setTimeout(() => {
    watcher.disconnect();
    resolve();
  }, entrance.wait * 1000);
  return promise;
}

/**
 * Brings one part in once its turn comes: `stagger` after the part before it started, or at once
 * if that was longer ago. A part the reader has scrolled past by its turn just stands there, and
 * the next takes its turn at once, so a fast scroll never leaves a queue of entrances behind.
 */
async function rise(part: HTMLElement): Promise<void> {
  const wait = lastStart + entrance.stagger * 1000 - performance.now();
  if (wait > 0) {
    const { promise, resolve } = Promise.withResolvers<void>();
    window.setTimeout(resolve, wait);
    await promise;
  }
  // Printed before its turn: it stays in sight, without an entrance.
  if (!waiting.delete(part)) return;
  part.setAttribute(risenAttribute, "");
  part.dispatchEvent(new Event(riseEvent));
  const { top, bottom } = part.getBoundingClientRect();
  if (bottom < 0 || top > innerHeight) {
    part.style.opacity = "1";
    return;
  }
  lastStart = performance.now();
  const rising = animate(
    part,
    {
      opacity: [0, 1],
      transform: ["translateY(16px)", "none"],
      filter: ["blur(10px)", "blur(0px)"],
    },
    { duration: entrance.rise, ease: entrance.ease },
  );
  // Settled, the part stays in sight and keeps no trace of its entrance: no blur layer, no
  // transform.
  void rising.finished.then(() => {
    part.style.opacity = "1";
    part.style.removeProperty("filter");
    part.style.removeProperty("transform");
  });
}
