import { logoMenu } from "./logo-menu.ts";

// Every page: the header logo's menu. Its parts are server-rendered; it only needs its events.
const logo = document.querySelector<HTMLAnchorElement>("a[data-logo-menu]");
const menu = document.getElementById(logo?.dataset.logoMenu ?? "");
if (logo === null || menu === null) throw new Error("The header logo or its menu is missing.");
logoMenu(logo, menu);

// The islands are server-rendered and work without JavaScript. Only pages that have one load
// Preact & the island's code: let the first frame paint, then hydrate each one in its own task
// with the props `Island` recorded on the server.
const islands = document.querySelectorAll<HTMLElement>("[data-island]");
if (islands.length > 0) {
  const [{ h, hydrate }, { isWaitlistProps, Waitlist }] = await Promise.all([
    import("preact"),
    import("./islands/waitlist.tsx"),
  ]);
  requestAnimationFrame(() => {
    for (const element of islands) {
      const props: unknown = JSON.parse(element.dataset.props ?? "null");
      if (element.dataset.island !== "waitlist" || !isWaitlistProps(props))
        throw new Error(`Unknown island or props: ${element.dataset.island}`);
      setTimeout(() => hydrate(h(Waitlist, props), element));
    }
  });
}
