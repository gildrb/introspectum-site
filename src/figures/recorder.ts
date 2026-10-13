import type { Machine } from "./live.ts";
import { translate } from "./projection.ts";
import { lanes, length, liveParts, pose, rest } from "./recorder-model.ts";

/** A rod the build drew as three paths: its body, its shaded half and its edges. */
type Rod = { body: SVGElement; shade: SVGElement; edges: SVGElement };
type RodPaths = { body: string; shade: string; edges: string };

/** Redraws a rod from its new paths. */
function shape(rod: Rod, paths: RodPaths) {
  rod.body.setAttribute("d", paths.body);
  rod.shade.setAttribute("d", paths.shade);
  rod.edges.setAttribute("d", paths.edges);
}

/**
 * The bank of chart recorders (`recorder-model.ts`): the paper runs on, the pens follow each
 * stock's price and trend, the rolls turn and the governor spins.
 */
export const recorder: Machine = {
  length,
  rate: 0.04,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The recorder figure has no ${name}.`);
      return element;
    };
    const rodOf = (name: string): Rod => ({
      body: one(name),
      shade: one(`${name}-shade`),
      edges: one(`${name}-edges`),
    });
    const recorders = lanes.map((_, index) => ({
      papers: [...svg.querySelectorAll<SVGElement>(`[data-part="paper-${index}"]`)],
      ruling: one(`ruling-${index}`),
      priceArm: rodOf(`price-arm-${index}`),
      trendArm: rodOf(`trend-arm-${index}`),
      rod: rodOf(`rod-${index}`),
      pricePen: one(`price-pen-${index}`),
      trendPen: one(`trend-pen-${index}`),
      pin: one(`pin-${index}`),
      feedSpokes: one(`feed-spokes-${index}`),
      takeSpokes: one(`take-spokes-${index}`),
    }));
    const fly = (slot: "back" | "front") => ({
      link: rodOf(`fly-${slot}-link`),
      arm: rodOf(`fly-${slot}-arm`),
      ball: one(`fly-${slot}-ball`),
    });
    const flies = { back: fly("back"), front: fly("front") };
    const notches = one("notches");

    return (t) => {
      const live = liveParts(pose(t), P);
      for (const [index, parts] of live.recorders.entries()) {
        const bound = recorders[index];
        if (bound === undefined) continue;
        const paper = translate(parts.paper);
        for (const sheet of bound.papers) sheet.setAttribute("transform", paper);
        bound.ruling.setAttribute("transform", translate(parts.ruling));
        shape(bound.priceArm, parts.priceArm);
        shape(bound.trendArm, parts.trendArm);
        shape(bound.rod, parts.rod);
        bound.pricePen.setAttribute("transform", translate(parts.pricePen));
        bound.trendPen.setAttribute("transform", translate(parts.trendPen));
        bound.pin.setAttribute("transform", translate(parts.pin));
        bound.feedSpokes.setAttribute("d", parts.feedSpokes);
        bound.takeSpokes.setAttribute("d", parts.takeSpokes);
      }
      // The two balls are alike, so the nearer one is always drawn in the front slot.
      for (const slot of ["back", "front"] satisfies ("back" | "front")[]) {
        const parts = live[slot];
        shape(flies[slot].link, parts.link);
        shape(flies[slot].arm, parts.arm);
        flies[slot].ball.setAttribute("transform", translate(parts.ball));
      }
      notches.setAttribute("d", live.notches);
    };
  },
};
