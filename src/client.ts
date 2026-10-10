import { h, hydrate } from "preact";
import { isWaitlistProps, Waitlist } from "./islands/waitlist.tsx";

// The islands are server-rendered and work without JavaScript: let the first frame paint, then
// hydrate each one in its own task with the props `Island` recorded on the server.
requestAnimationFrame(() => {
  for (const element of document.querySelectorAll<HTMLElement>("[data-island]")) {
    const props: unknown = JSON.parse(element.dataset.props ?? "null");
    if (element.dataset.island !== "waitlist" || !isWaitlistProps(props))
      throw new Error(`Unknown island or props: ${element.dataset.island}`);
    setTimeout(() => hydrate(h(Waitlist, props), element));
  }
});
