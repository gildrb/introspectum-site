import type { Machine } from "./live.ts";
import { length, liveParts, pose, rest } from "./pantograph-model.ts";
import { offsetOf, translate } from "./projection.ts";

type Arm = "oa" | "de" | "ac" | "be";
/** The parts that ride on the linkage's joints, and the pencil, which also lifts. */
type Rider = "elbow" | "near" | "far" | "tracer" | "pencil" | "lead";

const arms: readonly Arm[] = ["oa", "de", "ac", "be"];
const riders: readonly Rider[] = ["elbow", "near", "far", "tracer", "pencil", "lead"];

/** The pantograph (`pantograph-model.ts`): trace the requirement, draw the copy, file it. */
export const pantograph: Machine = {
  length,
  rate: 0.1,
  rest,
  bind(svg, P) {
    const one = (name: string) => {
      const element = svg.querySelector<SVGElement>(`[data-part="${name}"]`);
      if (element === null) throw new Error(`The pantograph figure has no ${name}.`);
      return element;
    };
    const all = (name: string) => [...svg.querySelectorAll<SVGElement>(`[data-part="${name}"]`)];
    const rods = arms.map((part) => ({
      part,
      body: one(part),
      shade: one(`${part}-shade`),
      edges: one(`${part}-edges`),
    }));
    const groups = riders.map((part) => ({ part, elements: all(part) }));
    // The pencil's clip stays with the sleeve it slides out of (`G.rodOut`).
    const holds = all("lead").flatMap((part) => [
      ...part.querySelectorAll<SVGElement>("[data-hold]"),
    ]);
    const ink = one("ink");
    const sheet = one("sheet");

    return (t) => {
      const p = pose(t);
      const live = liveParts(p, P);
      for (const rod of rods) {
        const paths = live[rod.part];
        rod.body.setAttribute("d", paths.body);
        rod.shade.setAttribute("d", paths.shade);
        rod.edges.setAttribute("d", paths.edges);
      }
      for (const { part, elements } of groups) {
        const shift = translate(live[part]);
        for (const element of elements) element.setAttribute("transform", shift);
      }
      const lift = translate(offsetOf([0, 0, -p.lift], P));
      for (const hold of holds) hold.setAttribute("transform", lift);
      ink.setAttribute("d", live.ink);
      // The finished sheet shows only while it slides; on the pad and in the tray its twin lies.
      if (p.filed === null) sheet.setAttribute("display", "none");
      else {
        sheet.setAttribute("transform", translate(live.sheet));
        sheet.removeAttribute("display");
      }
    };
  },
};
