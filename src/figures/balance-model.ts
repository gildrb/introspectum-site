/**
 * The home page's figure, an assayer's balance in its glass case: a cast ingot on the left pan is
 * weighed against the sealed standard weight on the right. The ingot is the code being checked,
 * the standard the specification, and the case's glass the point: the mechanism is in plain view.
 * Turning the arrest knob lowers the pan rests and frees the beam; it swings, settles level with
 * the pointer on zero and holds there, and the arrest lifts the rests again.
 *
 * One pure model drives everything: `scripts/figures/balance.mjs` draws the static parts and the
 * rest pose with it, `balance.ts` moves the live parts in the browser with the same functions, so
 * the page paints the exact pose the script then animates from.
 */
import { iso, offsetOf, pathOf, type Point, type Projection, rod } from "./projection.ts";

export const view = { width: 600, height: 680, azimuth: 45, elevation: 30 };

/** The case's floor, on the base: the pillar, the pan rests and the scale stand on it. */
export const floorTop = 35;

/** The beam, its pans and the pointer, all in the plane y = 0 but the pointer. */
export const beam = {
  pivotZ: 158,
  half: 52,
  chordR: 1.6,
  /** The truss's apex above the pivot, and its struts. */
  apex: 9,
  strutR: 1,
  apexR: 1.7,
  /** The pans' floors when the beam is level, and their radius. */
  panZ: 64,
  panR: 13,
  /** The pointer hangs from an arm off the beam's boss, clear in front of the pillar. */
  needle: 104,
  needleY: 12,
  /** The swing when the beam is freed: angle, decay and period in model time. */
  swing: 0.05,
  decay: 0.13,
  period: 0.16,
};

/** The arrest: the bar under the beam with its two pins, the pan rests and the knob that works them. */
export const arrest = {
  barTop: 147,
  pinX: 36,
  /** How far the bar and the pan rests sink when the beam is freed. */
  drop: 4.5,
  restDrop: 5,
  /** The pan rests' collars stand on the floor; their stems rise to the pads under the pans. */
  collarTop: floorTop + 4,
  stemR: 1,
  padH: 1.6,
  /** The knob on the base's front, and its lever: level when arrested, hanging when free. */
  knob: [0, 69.6, 18] satisfies Point,
  lever: 10,
  leverR: 0.9,
  ballR: 2,
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const ease = (value: number) => {
  const s = clamp(value, 0, 1);
  return s * s * (3 - 2 * s);
};

/**
 * One weighing, in model time: held, the knob turns and the rests sink, the beam is freed and
 * swings, settles level and holds, then the arrest lifts the rests and holds the beam again.
 */
const beat = {
  lower: 0.06,
  lowered: 0.2,
  release: 0.19,
  calm: 0.62,
  settled: 0.72,
  lift: 0.84,
  lifted: 0.96,
};

export const length = 1;
/** The page shows the beam freed and level, the pointer on zero: the proof holding. */
export const rest = 0.78;

export type Pose = {
  /** The beam's angle, left end down positive. */
  tilt: number;
  /** How far the arrest holds: 1 arrested, 0 freed. */
  held: number;
};

/** The whole balance at model time `t`, from 0 to 1. */
export function pose(t: number): Pose {
  let held = 1;
  if (t >= beat.lift) held = ease((t - beat.lift) / (beat.lifted - beat.lift));
  else if (t >= beat.lowered) held = 0;
  else if (t >= beat.lower) held = 1 - ease((t - beat.lower) / (beat.lowered - beat.lower));
  const elapsed = t - beat.release;
  let tilt = 0;
  if (elapsed > 0 && t < beat.settled) {
    // A kick as it comes off the rests, then a damped swing about level; the last trace fades.
    const fade = 1 - ease((t - beat.calm) / (beat.settled - beat.calm));
    tilt =
      beam.swing *
      Math.exp(-elapsed / beam.decay) *
      Math.sin((2 * Math.PI * elapsed) / beam.period) *
      fade;
  }
  return { tilt, held };
}

/** How far the left pan moves from level at a beam angle; the right pan moves the other way. */
export function panShift(tilt: number): Point {
  return [beam.half * (1 - Math.cos(tilt)), 0, -beam.half * Math.sin(tilt)];
}

/** A point of the beam, `x` along it and `z` above the pivot, turned by the beam's angle. */
function onBeam(x: number, z: number, y: number, tilt: number): Point {
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  return [x * c - z * s, y, beam.pivotZ + x * s + z * c];
}

/** The pan rests' pads, built at the world origin: their place for a pose. */
export function padAt(x: number, held: number): Point {
  return [x, 0, beam.panZ - arrest.padH - arrest.restDrop * (1 - held)];
}

/** The parts the browser redraws: the beam's truss, the pointer, the lever and the rests' stems. */
export function liveParts(p: Pose, P: Projection) {
  const left = onBeam(-beam.half, 0, 0, p.tilt);
  const right = onBeam(beam.half, 0, 0, p.tilt);
  const apex = onBeam(0, beam.apex, 0, p.tilt);
  const hub = onBeam(0, 0, beam.needleY, p.tilt);
  const tip = onBeam(0, -beam.needle, beam.needleY, p.tilt);
  const turn = (Math.PI / 2) * (1 - p.held);
  const [kx, ky, kz] = arrest.knob;
  const end: Point = [
    kx - Math.cos(turn) * arrest.lever,
    ky + 0.6,
    kz - Math.sin(turn) * arrest.lever,
  ];
  const stem = (x: number) => {
    const pad = padAt(x, p.held);
    return rod([x, 0, arrest.collarTop], [x, 0, pad[2] + 0.2], arrest.stemR, P);
  };
  return {
    /** Rods by their part names in the drawing. */
    rods: {
      "strut-left": rod(left, apex, beam.strutR, P),
      "strut-right": rod(right, apex, beam.strutR, P),
      chord: rod(left, right, beam.chordR, P),
      lever: rod([kx, ky + 0.6, kz], end, arrest.leverR, P),
      "stem-left": stem(-beam.half),
      "stem-right": stem(beam.half),
    },
    apex: offsetOf(apex, P),
    needle: pathOf([iso(hub, P), iso(tip, P)]),
    ball: offsetOf(end, P),
    padLeft: offsetOf(padAt(-beam.half, p.held), P),
    padRight: offsetOf(padAt(beam.half, p.held), P),
    bar: offsetOf([0, 0, -arrest.drop * (1 - p.held)], P),
  };
}
