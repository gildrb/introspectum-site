import { book, digitsOf, entryOf, inkOf, length, pose, ratchetOf, rest } from "./ledger-model.ts";
import type { Machine } from "./live.ts";
import { offsetOf, translate } from "./projection.ts";

/** The counting house desk (`ledger-model.ts`): stamp, post through the slot, feed, read. */
export const ledger: Machine = {
  length,
  rate: 0.14,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The ledger figure has no ${name}.`);
      return element;
    };
    const stamp = one("stamp");
    const ratchet = one("ratchet");
    const ratchetEdges = one("ratchet-edges");
    const wheels = [...one("wheels").querySelectorAll("text")];
    const slip = one("slip");
    const imprint = one("imprint");
    const printed = imprint.querySelector("text");
    const pages = one("book");
    const fresh = one("fresh");
    const lens = [one("lens"), one("carriage")];
    const rows = [...svg.querySelectorAll<SVGElement>("[data-row]")].map((element) => ({
      row: Number(element.dataset.row),
      text: element.querySelector("text"),
      ink: element.querySelector("path"),
      entry: -1,
    }));
    /** The cycle the drawing's numbers and ink were last written for. */
    let written = -1;

    return (t, cycle) => {
      const p = pose(t);
      stamp.setAttribute("transform", translate(offsetOf(p.stamp, P)));
      const turned = ratchetOf(p.turn, P);
      ratchet.setAttribute("d", turned);
      ratchetEdges.setAttribute("d", turned);
      // The wheels show the number they print next; the stamp is the only way to add one.
      const next = digitsOf(entryOf(book.next, cycle) + (p.struck ? 1 : 0));
      for (const [index, wheel] of wheels.entries()) {
        const shown = next[index] ?? "0";
        if (wheel.textContent !== shown) wheel.textContent = shown;
      }
      if (p.slip === null) slip.setAttribute("display", "none");
      else {
        slip.setAttribute("transform", translate(offsetOf(p.slip, P)));
        slip.removeAttribute("display");
      }
      if (p.inked) imprint.removeAttribute("display");
      else imprint.setAttribute("display", "none");
      pages.setAttribute("transform", translate(offsetOf([0, -p.feed, 0], P)));
      if (p.posted) fresh.removeAttribute("display");
      else fresh.setAttribute("display", "none");
      const reading = translate(offsetOf([p.lens, 0, 0], P));
      for (const part of lens) part.setAttribute("transform", reading);
      if (written === cycle) return;
      // Each wrap feeds the book back by a row and numbers every row one on: the same picture.
      written = cycle;
      const posting = digitsOf(entryOf(book.next, cycle));
      if (printed !== null) printed.textContent = posting;
      for (const row of rows) {
        const entry = entryOf(row.row, cycle);
        if (row.entry === entry) continue;
        row.entry = entry;
        if (row.text !== null) row.text.textContent = digitsOf(entry);
        if (row.ink !== null) row.ink.setAttribute("d", inkOf(entry, row.row, P));
      }
    };
  },
};
