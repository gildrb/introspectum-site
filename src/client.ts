import { isMachineName, machines } from "./figures/machines.ts";

// This script is `async`: it may run while the page is still arriving, so a machine starts as
// soon as its own drawing is in, not once the whole page is.

// Pages with a drawn machine: the code that runs it on a loop, slower under the mouse. Each
// machine's code is fetched the moment its figure opens, while the drawing still arrives, and only
// for the machines the page has; pages without one never download any. A machine starts once the
// parser has moved past its drawing, so it binds a complete one.
const loading = new Map<HTMLElement, Promise<() => void>>();
const running = new Set<HTMLElement>();
function startMachines() {
  for (const figure of document.querySelectorAll<HTMLElement>("[data-machine]")) {
    if (running.has(figure)) continue;
    let start = loading.get(figure);
    if (start === undefined) {
      const name = figure.dataset.machine;
      if (!isMachineName(name)) throw new Error(`Unknown machine: ${name}`);
      // Dynamic: only pages with a machine need the code that runs it.
      start = Promise.all([import("./figures/live.ts"), machines[name]()]).then(
        ([{ run }, machine]) =>
          () =>
            run(figure, machine),
      );
      loading.set(figure, start);
    }
    const svg = figure.querySelector("svg");
    if (svg === null || !parsedPast(svg)) continue;
    running.add(figure);
    void start.then((run) => run());
  }
}
/** Whether the parser has read all of `node`: something follows it, or the page is complete. */
function parsedPast(node: Node): boolean {
  if (document.readyState !== "loading") return true;
  for (let at: Node | null = node; at !== null; at = at.parentNode)
    if (at.nextSibling !== null) return true;
  return false;
}
startMachines();
if (document.readyState === "loading") {
  const parser = new MutationObserver(startMachines);
  parser.observe(document, { childList: true, subtree: true });
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      parser.disconnect();
      startMachines();
    },
    { once: true },
  );
}

// Every page, in a browser with WebMCP: the site's read-only tools for the visitor's agent,
// registered at once so an agent sees them as the page loads. Imported only there, so other
// browsers never wait for its code (and the site data it carries) before a machine can start.
const modelContext: unknown =
  Reflect.get(document, "modelContext") ?? Reflect.get(navigator, "modelContext");
if (typeof modelContext === "object" && modelContext !== null)
  void import("./webmcp.ts").then(({ registerTools }) => registerTools(modelContext));

// Everything below works on the whole page: wait until it has been read.
if (document.readyState === "loading") {
  const { promise, resolve } = Promise.withResolvers<void>();
  document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  await promise;
}

// The islands are server-rendered and work without JavaScript. Only pages that have one load
// Preact & the code of the islands they have: let the first frame paint, then hydrate each one in
// its own task with the props `Island` recorded on the server. The header logo's menu is an island
// on every page that only a right click needs: it waits until the browser is idle, so it never
// holds up the first paint, the machines or the page's own islands. Until then, a right click on
// the logo opens the browser's own menu.
const islands = Array.from(document.querySelectorAll<HTMLElement>("[data-island]"));
const later = islands.filter((element) => element.dataset.island === "logo");
const now = islands.filter((element) => !later.includes(element));
if (now.length > 0) void hydrateIslands(now);
if (later.length > 0) whenIdle(() => void hydrateIslands(later));

async function hydrateIslands(elements: readonly HTMLElement[]): Promise<void> {
  const names = new Set(elements.map((element) => element.dataset.island));
  const [{ h, hydrate }, waitlist, contact, stat, logo] = await Promise.all([
    import("preact"),
    names.has("waitlist") ? import("./islands/waitlist.tsx") : null,
    names.has("contact") ? import("./islands/contact.tsx") : null,
    names.has("stat") ? import("./islands/stat.tsx") : null,
    names.has("logo") ? import("./islands/logo.tsx") : null,
  ]);
  requestAnimationFrame(() => {
    for (const element of elements) {
      const name = element.dataset.island;
      const props: unknown = JSON.parse(element.dataset.props ?? "null");
      if (name === "waitlist" && waitlist !== null && waitlist.isWaitlistProps(props))
        setTimeout(() => hydrate(h(waitlist.Waitlist, props), element));
      else if (name === "contact" && contact !== null && contact.isContactProps(props))
        setTimeout(() => hydrate(h(contact.Contact, props), element));
      else if (name === "stat" && stat !== null && stat.isStatProps(props))
        setTimeout(() => hydrate(h(stat.Stat, props), element));
      else if (name === "logo" && logo !== null && logo.isLogoMenuProps(props))
        setTimeout(() => hydrate(h(logo.LogoMenu, props), element));
      else throw new Error(`Unknown island or props: ${name}`);
    }
  });
}

/**
 * Runs `task` once the browser has nothing more pressing to do. Safari has no idle callback: there
 * it runs once the page has loaded, its images & fonts included.
 */
function whenIdle(task: () => void): void {
  if ("requestIdleCallback" in window) requestIdleCallback(task, { timeout: 3000 });
  else if (document.readyState === "complete") setTimeout(task);
  else addEventListener("load", () => setTimeout(task), { once: true });
}
