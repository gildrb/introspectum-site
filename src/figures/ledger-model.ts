/**
 * The ERP & CRM figure, a counting house desk: the ledger lies open in a glazed case that is locked
 * with a padlock, so a posted entry never changes. The only way in is the slot in its front: a
 * numbering stamp prints the next entry number on a slip, its wheels advance by one, and the slip
 * goes through the slot into the ledger as its newest row. A reading glass on a rail above the
 * glass reads the books but cannot write in them (the assistant's read-only role). The coins stand
 * in columns by denomination (exact minor units), and every closed period is a strapped volume in
 * the archive rack.
 *
 * The motion loops without a jump: like a posting machine, the case line-feeds the book by one row
 * after each posting, so the newest row always sits in the same place under the glass. The rows'
 * numbers and ink follow the running entry number (`cycle` counts the postings that wrapped), so
 * the book moved one row on with entry n + 1 looks exactly like the book at rest with entry n + 1.
 *
 * One pure model drives everything: `scripts/figures/ledger.mjs` draws the static parts and the
 * rest pose with it, `ledger.ts` moves the live parts in the browser with the same functions.
 */
import { iso, pathOf, type Point, type Projection } from "./projection.ts";

export const view = { width: 600, height: 430, azimuth: 58, elevation: 33 };

/** The open ledger inside the case, at rest: rows run along x, the newest at the front. */
export const book = {
  /** Row pitch, and the baseline of the newest row (row 0) at rest. */
  pitch: 6,
  newest: 25,
  /** The page tops, and where each page's flat part ends at the gutter. */
  top: 8.5,
  left: { x0: -98.5, x1: -57 },
  right: { x0: -39, x1: 2.5 },
  /** The column of entry numbers, on the left page's margin. */
  numberX: -97,
  /** Rows drawn, oldest to the next empty one; only those from about -10 show in the glass. */
  oldest: -11,
  next: 1,
};

/** The entry number of the newest row at rest; each posting adds one. */
export const first = 418;

/** The numbering stamp, built with its foot's centre at the origin. */
export const stamp = {
  /** Its foot on the ink pad, and how high it lifts to travel. */
  park: [97, 63, 4.6] satisfies Point,
  lift: 26,
  /** The ratchet on the right leg's face: centre, radii and teeth (one tooth per entry). */
  ratchet: { x: 12.8, z: 11, r: 5, root: 3.9, teeth: 10 },
};

/** The entry slip: its size, where it is stamped, and the dispenser it comes out of. */
export const slip = {
  w: 40,
  d: 20,
  h: 0.4,
  /** It lies on the tray at the case's right side, in line with the slot and the dispenser. */
  feed: [49, 28, 8.4] satisfies Point,
  /** How far it travels into the slot, until it is wholly inside the case's right face. */
  into: 42,
  dispenser: [94, 28, 8.4] satisfies Point,
};

/**
 * The reading glass's centre on its rail. It hangs above the glass, so it sits a little right of
 * and behind what it shows: at rest the newest row's number, at full reach its amount.
 */
export const lens = { y: 32.6, rest: -86, reach: 78 };

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
/** Share of the way from `from` to `to`, eased. */
const between = (t: number, from: number, to: number) => ease((t - from) / (to - from));

/** One posting, in model time. */
const beat = {
  lift: 0.07,
  over: 0.19,
  strike: 0.25,
  rise: 0.31,
  back: 0.44,
  park: 0.5,
  /** The wheels show the next number once the ratchet is half way round. */
  advance: 0.28,
  slipGo: 0.36,
  posted: 0.54,
  feedFrom: 0.56,
  feedTo: 0.68,
  dealFrom: 0.62,
  dealTo: 0.78,
  readFrom: 0.72,
  readTurn: 0.84,
  readTo: 0.96,
};

/** One cycle: one entry posted. */
export const length = 1;
/** The page shows the stamp parked and the glass over the newest row. */
export const rest = 0;

export type Pose = {
  /** The stamp's foot centre, and the ratchet's turn in radians (one tooth per posting). */
  stamp: Point;
  turn: number;
  /** Whether the wheels have moved on to the number after the one being printed. */
  struck: boolean;
  /** The slip's bottom centre, or null while the ledger has it; whether it carries the number. */
  slip: Point | null;
  inked: boolean;
  /** Whether this cycle's entry shows in the ledger, and how far the book has fed on. */
  posted: boolean;
  feed: number;
  /** The reading glass's centre along x. */
  lens: number;
};

/** The whole desk at model time `t`, from 0 to 1: one entry posted. */
export function pose(t: number): Pose {
  const { park, lift } = stamp;
  const up: Point = [park[0], park[1], park[2] + lift];
  const strike: Point = [slip.feed[0], slip.feed[1], slip.feed[2] + slip.h];
  const over: Point = [strike[0], strike[1], strike[2] + lift];
  let at: Point;
  if (t < beat.lift) at = lerp3(park, up, between(t, 0, beat.lift));
  else if (t < beat.over) at = lerp3(up, over, between(t, beat.lift, beat.over));
  else if (t < beat.strike) at = lerp3(over, strike, between(t, beat.over, beat.strike));
  else if (t < beat.rise) at = lerp3(strike, over, between(t, beat.strike, beat.rise));
  else if (t < beat.back) at = lerp3(over, up, between(t, beat.rise, beat.back));
  else at = lerp3(up, park, between(t, beat.back, beat.park));
  const tooth = (2 * Math.PI) / stamp.ratchet.teeth;
  let slipAt: Point | null = slip.feed;
  if (t >= beat.slipGo && t < beat.posted) {
    const s = between(t, beat.slipGo, beat.posted);
    slipAt = [slip.feed[0] - slip.into * s, slip.feed[1], slip.feed[2]];
  } else if (t >= beat.posted && t < beat.dealFrom) slipAt = null;
  else if (t >= beat.dealFrom)
    slipAt = lerp3(slip.dispenser, slip.feed, between(t, beat.dealFrom, beat.dealTo));
  const reading =
    t < beat.readTurn
      ? between(t, beat.readFrom, beat.readTurn)
      : 1 - between(t, beat.readTurn, beat.readTo);
  return {
    stamp: at,
    turn: tooth * between(t, beat.strike, beat.rise),
    struck: t >= beat.advance,
    slip: slipAt,
    inked: t >= beat.strike && t < beat.posted,
    posted: t >= beat.posted,
    feed: book.pitch * between(t, beat.feedFrom, beat.feedTo),
    lens: lens.rest + lens.reach * reading,
  };
}

/** The entry number in row `row` (0 the newest at rest) once `cycle` postings have wrapped. */
export const entryOf = (row: number, cycle: number) => first + cycle + row;

/** An entry number as the stamp's wheels and the ledger show it. */
export const digitsOf = (entry: number) => String(entry % 10000).padStart(4, "0");

/** The baseline of a row on the page, with the book at rest. */
export const baselineOf = (row: number) => book.newest + row * book.pitch;

/**
 * The ink of one entry on its row: a date, the description across both pages and the amount in
 * the debit or credit column. Each entry number always gets the same hand, so a row looks the same
 * wherever the book has fed it.
 */
export function inkOf(entry: number, row: number, P: Projection): string {
  const h = Math.imul(entry + 7, 2654435761) >>> 0;
  const y = baselineOf(row) - 1.6;
  const z = book.top;
  const line = (x0: number, x1: number) => pathOf([iso([x0, y, z], P), iso([x1, y, z], P)]);
  const date = line(-81.5, -81.5 + 5 + (h % 3));
  const words = line(-71, -71 + 6 + ((h >>> 3) % 7));
  const more = line(-62.5 + ((h >>> 6) % 2), -58.5);
  const carried = (h >>> 9) % 3 === 0 ? "" : line(-37.5, -37.5 + 4 + ((h >>> 11) % 10));
  const debit = (h >>> 15) % 2 === 0;
  const right = debit ? -13.5 : 1;
  const amount = line(right - 4 - ((h >>> 17) % 5), right);
  return date + words + more + carried + amount;
}

/** The ratchet's toothed plate on the stamp's right leg, turned by `turn`, for a stamp at the origin. */
export function ratchetOf(turn: number, P: Projection): string {
  const { x, z, r, root, teeth } = stamp.ratchet;
  const points: Point[] = [];
  const tooth = (2 * Math.PI) / teeth;
  for (let index = 0; index < teeth; index++) {
    const a = turn + index * tooth;
    for (const [angle, radius] of [
      [a, root],
      [a + tooth * 0.86, r],
    ] satisfies [number, number][])
      points.push([x, Math.cos(angle) * radius, z + Math.sin(angle) * radius]);
  }
  return pathOf(
    points.map((point) => iso(point, P)),
    true,
  );
}
