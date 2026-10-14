import type { Machine } from "./live.ts";
import { labels, length, mixOf, rest, shownOf, strokeOf, strokes } from "./trace-model.ts";

/** The trace of SMK-3 (`trace-model.ts`): into the strokes of Frege's tree and back. */
export const trace: Machine = {
  length,
  rate: 1,
  rest,
  bind(svg, P) {
    const lines = strokes.map((stroke, index) => {
      const path = svg.querySelector(`[data-stroke="${index}"] path`);
      if (path === null) throw new Error(`The trace figure has no stroke ${index}.`);
      return { stroke, path, mix: mixOf(index, rest) };
    });
    const names = labels.map(({ text }, index) => {
      const element = svg.querySelector(`[data-label="${index}"]`);
      if (element === null) throw new Error(`The trace figure has no name ${index}.`);
      return { text, element, shown: shownOf(text, index, rest) };
    });

    return (t) => {
      for (const [index, line] of lines.entries()) {
        const mix = mixOf(index, t);
        if (mix === line.mix) continue;
        line.mix = mix;
        line.path.setAttribute("d", strokeOf(line.stroke, mix, P));
      }
      for (const [index, name] of names.entries()) {
        const shown = shownOf(name.text, index, t);
        if (shown === name.shown) continue;
        name.shown = shown;
        name.element.textContent = name.text.slice(0, shown);
      }
    };
  },
};
