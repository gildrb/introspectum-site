// Draws the Software Factory's diagram, the trace of requirement SMK-3 in Frege's strokes (see
// `src/figures/trace-model.ts`), and writes it to `src/figures/trace.svg`.
// Run: node scripts/figures/trace.mjs [--preview] (see `engrave.mjs`).
import * as M from "../../src/figures/trace-model.ts";
import { iso, screenScale } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "trace";
const E = engraver(NAME, { ...M.view, rest: M.rest, points: M.extent().map(M.world), pad: 4 });
const { P, L } = E;
const fixed = (value) => Math.round(value * 100) / 100;

const strokes = M.strokes.map(
  (stroke, index) =>
    `<g data-stroke="${index}">${L(M.strokeOf(stroke, M.mixOf(index, E.moment), P), { tone: stroke.tone })}</g>`,
);
const labels = M.labels.map(({ text, at }, index) => {
  const [x, y] = iso(M.world(at), P);
  return `<text data-label="${index}" x="${fixed(x)}" y="${fixed(y)}">${text.slice(0, M.shownOf(text, index, E.moment))}</text>`;
});

E.write(
  [
    ...strokes,
    `<g class="iso-code" font-size="${fixed(M.type.size * screenScale(P))}">${labels.join("")}</g>`,
  ],
  E.moment,
);
