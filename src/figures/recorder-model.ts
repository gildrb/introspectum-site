/**
 * The Trading Platform's figure, a bank of strip-chart recorders: one recorder per stock, all
 * driven from one clockwork through a common shaft, so they run in parallel. On each, the price pen
 * draws the price as it comes and the trend pen follows it through a dashpot, so it draws the
 * price smoothed over that recorder's time constant: an exponential moving average. The knob on
 * the dashpot sets the damping, and each recorder's knob sits at its own setting, the time scale
 * on which that stock's trend signals are most reliable. It all goes onto paper.
 *
 * One pure model drives everything: `scripts/figures/recorder.mjs` draws the static parts and the
 * rest pose with it, `recorder.ts` moves the live parts in the browser with the same functions, so
 * the page paints the exact pose the script then animates from.
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

export const view = { width: 600, height: 430, azimuth: 36, elevation: 34 };

/** The case each recorder stands on, and the writing table on top of it. */
export const bed = { caseTop: 10, top: 25, half: 23 };

/** The chart paper: its half width across the table, and where it leaves and meets the rolls. */
export const paper = { half: 21, thick: 0.3, from: -82, to: 82 };

/** Paper fed in one cycle, and the price samples written over it. */
export const feed = { length: 80, samples: 40 };
const step = feed.length / feed.samples;

/** The chart's printed arcs, this far apart: the ruling looks the same after every `gap` of feed. */
export const ruling = { gap: feed.length / 5 };

/** A recorder, one stock: where it stands, its trend's time constant in samples, its series' seed. */
export type Lane = { x: number; tau: number; seed: number };
export const lanes: readonly Lane[] = [
  { x: -100, tau: 2.6, seed: 7 },
  { x: -14, tau: 12, seed: 21 },
  { x: 72, tau: 5.5, seed: 3 },
];

/**
 * The pen arms swing about one hub over the paper, so a pen draws an arc across it, as on real
 * recorders. The trend arm is shorter and lower, so its pen passes under the price arm.
 */
export const arm = {
  hubY: -46,
  price: 50,
  trend: 44,
  priceZ: bed.top + 7.5,
  trendZ: bed.top + 4,
  r: 0.75,
  /** How far across the paper the pens reach from the middle, at the extremes of a series. */
  swing: 16.5,
};

/**
 * The dashpot lies across the back of each recorder, from `from` to its gland end, behind the
 * centre; its rod takes the trend arm `link` along from the hub.
 */
const link = 15;
export const damper = { from: -47, gland: -27, r: 3.6, link, y: arm.hubY + link };

/** Rolls turn a whole number of thirds per cycle, so their three spokes look the same at the wrap. */
export const rolls = {
  feed: { y: paper.from, r: (3 * feed.length) / (2 * Math.PI * 6) },
  take: { y: paper.to, r: (3 * feed.length) / (2 * Math.PI * 7) },
  /** The hub caps' outer faces, from the recorder's centre. */
  cap: bed.half + 3.5,
};

/**
 * The clockwork at the back on the right: its housing, with the flyball governor and the spring
 * drum on its lid. Its output runs forward to the common shaft along the front.
 */
export const clockwork = { x: 102, y: -92, w: 38, d: 60, h: 28 };
export const governor = {
  x: clockwork.x + 14,
  y: clockwork.y + 20,
  /** Heights above the bench: the hinge the arms hang from, the balls, the sleeve. */
  hinge: clockwork.h + 42,
  ballZ: clockwork.h + 27,
  sleeve: clockwork.h + 19,
  reach: 14,
  ballR: 4.2,
  r: 0.6,
  /** Turns per cycle. */
  turns: 9,
};
/** The spring drum stands on the lid, toothed round its rim, its winding key on top. */
export const drum = {
  x: clockwork.x + 26,
  y: clockwork.y + 49,
  r: 9,
  height: 6,
  /** The ring the turning notches sit in, engraved on its top. */
  notches: [5.4, 7.4] satisfies [number, number],
};

/** The common shaft along the front, at this height and depth, and the side shaft that feeds it. */
export const shaft = { y: 101, z: 7, r: 1.6, side: clockwork.x + 7 };

/** One cycle: the paper moves on by `feed.length`. */
export const length = 1;
/**
 * The page shows the start of a cycle, where the three recorders part: the middle stock's price
 * runs well above its slow trend, the front one's falls below its trend.
 */
export const rest = 0;

/** A small seeded generator (mulberry32), so every build draws the same series. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = (values: readonly number[], index: number) => {
  const count = values.length;
  return values[((index % count) + count) % count] ?? 0;
};

/**
 * A synthetic price, one cycle long and periodic: a random walk whose drift turns once a cycle
 * (a rise and a fall), its steps bridged so the walk closes on itself. Scaled into 0 to 1.
 */
function priceOf(lane: Lane): number[] {
  const random = seeded(lane.seed);
  const phase = random() * 2 * Math.PI;
  const steps = Array.from({ length: feed.samples }, (_, index) => {
    const noise = random() + random() + random() - 1.5;
    const drift = Math.sin(phase + (2 * Math.PI * index) / feed.samples) * 0.28;
    return drift + noise;
  });
  const mean = steps.reduce((sum, value) => sum + value, 0) / steps.length;
  const walk: number[] = [];
  let level = 0;
  for (const value of steps) {
    level += value - mean;
    walk.push(level);
  }
  const low = Math.min(...walk);
  const high = Math.max(...walk);
  return walk.map((value) => 0.06 + (0.88 * (value - low)) / (high - low));
}

/** The exponential moving average with time constant `tau`, run until it repeats each cycle. */
function trendOf(price: readonly number[], tau: number): number[] {
  const alpha = 1 - Math.exp(-1 / tau);
  let level = price[0] ?? 0;
  const out: number[] = [];
  for (let round = 0; round < 40; round++)
    for (const [index, value] of price.entries()) {
      level += alpha * (value - level);
      out[index] = level;
    }
  return out;
}

/** Each recorder's price and trend, one value per sample, periodic over the cycle. */
export const series = lanes.map((lane) => {
  const price = priceOf(lane);
  return { price, trend: trendOf(price, lane.tau) };
});

/** A periodic series between samples, `s` in samples. */
function valueAt(values: readonly number[], s: number): number {
  const index = Math.floor(s);
  const share = s - index;
  return at(values, index) * (1 - share) + at(values, index + 1) * share;
}

export type Pen = "price" | "trend";

/** Where a pen's tip sits on the paper for a value, on its arc about the hub. */
export function tipOf(lane: Lane, pen: Pen, value: number): Point {
  const reach = arm[pen];
  const across = (value - 0.5) * 2 * arm.swing;
  const along = Math.sqrt(reach * reach - across * across);
  return [lane.x - across, arm.hubY + along, bed.top + paper.thick];
}

export type Pose = {
  /** Paper fed since the cycle began. */
  advance: number;
  /** Each recorder's price and trend at the pens. */
  values: readonly { price: number; trend: number }[];
  /** The governor's spin and the spring drum's turn, in radians. */
  spin: number;
  wind: number;
};

/** The bank at model time `t`, from 0 to 1. */
export function pose(t: number): Pose {
  const share = t / length;
  const s = share * feed.samples;
  return {
    advance: share * feed.length,
    values: series.map(({ price, trend }) => ({
      price: valueAt(price, s),
      trend: valueAt(trend, s),
    })),
    spin: share * governor.turns * 2 * Math.PI,
    wind: (share * 2 * Math.PI) / 3,
  };
}

/** Samples drawn on each trace: a paper's length behind the pen, and a cycle ahead (hidden). */
const first = -Math.ceil((paper.to - arm.hubY - arm.trend * 0.9) / step) - 1;
const last = feed.samples + 1;

/**
 * A trace as drawn on the paper at the start of a cycle: sample `k` lies `k` steps back from its
 * pen's arc. The paper then carries it on by `advance`, and a clip shows only what is written.
 */
export function traceOf(index: number, pen: Pen, P: Projection): string {
  const lane = lanes[index];
  const values = series[index];
  if (lane === undefined || values === undefined) throw new Error(`No recorder ${index}.`);
  const points: Flat[] = [];
  for (let k = first; k <= last; k++) {
    const tip = tipOf(lane, pen, at(values[pen], k));
    points.push(iso([tip[0], tip[1] - k * step, tip[2]], P));
  }
  return pathOf(points);
}

/** The written part of the paper for a pen: beyond its arc, up to the take-up roll. */
export function writtenOf(lane: Lane, pen: Pen, P: Projection): string {
  const reach = arm[pen];
  const z = bed.top + paper.thick;
  const points: Flat[] = [];
  for (let index = 0; index <= 12; index++) {
    const x = -paper.half + (2 * paper.half * index) / 12;
    points.push(iso([lane.x + x, arm.hubY + Math.sqrt(reach * reach - x * x), z], P));
  }
  points.push(
    iso([lane.x + paper.half, paper.to, z], P),
    iso([lane.x - paper.half, paper.to, z], P),
  );
  return pathOf(points, true);
}

/** `count` spokes between two radii on a face turned to +x or up (+z), turned by `angle`. */
function spokes(
  centre: Point,
  facing: "x" | "z",
  [inner, outer]: readonly [number, number],
  count: number,
  angle: number,
  P: Projection,
) {
  const point = (a: number, r: number): Flat => {
    const c = Math.cos(a) * r;
    const s = Math.sin(a) * r;
    return facing === "x"
      ? iso([centre[0], centre[1] + c, centre[2] + s], P)
      : iso([centre[0] + c, centre[1] + s, centre[2]], P);
  };
  let d = "";
  for (let index = 0; index < count; index++) {
    const a = angle + (2 * Math.PI * index) / count;
    d += pathOf([point(a, inner), point(a, outer)]);
  }
  return d;
}

/** The hub cap's centre for a roll of a recorder. */
export const capOf = (lane: Lane, roll: "feed" | "take"): Point => [
  lane.x + rolls.cap,
  rolls[roll].y,
  bed.top - rolls[roll].r,
];

/** The governor's two balls and their arms, the nearer one last. */
function flyballs(spin: number, P: Projection) {
  const balls = [spin, spin + Math.PI].map((angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const ball: Point = [
      governor.x + c * governor.reach,
      governor.y + s * governor.reach,
      governor.ballZ,
    ];
    const hinge: Point = [governor.x + c * 1.4, governor.y + s * 1.4, governor.hinge];
    const middle: Point = [
      (hinge[0] + ball[0]) / 2,
      (hinge[1] + ball[1]) / 2,
      (hinge[2] + ball[2]) / 2,
    ];
    const sleeve: Point = [governor.x + c * 2.2, governor.y + s * 2.2, governor.sleeve + 1.5];
    return {
      depth: c * Math.cos((P.azimuth * Math.PI) / 180) + s * Math.sin((P.azimuth * Math.PI) / 180),
      ball: offsetOf(ball, P),
      arm: rod(hinge, ball, governor.r, P),
      link: rod(sleeve, middle, governor.r * 0.8, P),
    };
  });
  return balls.toSorted((a, b) => a.depth - b.depth);
}

/** The parts the browser redraws or moves, for a pose. */
export function liveParts(p: Pose, P: Projection) {
  const recorders = lanes.map((lane, index) => {
    const value = p.values[index] ?? { price: 0.5, trend: 0.5 };
    const price = tipOf(lane, "price", value.price);
    const trend = tipOf(lane, "trend", value.trend);
    const hub = (z: number): Point => [lane.x, arm.hubY, z];
    // A pin part way along the trend arm takes the dashpot's rod.
    const reach = damper.link / arm.trend;
    const pin: Point = [
      lane.x + (trend[0] - lane.x) * reach,
      arm.hubY + (trend[1] - arm.hubY) * reach,
      arm.trendZ,
    ];
    // The rod starts inside the dashpot, which is drawn over its end.
    const gland: Point = [lane.x + damper.gland - 1.5, damper.y, arm.trendZ];
    const feedTurn = Math.PI / 2 - p.advance / rolls.feed.r;
    const takeTurn = Math.PI / 2 - p.advance / rolls.take.r;
    return {
      paper: offsetOf([0, p.advance, 0], P),
      ruling: offsetOf([0, p.advance % ruling.gap, 0], P),
      priceArm: rod(hub(arm.priceZ), [price[0], price[1], arm.priceZ], arm.r, P),
      trendArm: rod(hub(arm.trendZ), [trend[0], trend[1], arm.trendZ], arm.r, P),
      rod: rod(gland, pin, 0.55, P),
      pricePen: offsetOf(price, P),
      trendPen: offsetOf(trend, P),
      pin: offsetOf(pin, P),
      feedSpokes: spokes(capOf(lane, "feed"), "x", [1.1, 3], 3, feedTurn, P),
      takeSpokes: spokes(capOf(lane, "take"), "x", [1.1, 3], 3, takeTurn, P),
    };
  });
  const [back, front] = flyballs(p.spin, P);
  if (back === undefined || front === undefined) throw new Error("The governor has two balls.");
  return {
    recorders,
    back,
    front,
    notches: spokes([drum.x, drum.y, clockwork.h + drum.height], "z", drum.notches, 6, p.wind, P),
  };
}
