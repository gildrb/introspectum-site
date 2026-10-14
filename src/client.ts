import { logoMenu } from "./logo-menu.ts";
import { registerTools } from "./webmcp.ts";

// Every page: the header logo's menu. Its parts are server-rendered; it only needs its events.
const logo = document.querySelector<HTMLAnchorElement>("a[data-logo-menu]");
const menu = document.getElementById(logo?.dataset.logoMenu ?? "");
if (logo === null || menu === null) throw new Error("The header logo or its menu is missing.");
logoMenu(logo, menu);

// Every page, in a browser with WebMCP: the site's read-only tools for the visitor's agent,
// registered at once so an agent sees them as the page loads.
const modelContext: unknown =
  Reflect.get(document, "modelContext") ?? Reflect.get(navigator, "modelContext");
if (typeof modelContext === "object" && modelContext !== null) registerTools(modelContext);

// Pages with a drawn machine: the code that runs it on a loop, slower under the pointer. Imported on
// demand, like the islands, so pages without one never download it.
const figures = document.querySelectorAll<HTMLElement>("[data-machine]");
if (figures.length > 0) {
  const [{ run }, { isMachineName, machines }] = await Promise.all([
    import("./figures/live.ts"),
    import("./figures/machines.ts"),
  ]);
  for (const figure of figures) {
    const name = figure.dataset.machine;
    if (!isMachineName(name)) throw new Error(`Unknown machine: ${name}`);
    run(figure, machines[name]);
  }
}

// The islands are server-rendered and work without JavaScript. Only pages that have one load
// Preact & the code of the islands they have: let the first frame paint, then hydrate each one in
// its own task with the props `Island` recorded on the server.
const islands = document.querySelectorAll<HTMLElement>("[data-island]");
if (islands.length > 0) {
  const names = new Set(Array.from(islands, (element) => element.dataset.island));
  const [{ h, hydrate }, waitlist, contact] = await Promise.all([
    import("preact"),
    names.has("waitlist") ? import("./islands/waitlist.tsx") : null,
    names.has("contact") ? import("./islands/contact.tsx") : null,
  ]);
  requestAnimationFrame(() => {
    for (const element of islands) {
      const name = element.dataset.island;
      const props: unknown = JSON.parse(element.dataset.props ?? "null");
      if (name === "waitlist" && waitlist !== null && waitlist.isWaitlistProps(props))
        setTimeout(() => hydrate(h(waitlist.Waitlist, props), element));
      else if (name === "contact" && contact !== null && contact.isContactProps(props))
        setTimeout(() => hydrate(h(contact.Contact, props), element));
      else throw new Error(`Unknown island or props: ${name}`);
    }
  });
}
