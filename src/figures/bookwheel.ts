import { length, liveParts, pose, rest, shelves } from "./bookwheel-model.ts";
import type { Machine } from "./live.ts";
import { translate } from "./projection.ts";

/**
 * Ramelli's book wheel (`bookwheel-model.ts`): the wheel turns one lectern on every 7 seconds, its
 * spokes and pinions redrawn, its lecterns carried round level. The cycle count carries the turn
 * on, so each source comes round in turn and the wheel never runs back.
 */
export const bookwheel: Machine = {
  length,
  rate: 1 / 7,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The book wheel figure has no ${name}.`);
      return element;
    };
    /** A side frame's spokes, redrawn from their new paths. */
    const spokes = (side: "far" | "near") => {
      const body = one(`${side}-spokes`);
      const shade = one(`${side}-spokes-shade`);
      const edges = one(`${side}-spokes-edges`);
      return (paths: { body: string; shade: string; edges: string }) => {
        body.setAttribute("d", paths.body);
        shade.setAttribute("d", paths.shade);
        edges.setAttribute("d", paths.edges);
      };
    };
    const redrawFar = spokes("far");
    const redrawNear = spokes("near");
    const lecterns = Array.from({ length: shelves }, (_, index) => ({
      shelf: one(`shelf-${index}`),
      pin: one(`pin-${index}`),
    }));
    const farJoints = one("far-joints");
    const nearJoints = one("near-joints");
    const pinions = one("pinions");
    const pinionEdges = one("pinion-edges");
    const pinionBores = one("pinion-bores");

    return (t, cycle) => {
      const live = liveParts(pose(t, cycle), P);
      for (const [index, offset] of live.shelves.entries()) {
        const lectern = lecterns[index];
        if (lectern === undefined) continue;
        const shift = translate(offset);
        lectern.shelf.setAttribute("transform", shift);
        lectern.pin.setAttribute("transform", shift);
      }
      redrawFar(live.farSpokes);
      redrawNear(live.nearSpokes);
      farJoints.setAttribute("d", live.farJoints);
      nearJoints.setAttribute("d", live.nearJoints);
      pinions.setAttribute("d", live.pinions);
      pinionEdges.setAttribute("d", live.pinions);
      pinionBores.setAttribute("d", live.pinionBores);
    };
  },
};
