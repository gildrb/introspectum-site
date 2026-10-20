/**
 * The Software Factory's diagram: the trace of one requirement through a real run, drawn in the
 * strokes of Frege's Begriffsschrift, so the engraving beside it and the graph share one hand.
 *
 * The trace is requirement SMK-3 of the smoke alarm example in the product's repository, as its
 * run wrote it (`docs/traceability/smoke_alarm_traceability.json` and
 * `docs/certificates/smoke_alarm_certificate.json`): the requirement is specified by
 * `spec:SMK-3`, which `AlarmLatch::confirm` is verified against; three tests exercise that
 * method, and three proof obligations on it were discharged; the certificate's verdict for the
 * run is `certified`. As in Frege's notation, the judgement stroke on the left asserts what the
 * horizontal content stroke carries, the requirement at its end, and each condition hangs from
 * the line above it on a stroke that drops down and runs right to its name. The judgement is the
 * certificate's; every other stroke is one edge of the trace.
 *
 * The motion: every stroke of the trace has a twin in a redrawing of the engraving's Proposition
 * 129 (the same number of strokes, each edge one line of Frege's), and the drawing eases from the
 * trace into Frege's tree and back. The names are struck out before the strokes leave and set
 * again, letter by letter, once they are back. The page is served as the finished trace.
 *
 * One pure model drives everything: `scripts/figures/trace.mjs` draws the rest pose with it,
 * `trace.ts` redraws the strokes and names in the browser with the same functions.
 */
import { iso, pathOf, type Flat, type Point, type Projection } from "./projection.ts";

/** Seen straight on: the drawing lies in the plane y = 0, x to the right, z up. */
export const view = { width: 712, height: 480, azimuth: 90, elevation: 0 };

/** A point of the drawing, x to the right and y down the page, in the world of the camera. */
export const world = ([x, y]: Flat): Point => [x, 0, -y];

/** The names' size, and how far right of a stroke's end a name starts. */
export const type = { size: 12, gap: 6, advance: 0.6 };

/**
 * Row pitch, where every condition stroke ends and its name begins, and how far apart the strokes
 * drop: narrow, so the names keep most of a phone's width.
 */
const pitch = 20;
const end = 108;
const step = 11;
const rowY = (row: number) => row * pitch;
/** Where the stroke to a test or proof obligation in row `row` drops: the lowest leftmost. */
const leafX = (row: number) => 3 * step + (8 - row) * step;

/**
 * The engraving's Proposition 129, measured on its scan (`frege-941`) in pixels: its judgement
 * stroke stands at x 364 and its content stroke runs at y 60. Scaled so its tree is about as
 * tall as the trace's, its judgement stroke on the trace's.
 */
const scan = { x: 364, y: 60, scale: 0.35 };
const frege = (x: number, y: number): Flat => [
  (x - scan.x) * scan.scale,
  (y - scan.y) * scan.scale,
];

/** A hollow in Frege's content stroke (his sign of generality), from `x0` to `x1`, `deep` below. */
function hollow(x0: number, x1: number, y: number, deep: number): Flat[] {
  const points: Flat[] = [];
  for (let part = 1; part < 6; part++) {
    const share = part / 6;
    points.push(frege(x0 + (x1 - x0) * share, y + Math.sin(share * Math.PI) * deep));
  }
  return points;
}

/** Points along a polyline through `vertices`, `count` in all and every vertex among them. */
function spread(vertices: readonly Flat[], count: number): Flat[] {
  const [first, ...others] = vertices;
  if (first === undefined) throw new Error("A stroke has no points.");
  const segments: { from: Flat; to: Flat; length: number }[] = [];
  let last = first;
  for (const to of others) {
    segments.push({ from: last, to, length: Math.hypot(to[0] - last[0], to[1] - last[1]) });
    last = to;
  }
  const total = segments.reduce((sum, { length }) => sum + length, 0);
  const pieces = count - 1;
  if (pieces < segments.length) throw new Error("Too few points to keep every vertex.");
  // Every segment gets at least one piece and the rest by length; the pieces left after rounding
  // down go to the segments that lost most to it.
  const shared = segments.map((segment) => ({
    ...segment,
    share: 1 + ((pieces - segments.length) * segment.length) / total,
  }));
  const leftover = pieces - shared.reduce((sum, { share }) => sum + Math.floor(share), 0);
  const extra = new Set(
    shared.toSorted((a, b) => (b.share % 1) - (a.share % 1)).slice(0, leftover),
  );
  const points = shared.flatMap((segment) => {
    const { from, to, share } = segment;
    const parts = Math.floor(share) + (extra.has(segment) ? 1 : 0);
    return Array.from({ length: parts }, (_, part): Flat => [
      from[0] + ((to[0] - from[0]) * part) / parts,
      from[1] + ((to[1] - from[1]) * part) / parts,
    ]);
  });
  points.push(last);
  return points;
}

/** The stroke of a condition: down from the line above at `x`, then right to the names. */
const condition = (x: number, from: number, to: number): Flat[] => [
  [x, from],
  [x, to],
  [end, to],
];

/** One of Frege's condition strokes on the scan: down at `x` from `y0` to `y1`, then right. */
const fregeCondition = (x: number, y0: number, y1: number): Flat[] => [
  frege(x, y0),
  frege(x, y1),
  frege(706, y1),
];

/** One of Frege's short negation strokes under a condition, at `x` from `y0` to `y1`. */
const tick = (x: number, y0: number, y1: number): Flat[] => [
  frege(x, y0),
  frege(x, (y0 + y1) / 2),
  frege(x, y1),
];

/** Frege's heavy judgement stroke, or the lines of the rest of his tree. */
export type Tone = "bar" | "lit";

/** A stroke in both poses, point for point: the trace's and Frege's. */
export type Stroke = { tone: Tone; points: readonly { trace: Flat; frege: Flat }[] };

/** A stroke whose two poses share their vertices one for one. */
const paired = (tone: Tone, fregeLine: Flat[], traceLine: Flat[]): Stroke => {
  if (fregeLine.length !== traceLine.length) throw new Error("A stroke's poses differ in points.");
  return {
    tone,
    points: traceLine.map((trace, index) => {
      const twin = fregeLine[index];
      if (twin === undefined) throw new Error("A stroke's point has no twin.");
      return { trace, frege: twin };
    }),
  };
};

/** His content stroke, up to his second hollow, and its right part from that hollow on. */
const content = [
  frege(364, 61),
  frege(472, 61),
  ...hollow(472, 510, 61, 10),
  frege(510, 60),
  frege(567, 60),
];
const contentEnd = [frege(567, 60), ...hollow(567, 600, 59, 12), frege(600, 58), frege(706, 58)];

/**
 * The strokes, each with its twin in Frege's tree. His conditions are matched to the trace's by
 * height, top to bottom; his content stroke's right part, after its second hollow, swings down
 * into the first condition.
 */
export const strokes: readonly Stroke[] = [
  // The judgement stroke: the certificate's verdict on the run.
  paired(
    "bar",
    [frege(364, 37), frege(364, 80)],
    [
      [0, -9],
      [0, 9],
    ],
  ),
  // The content stroke, carrying requirement SMK-3; his first hollow straightens out.
  paired(
    "lit",
    content,
    spread(
      [
        [0, 0],
        [end, 0],
      ],
      content.length,
    ),
  ),
  // SMK-3 specifies spec:SMK-3.
  paired(
    "lit",
    contentEnd,
    spread(
      [
        [step, 0],
        [step, rowY(1)],
        [end, rowY(1)],
      ],
      contentEnd.length,
    ),
  ),
  // spec:SMK-3 verifies AlarmLatch::confirm.
  paired("lit", fregeCondition(661, 58, 169), condition(2 * step, rowY(1), rowY(2))),
  // AlarmLatch::confirm is tested by its three tests.
  paired("lit", tick(682, 169, 188), condition(leafX(3), rowY(2), rowY(3))),
  paired("lit", fregeCondition(610, 58, 238), condition(leafX(4), rowY(2), rowY(4))),
  paired("lit", fregeCondition(551, 60, 323), condition(leafX(5), rowY(2), rowY(5))),
  // Its three proof obligations, each discharged.
  paired("lit", fregeCondition(661, 323, 434), condition(leafX(6), rowY(2), rowY(6))),
  paired("lit", tick(684, 434, 453), condition(leafX(7), rowY(2), rowY(7))),
  paired("lit", fregeCondition(458, 61, 537), condition(leafX(8), rowY(2), rowY(8))),
];

/** A name in the trace: its text and where its baseline starts. */
export type Label = { text: string; at: Flat };

const named = (row: number, text: string): Label => ({
  text,
  at: [end + type.gap, rowY(row) + type.size * 0.36],
});

/**
 * The names, top to bottom, as the run wrote them. The verdict stands over the content stroke,
 * where Frege sets the letters of his hollows; the others at the ends of their strokes.
 */
export const labels: readonly Label[] = [
  // docs/certificates/smoke_alarm_certificate.json: verdict.status.
  { text: "certified", at: [6, -5] },
  // docs/traceability/smoke_alarm_traceability.json: rows[0].requirement_id.
  named(0, "SMK-3"),
  // rows[0].specs[0].spec_id.
  named(1, "spec:SMK-3"),
  // rows[0].code[0].method_id.
  named(2, "AlarmLatch::confirm"),
  // rows[0].code[0].tests[0..2].name.
  named(3, "confirm_to_full"),
  named(4, "fifo_order"),
  named(5, "wrap_around"),
  // rows[0].code[0].obligations[0..2].obligation_id.
  named(6, "ob:AlarmLatch::confirm:40e3b361"),
  named(7, "ob:AlarmLatch::confirm:7f5b1f03"),
  named(8, "ob:AlarmLatch::confirm:9f50a456"),
];

/** Every point the drawing reaches, names included, for the camera to fit. */
export function extent(): Flat[] {
  const names = labels.flatMap(({ text, at: [x, y] }): Flat[] => [
    [x, y - type.size * 0.8],
    [x + text.length * type.size * type.advance, y + type.size * 0.25],
  ]);
  const lines = strokes.flatMap(({ points }) =>
    points.flatMap(({ trace, frege: twin }) => [trace, twin]),
  );
  return [...lines, ...names];
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => {
  const s = clamp(value);
  return s * s * (3 - 2 * s);
};

/** One cycle in model time (seconds at full pace): trace, into Frege's tree, and back. */
const beat = {
  strike: 3,
  struck: 3.6,
  leave: 3.6,
  frege: 7.2,
  /** Each stroke sets off a little after the one before, and takes `travel` to arrive. */
  stagger: 0.05,
  travel: 1.3,
  set: 9,
  /** The names are set one after another, at `letters` a second. */
  next: 0.14,
  letters: 32,
};

export const length = 12;
/** The page shows the finished trace. */
export const rest = 0;

/** How far stroke `index` is from the trace (0) toward Frege's line (1) at model time `t`. */
export function mixOf(index: number, t: number): number {
  const delay = index * beat.stagger;
  const out = ease((t - beat.leave - delay) / beat.travel);
  const back = ease((t - beat.frege - delay) / beat.travel);
  return out - back;
}

/** How many letters of name `index`, `text`, show at model time `t`. */
export function shownOf(text: string, index: number, t: number): number {
  if (t < beat.strike) return text.length;
  if (t < beat.set) {
    const left = 1 - clamp((t - beat.strike) / (beat.struck - beat.strike));
    return Math.ceil(text.length * left);
  }
  const typed = Math.floor((t - beat.set - index * beat.next) * beat.letters);
  return Math.min(text.length, Math.max(0, typed));
}

/** A stroke's path between its two poses, `mix` of the way toward Frege's line. */
export function strokeOf(stroke: Stroke, mix: number, P: Projection): string {
  return pathOf(
    stroke.points.map(({ trace: [x, y], frege: [fx, fy] }) =>
      iso(world([x + (fx - x) * mix, y + (fy - y) * mix]), P),
    ),
  );
}
