import type { Machine } from "./live.ts";
import { type Layer, length, liveParts, panShift, pose, rest, tallyOf } from "./mint-model.ts";
import { offsetOf, translate } from "./projection.ts";

const layers: readonly Layer[] = ["rise", "die", "back", "crucible", "free", "box"];

/** The mint (`mint-model.ts`): strike, weigh, then the crucible or the strongbox. */
export const mint: Machine = {
  length,
  rate: 0.32,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The mint figure has no ${name}.`);
      return element;
    };
    const press = [...svg.querySelectorAll<SVGElement>('[data-part="press"]')];
    const holds = press.flatMap((part) => [...part.querySelectorAll<SVGElement>("[data-hold]")]);
    const rods = [
      { body: one("bar"), shade: one("bar-shade"), edges: one("bar-edges"), part: "bar" },
      { body: one("beam"), shade: one("beam-shade"), edges: one("beam-edges"), part: "beam" },
    ] satisfies { part: "bar" | "beam"; body: SVGElement; shade: SVGElement; edges: SVGElement }[];
    const ballA = one("ball-a");
    const ballB = one("ball-b");
    const knobLeft = one("knob-left");
    const knobRight = one("knob-right");
    const panLeft = one("pan-left");
    const panRight = one("pan-right");
    const chains = one("chains");
    const needle = one("needle");
    const coins = layers.map((layer) => {
      const element = one(`coin-${layer}`);
      return { layer, element, hold: element.querySelector<SVGElement>("[data-hold]") };
    });
    const digits = [...one("tally").querySelectorAll("text")];

    return (t, cycle) => {
      const p = pose(t);
      const live = liveParts(p, P);
      const lift = offsetOf([0, 0, -p.ramDrop], P);
      for (const part of press) part.setAttribute("transform", translate(lift));
      // The screw's clips stay with the faces it slides through (`G.rodOut`).
      for (const hold of holds) hold.setAttribute("transform", translate([-lift[0], -lift[1]]));
      for (const rod of rods) {
        const paths = live[rod.part];
        rod.body.setAttribute("d", paths.body);
        rod.shade.setAttribute("d", paths.shade);
        rod.edges.setAttribute("d", paths.edges);
      }
      ballA.setAttribute("transform", translate(live.ballA));
      ballB.setAttribute("transform", translate(live.ballB));
      knobLeft.setAttribute("transform", translate(live.knobLeft));
      knobRight.setAttribute("transform", translate(live.knobRight));
      const shift = panShift(p.tilt);
      panLeft.setAttribute("transform", translate(offsetOf(shift, P)));
      panRight.setAttribute("transform", translate(offsetOf([-shift[0], 0, -shift[2]], P)));
      chains.setAttribute("d", live.chains);
      needle.setAttribute("d", live.needle);
      for (const { layer, element, hold } of coins) {
        if (p.coin !== null && p.layer === layer) {
          const offset = offsetOf(p.coin, P);
          element.setAttribute("transform", translate(offset));
          // A hole's clip stays at the hole while the coin moves through it.
          hold?.setAttribute("transform", translate([-offset[0], -offset[1]]));
          element.removeAttribute("display");
        } else element.setAttribute("display", "none");
      }
      const count = tallyOf(t, cycle);
      for (const [index, digit] of digits.entries()) {
        const shown = count[index];
        if (shown === undefined)
          throw new Error(`The tally reads ${count}, wider than its wheels.`);
        if (digit.textContent !== shown) digit.textContent = shown;
      }
    };
  },
};
