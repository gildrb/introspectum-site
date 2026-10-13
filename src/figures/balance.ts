import { length, liveParts, panShift, pose, rest } from "./balance-model.ts";
import type { Machine } from "./live.ts";
import { offsetOf, translate } from "./projection.ts";

/** The assayer's balance (`balance-model.ts`): freed, it swings, settles level and is held again. */
export const balance: Machine = {
  length,
  rate: 0.13,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The balance figure has no ${name}.`);
      return element;
    };
    const all = (name: string) => [...svg.querySelectorAll<SVGElement>(`[data-part="${name}"]`)];
    const rods = new Map(
      Object.keys(liveParts(pose(rest), P).rods).map((part) => [
        part,
        { body: one(part), shade: one(`${part}-shade`), edges: one(`${part}-edges`) },
      ]),
    );
    // The bar under the beam is drawn in two halves, either side of the pillar; each pan's
    // hanger in two, below the beam and its stirrup on the beam's end.
    const bars = all("bar");
    const left = all("left");
    const right = all("right");
    const apex = one("apex");
    const ball = one("ball");
    const padLeft = one("pad-left");
    const padRight = one("pad-right");
    const needle = one("needle");

    return (t) => {
      const p = pose(t);
      const live = liveParts(p, P);
      for (const [part, paths] of Object.entries(live.rods)) {
        const rod = rods.get(part);
        if (rod === undefined) continue;
        rod.body.setAttribute("d", paths.body);
        rod.shade.setAttribute("d", paths.shade);
        rod.edges.setAttribute("d", paths.edges);
      }
      const shift = panShift(p.tilt);
      const toLeft = translate(offsetOf(shift, P));
      const toRight = translate(offsetOf([-shift[0], 0, -shift[2]], P));
      for (const part of left) part.setAttribute("transform", toLeft);
      for (const part of right) part.setAttribute("transform", toRight);
      const lower = translate(live.bar);
      for (const part of bars) part.setAttribute("transform", lower);
      apex.setAttribute("transform", translate(live.apex));
      ball.setAttribute("transform", translate(live.ball));
      padLeft.setAttribute("transform", translate(live.padLeft));
      padRight.setAttribute("transform", translate(live.padRight));
      needle.setAttribute("d", live.needle);
    };
  },
};
