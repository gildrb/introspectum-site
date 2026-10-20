import type { Machine } from "./live.ts";
import { offsetOf, translate } from "./projection.ts";
import {
  type as face,
  guideTop,
  issue,
  length,
  pose,
  rest,
  span,
  spec,
  wire,
} from "./proof-model.ts";

/** Shows `element` or hides it, leaving it alone when nothing changes. */
function show(element: SVGElement, shown: boolean) {
  if (shown === !element.hasAttribute("display")) return;
  if (shown) element.removeAttribute("display");
  else element.setAttribute("display", "none");
}

/**
 * The proof bench (`proof-model.ts`): type the body, send it, read the verdict, then type again
 * or issue the certificate.
 */
export const proof: Machine = {
  length,
  rate: 0.085,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The proof figure has no ${name}.`);
      return element;
    };
    const rows = [one("typed-0"), one("typed-1")];
    const head = one("head");
    const rejected = one("tape-rejected");
    const proved = one("tape-proved");
    const needle = one("needle");
    const carrier = one("carrier");
    const guide = one("guide");
    const issued = one("issued");
    const hold = issued.querySelector<SVGElement>("[data-hold]");
    if (hold === null) throw new Error("The proof figure's certificate has no clip.");
    const drop = guideTop(spec.failing) - guideTop(0);
    const run = wire.dock.right - wire.dock.left;

    return (t) => {
      const p = pose(t);
      for (const [index, row] of rows.entries()) {
        const typed = p.typed[index] ?? "";
        if (row.textContent === typed) continue;
        row.textContent = typed;
        // Each line is stretched to its columns' width (`code` in `scripts/figures/proof.mjs`).
        if (typed.length === 0) row.removeAttribute("textLength");
        else row.setAttribute("textLength", String(Math.round(span(typed) * 1000) / 1000));
      }
      head.setAttribute("transform", translate(offsetOf([p.head * face.advance, 0, 0], P)));
      switch (p.tape.$) {
        case "Blank":
          show(rejected, false);
          show(proved, false);
          break;
        case "Rejected":
          show(rejected, true);
          show(proved, false);
          break;
        case "Proved":
          show(rejected, false);
          show(proved, true);
          break;
        default: {
          const _: never = p.tape;
          throw new Error(`Unknown tape ${JSON.stringify(_)}.`);
        }
      }
      needle.setAttribute("transform", `rotate(${Math.round((p.needle * 18000) / Math.PI) / 100})`);
      carrier.setAttribute("transform", translate(offsetOf([p.carrier * run, 0, 0], P)));
      guide.setAttribute("transform", translate(offsetOf([0, 0, drop * p.guide], P)));
      const out = offsetOf([0, 0, (p.issued - 1) * issue.h], P);
      issued.setAttribute("transform", translate(out));
      // The slot's clip stays at the slot while the card moves through it.
      hold.setAttribute("transform", translate([-out[0], -out[1]]));
    };
  },
};
