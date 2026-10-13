/**
 * The About page's figure beside "Research": Agostino Ramelli's book wheel (1588). A tall wheel
 * turns about a fixed axle between two A-shaped standards; between its two side frames eight
 * lecterns hang on pivot pins, each kept level by its own weight, each holding a book or a report.
 * The wheel turns slowly, and one reader on one bench sees every source in turn. At the hub, pinions
 * on the wheel roll round a sun gear fixed to the axle, as in Ramelli's planetary gearing.
 *
 * One pure model drives everything: `scripts/figures/bookwheel.mjs` draws the static parts and the
 * rest pose with it, `bookwheel.ts` moves the live parts in the browser with the same functions.
 */
import {
  iso,
  offsetOf,
  pathOf,
  type Flat,
  type Point,
  type Projection,
  rod,
} from "./projection.ts";

/**
 * The camera looks along the axle at a slant, from the reader's side, so the wheel reads as a
 * circle and every lectern's face is turned to the viewer. From here no two lecterns ever overlap
 * on the page (the build checks it), so they keep one painting order as they go round.
 */
export const view = { width: 600, height: 520, azimuth: 126, elevation: 20 };

/**
 * The wheel: its axle along y at height `z`, the lecterns' pivots `r` from it. The two side frames
 * stand `span` apart (the lecterns hang between them), each `thick` deep; the pivots run through
 * the rim, which an iron tyre binds.
 */
export const wheel = {
  z: 222,
  r: 140,
  rim: { inner: 135, outer: 145 },
  tyre: 147,
  span: 64,
  thick: 6,
  hub: 20,
  spoke: 2.6,
};

/** The near frame's outer face, where the pins end and the gears sit. */
export const face = wheel.span / 2 + wheel.thick;

/** Lecterns round the wheel, one shelf step apart. */
export const shelves = 8;
const step = (2 * Math.PI) / shelves;
/** Shelf 0's angle at rest: level with the axle, on the reader's side (-x). */
const home = Math.PI;

/**
 * The gearing on the near hub: a sun gear fixed to the axle and one pinion per lectern, carried
 * round by the wheel and rolling on the sun. Teeth of one size (module 1).
 */
export const gears = {
  sun: { r: 14, teeth: 28 },
  pinion: { r: 5, teeth: 10 },
  /** The gears' front faces stand this far out from the frame, on the hub plate; their depth. */
  y: face + 3.6,
  thick: 1.4,
  plate: 27,
};
const orbit = gears.sun.r + gears.pinion.r;

/** One cycle turns the wheel one shelf step; the cycle count carries it on round the wheel. */
export const length = 1;
/** The page shows shelf 0 before the reader, the next one rising to it from below. */
export const rest = 0;

export type Pose = {
  /** The wheel's turn from rest, in radians (negative: the near side rises toward the reader). */
  turn: number;
};

/** The wheel at model time `t` of cycle `cycle`: it turns one shelf step a cycle, never back. */
export function pose(t: number, cycle = 0): Pose {
  return { turn: -((cycle % shelves) + t / length) * step };
}

/** The angle of shelf `index`'s pivot about the axle (0 along +x, a quarter turn straight up). */
const angleOf = (index: number, turn: number) => home + index * step + turn;

/** A point in a frame's plane at `y`, `radius` from the axle at angle `a`. */
const onWheel = (a: number, radius: number, y: number): Point => [
  Math.cos(a) * radius,
  y,
  wheel.z + Math.sin(a) * radius,
];

/** Shelf `index`'s pivot on the wheel's centre plane: its lectern hangs level below it. */
export const pivotOf = (index: number, turn: number): Point =>
  onWheel(angleOf(index, turn), wheel.r, 0);

/**
 * A gear's toothed outline in the plane `y`, centred `[x, z]`, turned by `spin`: trapezoid teeth,
 * one module high, round its pitch circle `r`.
 */
export function gearOutline(
  [x, z]: readonly [number, number],
  { r, teeth }: { r: number; teeth: number },
  spin: number,
  y: number,
  P: Projection,
): string {
  const points: Flat[] = [];
  const pitch = (2 * Math.PI) / teeth;
  const at = (a: number, radius: number) =>
    iso([x + Math.cos(a) * radius, y, z + Math.sin(a) * radius], P);
  for (let index = 0; index < teeth; index++) {
    const a = spin + index * pitch;
    points.push(
      at(a - pitch * 0.32, r - 1),
      at(a - pitch * 0.16, r + 0.9),
      at(a + pitch * 0.16, r + 0.9),
      at(a + pitch * 0.32, r - 1),
    );
  }
  return pathOf(points, true);
}

/** A pinion's bore in the plane `y`, round its centre `[x, z]`. */
function ringAt([x, z]: readonly [number, number], radius: number, y: number, P: Projection) {
  const points: Flat[] = [];
  for (let index = 0; index < 12; index++) {
    const a = (index / 12) * 2 * Math.PI;
    points.push(iso([x + Math.cos(a) * radius, y, z + Math.sin(a) * radius], P));
  }
  return pathOf(points, true);
}

/**
 * A pinion's spin where its carrier stands at angle `a`: rolling on the fixed sun, it turns
 * (1 + sun / pinion) times the carrier's angle, its teeth meshing with the sun's at every angle.
 */
const spinOf = (a: number) =>
  (1 + gears.sun.teeth / gears.pinion.teeth) * a + Math.PI - Math.PI / gears.pinion.teeth;

/** A rod's paths, as `rod` draws them: its body, its shaded half and its edges. */
type RodPaths = { body: string; shade: string; edges: string };

/** One path each for the bodies, shades and edges of a set of rods that never cross. */
function rods(list: readonly RodPaths[]): RodPaths {
  return {
    body: list.map((part) => part.body).join(""),
    shade: list.map((part) => part.shade).join(""),
    edges: list.map((part) => part.edges).join(""),
  };
}

/** The spokes of the side frame in the plane `y`, between the hub and the rim, turned by `turn`. */
function spokesOf(y: number, turn: number, P: Projection) {
  const list: RodPaths[] = [];
  for (let index = 0; index < shelves; index++) {
    const a = home + step / 2 + index * step + turn;
    list.push(
      rod(onWheel(a, wheel.hub - 2, y), onWheel(a, wheel.rim.inner + 2, y), wheel.spoke, P),
    );
  }
  return rods(list);
}

/** The rim's joints on a frame face at `y`, where the felloes meet over each spoke. */
function jointsOf(y: number, turn: number, P: Projection) {
  let d = "";
  for (let index = 0; index < shelves; index++) {
    const a = home + step / 2 + index * step + turn;
    d += pathOf([iso(onWheel(a, wheel.rim.inner, y), P), iso(onWheel(a, wheel.rim.outer, y), P)]);
  }
  return d;
}

/** The parts the browser moves or redraws, for a pose. */
export function liveParts(p: Pose, P: Projection) {
  const pinions: string[] = [];
  const bores: string[] = [];
  for (let index = 0; index < shelves; index++) {
    const a = angleOf(index, p.turn);
    const centre = [Math.cos(a) * orbit, wheel.z + Math.sin(a) * orbit] satisfies [number, number];
    pinions.push(gearOutline(centre, gears.pinion, spinOf(a), gears.y, P));
    bores.push(ringAt(centre, 1.3, gears.y, P));
  }
  return {
    shelves: Array.from({ length: shelves }, (_, index) => offsetOf(pivotOf(index, p.turn), P)),
    farSpokes: spokesOf(-wheel.span / 2 - wheel.thick / 2, p.turn, P),
    nearSpokes: spokesOf(wheel.span / 2 + wheel.thick / 2, p.turn, P),
    farJoints: jointsOf(-wheel.span / 2, p.turn, P),
    nearJoints: jointsOf(face, p.turn, P),
    pinions: pinions.join(""),
    pinionBores: bores.join(""),
  };
}
