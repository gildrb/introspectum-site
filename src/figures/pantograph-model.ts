/**
 * How We Work's figure, a drafting pantograph: a stylus traces a requirements diagram on the
 * original sheet, and four jointed arms, pivoted on a clamp at the edge of the board, carry a
 * pencil that draws the same diagram at twice the size on the copy sheet. Every line of the copy is
 * a line of the original, moved by a linkage that cannot do anything else: the code traced from
 * the requirement, the same way every time. Each finished copy is filed in the tray in front, on
 * the stack of copies before it.
 *
 * One pure model drives everything: `scripts/figures/pantograph.mjs` draws the static parts and
 * the rest pose with it, `pantograph.ts` moves the live parts in the browser with the same
 * functions, so the page paints the exact pose the script then animates from.
 */
import { type Flat, iso, offsetOf, pathOf, type Projection, rod } from "./projection.ts";

export const view = { width: 600, height: 420, azimuth: 58, elevation: 40 };

/**
 * The linkage. Two long arms meet at the elbow A: one from the pivot O, one out to the pencil C.
 * Two short arms join their midpoints B and D at the stylus E, so B, A, D, E is a parallelogram and
 * O, E and C stay on one line with C twice as far from O as E is.
 */
export const linkage = {
  pivot: [-150, -6] satisfies Flat,
  arm: 125,
  scale: 2,
  /** The axes of the lower and the upper layer of arms, and the arms' radius. */
  low: 10,
  high: 14.2,
  r: 1.9,
  /** The radius of the eyes round each joint. */
  eye: 4.2,
  /** How far the pencil stands off the paper while the finished sheet is filed. */
  lift: 3.6,
};

/** The original sheet's diagram, in its own units: a requirement and the two parts it asks for. */
const diagram: readonly Flat[] = [
  [14, 0],
  [30, 0],
  [30, 9],
  [22, 9],
  [22, 15],
  [37, 15],
  [37, 21],
  [44, 21],
  [44, 30],
  [30, 30],
  [30, 21],
  [37, 21],
  [37, 15],
  [7, 15],
  [7, 21],
  [14, 21],
  [14, 30],
  [0, 30],
  [0, 21],
  [7, 21],
  [7, 15],
  [22, 15],
  [22, 9],
  [14, 9],
  [14, 0],
];

/** Where the diagram's own origin lies on the board. */
export const origin: Flat = [-80, -21];

/** The tops of the original sheet and of the copy sheets, where stylus and pencil touch. */
export const originalTop = 0.4;
export const copyTop = 2.8;

/** The stylus's way round the diagram, floor points: one closed loop from a corner of the requirement. */
export const route: readonly Flat[] = diagram.map(([u, v]) => [origin[0] + u, origin[1] + v]);

/** The point the pencil draws while the stylus is at `point`. */
export function copyOf([x, y]: Flat): Flat {
  const [ox, oy] = linkage.pivot;
  return [ox + linkage.scale * (x - ox), oy + linkage.scale * (y - oy)];
}

/** The copy's way, floor points. */
export const copyRoute: readonly Flat[] = route.map(copyOf);

/** How far the finished sheet slides toward the viewer, from the board into the tray. */
export const slide = 88;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const ease = (value: number) => {
  const s = clamp(value, 0, 1);
  return s * s * (3 - 2 * s);
};
const between = (from: number, to: number, t: number) => ease((t - from) / (to - from));

const lengths = route.slice(1).map((point, index) => {
  const from = route[index] ?? point;
  return Math.hypot(point[0] - from[0], point[1] - from[1]);
});
const total = lengths.reduce((sum, length) => sum + length, 0);

/** The stylus's point a share `s` of the way round the diagram, and the corners it has passed. */
function along(s: number): { point: Flat; passed: number } {
  let left = clamp(s, 0, 1) * total;
  for (const [index, length] of lengths.entries()) {
    const a = route[index];
    const b = route[index + 1];
    if (a === undefined || b === undefined) break;
    if (left <= length || index === lengths.length - 1) {
      const share = length === 0 ? 1 : Math.min(1, left / length);
      return {
        point: [a[0] + (b[0] - a[0]) * share, a[1] + (b[1] - a[1]) * share],
        passed: index,
      };
    }
    left -= length;
  }
  const first = route[0];
  if (first === undefined) throw new Error("An empty route.");
  return { point: first, passed: 0 };
}

/**
 * One cycle, model time 0 to 1. It starts with the copy just finished: the pencil lifts, the sheet
 * slides off into the tray onto the copies before it, the pencil comes down on the fresh sheet under
 * it, and the stylus goes once round the diagram while the pencil draws it again. So the drawing at
 * the end is the drawing at the start, and the cycle closes without a jump.
 */
const beat = {
  lifted: 0.05,
  slide: 0.06,
  filed: 0.24,
  lower: 0.26,
  down: 0.3,
  trace: 0.31,
  traced: 0.94,
};

export const length = 1;
/** The page shows the copy finished, the stylus back on the requirement's corner. */
export const rest = 0.97;

export type Pose = {
  /** The stylus's point on the original, a floor point. */
  tracer: Flat;
  /** How high the pencil stands off the copy. */
  lift: number;
  /** The share of the diagram drawn on the copy on the board. */
  drawn: number;
  /** How far the finished sheet has gone toward the tray, or null while it lies hidden. */
  filed: number | null;
};

/** The whole pantograph at model time `t`, from 0 to 1. */
export function pose(t: number): Pose {
  const share = between(beat.trace, beat.traced, t);
  let lift = 0;
  if (t < beat.lower) lift = linkage.lift * between(0, beat.lifted, t);
  else lift = linkage.lift * (1 - between(beat.lower, beat.down, t));
  let drawn = share;
  // Until the finished sheet moves, it lies exactly over the fresh one's finished copy.
  if (t < beat.slide) drawn = 1;
  return {
    tracer: along(share).point,
    lift,
    drawn,
    filed: t >= beat.slide && t < beat.filed ? between(beat.slide, beat.filed, t) : null,
  };
}

/** Every joint of the linkage, floor points, for a stylus at `tracer`. */
export function joints(tracer: Flat) {
  const [ox, oy] = linkage.pivot;
  const dx = tracer[0] - ox;
  const dy = tracer[1] - oy;
  const reach = Math.hypot(dx, dy);
  // The elbow stands off the line O, E, C on the far side, so the arms never cross the sheets.
  const out = Math.sqrt(Math.max(0, linkage.arm * linkage.arm - reach * reach));
  const elbow: Flat = [tracer[0] + (dy / reach) * out, tracer[1] - (dx / reach) * out];
  const pencil = copyOf(tracer);
  return {
    pivot: linkage.pivot,
    elbow,
    near: [(ox + elbow[0]) / 2, (oy + elbow[1]) / 2] satisfies Flat,
    far: [(elbow[0] + pencil[0]) / 2, (elbow[1] + pencil[1]) / 2] satisfies Flat,
    tracer,
    pencil,
  };
}

/** The copy's polyline on screen as far as `drawn` of the way round, nothing before it starts. */
function copyLine(drawn: number, P: Projection): string {
  if (drawn <= 0) return "";
  const { point, passed } = along(drawn);
  const points = copyRoute.slice(0, passed + 1);
  points.push(copyOf(point));
  return pathOf(points.map(([x, y]) => iso([x, y, copyTop], P)));
}

/** The whole copy, as the pencil leaves it. */
export function copyPath(P: Projection): string {
  return pathOf(copyRoute.map(([x, y]) => iso([x, y, copyTop], P)));
}

/** The parts the browser redraws: the four arms, the joints that ride on them, pencil and sheet. */
export function liveParts(p: Pose, P: Projection) {
  const j = joints(p.tracer);
  /** An arm at height `z` between two joints. */
  const arm = (a: Flat, b: Flat, z: number) => rod([a[0], a[1], z], [b[0], b[1], z], linkage.r, P);
  const place = ([x, y]: Flat, z = 0) => offsetOf([x, y, z], P);
  return {
    oa: arm(j.pivot, j.elbow, linkage.low),
    de: arm(j.far, j.tracer, linkage.low),
    ac: arm(j.elbow, j.pencil, linkage.high),
    be: arm(j.near, j.tracer, linkage.high),
    elbow: place(j.elbow),
    near: place(j.near),
    far: place(j.far),
    tracer: place(j.tracer),
    pencil: place(j.pencil),
    lead: place(j.pencil, p.lift),
    ink: copyLine(p.drawn, P),
    sheet: place([0, slide * (p.filed ?? 0)]),
  };
}
