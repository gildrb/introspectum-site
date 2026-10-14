import { animate, inView } from "motion";

/**
 * The homepage's measurement cards (`data-stat-card`) come into sight as the reader reaches them,
 * one after another from left to right, each rising out of a blur over a second while its figures
 * roll up from zeros (`islands/stat.tsx`). The entrance is run here, by the page's own script as
 * soon as the page has been read, not by the figures' island, which hydrates later (Preact & the
 * figures' code first): a card always rises, it never just appears.
 *
 * The two meet on the card: the island marks it `ready` once its figures stand at zero, and hears
 * `riseEvent` when it starts to rise; a card already `risen` when the island arrives keeps its real
 * values. A card that comes into view before its figures are ready waits for them `wait` seconds at
 * most, then rises with its real values standing still.
 */

/** Set by the island once the card's figures stand at zero, ready to roll. */
export const readyAttribute = "data-stat-ready";
/** Set here once the card has started to rise, or was in sight before this script ran. */
export const risenAttribute = "data-stat-risen";
/** Sent to the card as it starts to rise; `detail` is its delay in seconds. */
export const riseEvent = "statrise";

/**
 * One second per card on CSS `ease`, as the opening (`Hero`); cards 150 ms apart. A card rises
 * once a quarter of it is in view, and waits for its figures a third of a second at most.
 */
const entrance = { rise: 1, stagger: 0.15, wait: 0.3, ease: [0.25, 0.1, 0.25, 1] } as const;

/**
 * How long the stylesheet waits for this script, in milliseconds, before it brings the cards in
 * by itself, with the same rise and stagger and real values standing still.
 */
const patience = 3000;

/**
 * The stylesheet the homepage carries for its cards: served, they wait out of sight for this
 * script. Without JavaScript (`noscriptCss`) and with reduced motion they stand there from the
 * start; if this script is later than `patience`, the stylesheet brings them in itself, the same
 * way. Either way a card rises; it never pops into sight.
 */
export const pendingCss = [
  "@keyframes stat-rise{from{opacity:0;transform:translateY(16px);filter:blur(10px)}to{opacity:1;transform:none;filter:none}}",
  `[data-stat-card]{animation:stat-rise ${entrance.rise}s cubic-bezier(${entrance.ease.join(",")}) ${patience}ms both}`,
  ...[1, 2, 3].map(
    (step) =>
      `[data-stat-card]:nth-child(${step + 1}){animation-delay:${patience + step * entrance.stagger * 1000}ms}`,
  ),
  "@media (prefers-reduced-motion:reduce){[data-stat-card]{animation:none}}",
].join("");
export const noscriptCss = "[data-stat-card]{animation:none}";

/** Takes the cards over from the stylesheet and brings each in as the reader reaches it. */
export function stageCards(): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-stat-card]"));
  cards.forEach((card, order) => {
    // Already coming in by the stylesheet: let it finish, figures standing still.
    if (getComputedStyle(card).opacity !== "0") {
      card.setAttribute(risenAttribute, "");
      return;
    }
    card.style.opacity = "0";
    card.style.animation = "none";
    // Returning nothing from the callback makes Motion stop watching: the card comes in once.
    inView(
      card,
      () => {
        void ready(card).then(() => rise(card, order));
      },
      { amount: 0.25 },
    );
  });
}

/** Resolves once the card's figures stand at zero, or after `entrance.wait` without them. */
function ready(card: HTMLElement): Promise<void> {
  if (card.hasAttribute(readyAttribute)) return Promise.resolve();
  const { promise, resolve } = Promise.withResolvers<void>();
  const watcher = new MutationObserver(() => {
    if (!card.hasAttribute(readyAttribute)) return;
    watcher.disconnect();
    window.clearTimeout(timer);
    resolve();
  });
  watcher.observe(card, { attributes: true, attributeFilter: [readyAttribute] });
  const timer = window.setTimeout(() => {
    watcher.disconnect();
    resolve();
  }, entrance.wait * 1000);
  return promise;
}

/** Brings one card in, `order` steps after the first of its row. */
function rise(card: HTMLElement, order: number): void {
  const delay = order * entrance.stagger;
  card.setAttribute(risenAttribute, "");
  card.dispatchEvent(new CustomEvent<number>(riseEvent, { detail: delay }));
  const rising = animate(
    card,
    { opacity: [0, 1], y: [16, 0], filter: ["blur(10px)", "blur(0px)"] },
    { duration: entrance.rise, delay, ease: entrance.ease },
  );
  // Settled, the card keeps no trace of its entrance: no blur layer, no transform. Motion writes
  // the final values as it finishes, so they go a frame later.
  void rising.finished.then(() =>
    requestAnimationFrame(() => {
      card.style.removeProperty("filter");
      card.style.removeProperty("transform");
    }),
  );
}
