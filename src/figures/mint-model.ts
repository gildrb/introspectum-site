/**
 * The Software Factory's figure, a mint: a screw press strikes a coin, an assay balance weighs it
 * against a sealed standard weight, and the coin either goes back to the crucible or into the
 * strongbox. The press is the language model writing a function body, the standard weight the
 * specification people approved, the balance the proof, the crucible the counterexample going back
 * to the model, the strongbox's tally the audit trail.
 *
 * One pure model drives everything: `scripts/figures/mint.mjs` draws the static parts and the rest
 * pose with it, `mint.ts` moves the live parts in the browser with the same functions, so the page
 * paints the exact pose the script then animates from.
 */
import { iso, offsetOf, pathOf, type Point, type Projection, rod } from "./projection.ts";

export const view = { width: 600, height: 470, azimuth: 38, elevation: 30 };

/** The screw press. */
export const press = {
  x: -82,
  /** The columns stand either side of the die, along y. */
  columnY: 21,
  columnR: 4.2,
  plinthTop: 34,
  bolsterTop: 40,
  dieTop: 50,
  /** The upper die's face at rest, and how far the ram travels to meet the coin. */
  ramRest: 86,
  ramDrop: 34.2,
  crossheadBottom: 132,
  crossheadTop: 146,
  nutTop: 152,
  screwR: 3.4,
  /** The fly bar's axis at rest; it sinks with the screw. */
  barZ: 193,
  barHalf: 52,
  barR: 2,
  ballR: 6.5,
  /** The bar's angle at rest, from +x toward +y; a stroke turns it a quarter turn. */
  barAngle: (-5 * Math.PI) / 180,
};

/** The assay balance. */
export const balance = {
  x: 26,
  pivotZ: 96,
  half: 40,
  beamR: 2,
  knobR: 2.8,
  /** The pans' floors when the beam is level, and how far the chains hang under the beam. */
  panZ: 34,
  panR: 12,
  needle: 26,
  /** Beam angle per unit of mass difference, and its stop. */
  gain: 1.2,
  stop: 0.25,
};

export const coin = { r: 7, h: 2.2 };

/** The specification's mass, and each attempt's: the first is light, the second holds. */
export const standard = 1;
export const attempts: readonly number[] = [0.9, 1];

/** The coin's route, world points of its bottom centre. */
const panFloor = 0.6;
const leftPan = (): Point => [balance.x - balance.half, 0, balance.panZ + panFloor];
export const chute = {
  from: [press.x + 14, 0, 48.6] satisfies Point,
  to: [balance.x - balance.half - 11, 0, 40] satisfies Point,
};
export const reject = {
  from: [balance.x - balance.half, -14, 35.6] satisfies Point,
  to: [balance.x - balance.half, -37, 17] satisfies Point,
};
export const accept = {
  from: [balance.x - balance.half, 14, 35.6] satisfies Point,
  to: [balance.x - balance.half, 40, 25.4] satisfies Point,
};
/** Where the crucible and the strongbox's slot swallow the coin. */
export const crucible = { x: balance.x - balance.half, y: -45, r: 10, top: 15 };
export const slot = [balance.x - balance.half, 47, 22] satisfies Point;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const ease = (value: number) => {
  const s = clamp(value, 0, 1);
  return s * s * (3 - 2 * s);
};
const lerp3 = (a: Point, b: Point, s: number): Point => [
  a[0] + (b[0] - a[0]) * s,
  a[1] + (b[1] - a[1]) * s,
  a[2] + (b[2] - a[2]) * s,
];
const distance = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

/** A point a share `s` of the way along a polyline, by length. */
function along(points: readonly Point[], s: number): Point {
  const lengths = points.slice(1).map((point, index) => distance(points[index] ?? point, point));
  let left = clamp(s, 0, 1) * lengths.reduce((sum, length) => sum + length, 0);
  for (const [index, length] of lengths.entries()) {
    const a = points[index];
    const b = points[index + 1];
    if (a === undefined || b === undefined) break;
    if (left <= length || index === lengths.length - 1)
      return lerp3(a, b, length === 0 ? 1 : left / length);
    left -= length;
  }
  const last = points[points.length - 1];
  if (last === undefined) throw new Error("An empty route.");
  return last;
}

/** The beam's angle for a mass difference, left end down positive. */
const tiltFor = (difference: number) =>
  clamp(balance.gain * difference, -balance.stop, balance.stop);

/** A damped swing toward a new rest angle, `elapsed` model time after the load changed. */
const swing = (elapsed: number) =>
  elapsed <= 0 ? 0 : 1 - Math.exp(-elapsed / 0.05) * Math.cos((2 * Math.PI * elapsed) / 0.12);

/**
 * Each attempt, in model time from its start (one unit per attempt). A blank rises out of the
 * die, the press strikes it, and it slides to the balance. As on a real assay balance, the beam
 * is arrested, level, while the coin goes on and comes off, and released to weigh it.
 */
const beat = {
  rise: 0.06,
  down: 0.15,
  up: 0.25,
  landed: 0.42,
  release: 0.44,
  arrest: 0.64,
  leave: 0.72,
  gone: 0.9,
};

/** One cycle: two attempts at one function, one model unit each. */
export const length = attempts.length;
/** The page shows the second attempt weighed: the balance level, the proof holding. */
export const rest = 1.6;

/**
 * The openings a coin passes through, each a circle in a level face: the die's bore it rises
 * from, the crucible's mouth and the strongbox's slot it drops into. Below the face it is hidden.
 */
export const holes = {
  rise: { centre: [press.x, 0, press.dieTop] satisfies Point, r: coin.r + 0.4 },
  crucible: {
    centre: [crucible.x, crucible.y, crucible.top + 1.2] satisfies Point,
    r: crucible.r - 1.3,
  },
  box: { centre: slot, r: coin.r + 1 },
};

/**
 * Which slot of the drawing order the coin is drawn in: rising out of the die, between the
 * press's columns, on the reject chute behind the balance, dropping into the crucible, in front
 * of everything else, or dropping into the strongbox. The holes clip it at their face.
 */
export type Layer = "rise" | "die" | "back" | "crucible" | "free" | "box";

export type Pose = {
  ramDrop: number;
  barAngle: number;
  tilt: number;
  /** The coin's bottom centre, or null once the crucible or the strongbox holds it. */
  coin: Point | null;
  layer: Layer;
  /** Coins in the strongbox, from this cycle. */
  recorded: number;
};

/** The whole machine at model time `t`, from 0 to 2: two attempts at one function. */
export function pose(t: number): Pose {
  const index = clamp(Math.floor(t), 0, attempts.length - 1);
  const mass = attempts[index] ?? standard;
  const holds = mass === standard;
  const tau = t - index;
  let down = 0;
  if (tau >= beat.rise && tau < beat.down) down = ease((tau - beat.rise) / (beat.down - beat.rise));
  else if (tau >= beat.down) down = 1 - ease((tau - beat.down) / (beat.up - beat.down));
  const loaded = tiltFor(mass - standard);
  const tilt = loaded * (swing(tau - beat.release) - swing(tau - beat.arrest));
  // The coin lies on the left pan, wherever the beam holds it.
  const level = leftPan();
  const shift = panShift(tilt);
  const pan: Point = [level[0] + shift[0], 0, level[2] + shift[2]];
  const die: Point = [press.x, 0, press.dieTop];
  const hole = holds ? holes.box : holes.crucible;
  const above: Point = [hole.centre[0], hole.centre[1], hole.centre[2] + 1];
  const below: Point = [hole.centre[0], hole.centre[1], hole.centre[2] - coin.h - 0.5];
  let coinAt: Point | null;
  let layer: Layer = "free";
  if (tau < beat.rise) {
    coinAt = [die[0], 0, die[2] - coin.h * (1 - ease(tau / beat.rise))];
    layer = "rise";
  } else if (tau < beat.up) {
    coinAt = die;
    layer = "die";
  } else if (tau < beat.landed) {
    const route: Point[] = [die, chute.from, chute.to, [pan[0], 0, pan[2] + 3], pan];
    coinAt = along(route, ease((tau - beat.up) / (beat.landed - beat.up)));
    if (coinAt[0] < chute.from[0]) layer = "die";
  } else if (tau < beat.leave) coinAt = pan;
  else if (tau < beat.gone) {
    const way = holds ? accept : reject;
    const route: Point[] = [
      pan,
      [pan[0], way.from[1], pan[2] + 2.4],
      way.from,
      way.to,
      above,
      below,
    ];
    coinAt = along(route, ease((tau - beat.leave) / (beat.gone - beat.leave)));
    if (coinAt[1] < reject.from[1] + 2) layer = "back";
    if (Math.hypot(coinAt[0] - above[0], coinAt[1] - above[1]) < 0.01)
      layer = holds ? "box" : "crucible";
  } else coinAt = null;
  return {
    ramDrop: press.ramDrop * down,
    barAngle: press.barAngle + (Math.PI / 2) * down,
    tilt,
    coin: coinAt,
    layer,
    recorded: holds && tau >= beat.gone ? 1 : 0,
  };
}

/** How far the left pan moves from level at a beam angle; the right pan moves the other way. */
export function panShift(tilt: number): Point {
  return [balance.half * (1 - Math.cos(tilt)), 0, -balance.half * Math.sin(tilt)];
}

/** The parts the browser redraws: the fly bar, the beam, the chains and the needle. */
export function liveParts(p: Pose, P: Projection) {
  const top = press.barZ - p.ramDrop;
  const reach: Point = [
    Math.cos(p.barAngle) * press.barHalf,
    Math.sin(p.barAngle) * press.barHalf,
    0,
  ];
  const ballA: Point = [press.x + reach[0], reach[1], top];
  const ballB: Point = [press.x - reach[0], -reach[1], top];
  const bar = rod(ballA, ballB, press.barR, P);
  const c = Math.cos(p.tilt);
  const s = Math.sin(p.tilt);
  const pivot: Point = [balance.x, 0, balance.pivotZ];
  const left: Point = [balance.x - balance.half * c, 0, balance.pivotZ - balance.half * s];
  const right: Point = [balance.x + balance.half * c, 0, balance.pivotZ + balance.half * s];
  const beam = rod(left, right, balance.beamR, P);
  const rim = (end: Point, sign: number): string => {
    const floor = balance.panZ + 2.6 + (end[2] - balance.pivotZ);
    const centre: Point = [end[0], 0, floor];
    return [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]
      .map((angle) => {
        const at: Point = [
          centre[0] + Math.cos(angle + 0.5) * (balance.panR - 0.6) * sign,
          Math.sin(angle + 0.5) * (balance.panR - 0.6),
          floor,
        ];
        return pathOf([iso(end, P), iso(at, P)]);
      })
      .join("");
  };
  const needleTip: Point = [pivot[0] - s * balance.needle, -1.2, pivot[2] + c * balance.needle];
  return {
    bar,
    ballA: offsetOf(ballA, P),
    ballB: offsetOf(ballB, P),
    beam,
    knobLeft: offsetOf(left, P),
    knobRight: offsetOf(right, P),
    chains: rim(left, 1) + rim(right, 1),
    needle: pathOf([iso([pivot[0], -1.2, pivot[2]], P), iso(needleTip, P)]),
  };
}
