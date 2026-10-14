/**
 * The homepage's figure, a proof bench: the typewriter (the model) types a function body under
 * the specification on its copy holder, a cash carrier runs the sheet along a wire to the reading
 * cabinet (the verifier, Prusti), which prints its verdict on a paper tape and swings its needle to
 * red or green; a red verdict rides back to the copy holder, whose line guide drops to the clause
 * that failed, and the typewriter types again; a green one pushes the certificate up out of the
 * cabinet's slot.
 *
 * Every word on the machine is the product's own, from its smoke-alarm scenario: requirement
 * SMK-3, `AlarmLatch::confirm`, its Prusti contract, the body the model writes, Prusti's message
 * for a body that does not hold, the obligations and the certificate. One pure model drives
 * everything: `scripts/figures/proof.mjs` draws the static parts and the rest pose with it,
 * `proof.ts` moves the live parts and swaps the text in place with the same functions.
 */
import type { Point } from "./projection.ts";

export const view = { width: 600, height: 540, azimuth: 68, elevation: 30 };

/**
 * The faces' type, in world units: a monospace face, so a column is always the same width, set a
 * little narrower than its own (each line is stretched to its columns) to stand taller.
 */
export const type = { size: 5.1, advance: 2.76, lead: 7.8, margin: 4 };

/** The width of a line of text: as many columns as characters. */
export const span = (text: string) => text.length * type.advance;

/** The widest line each face must hold, in columns. */
const widest = 35;

/** The specification on the copy holder: the spec's id and its two clauses. */
export const spec = {
  lines: ["spec:SMK-3", "pre: self.len < self.cap", "post: self.len == old(self.len) + 1"],
  /** The clause Prusti points at when the body does not hold. */
  failing: 2,
};

/** The function as the skeleton gives it: the model writes only the rows between the braces. */
export const skeleton = { open: "pub fn confirm(&mut self, x: T) {", close: "}", indent: 4 };

/** Each attempt at the body: the first forgets to count the confirmation, the second holds. */
export const attempts: readonly { body: readonly string[]; proved: boolean }[] = [
  { body: ["self.events.push(x);"], proved: false },
  { body: ["self.events.push(x);", "self.len += 1;"], proved: true },
];

/** The tape's two printouts: Prusti's error (its first line wrapped at the tape's width), or the obligations. */
export const rejected: readonly { text: string; indent: number }[] = [
  { text: "error: [Prusti: verification error]", indent: 0 },
  { text: "postcondition might not hold.", indent: 0 },
  { text: "--> src/lib.rs:12:11", indent: 2 },
];
/** Each obligation's status, then its clause, in the columns the tape prints them in. */
export const proved: readonly { status: string; clause: string }[] = [
  { status: "green", clause: "self.len < self.cap" },
  { status: "green", clause: "self.len == old(self.len) + 1" },
];
export const clauseColumn = 6;

/** The certificate, lines of the JSON it is. */
export const certificate = [
  "introspectum-certificate/v1",
  '"scenario": "smoke_alarm",',
  '"status": "certified",',
  '"verifier": "prusti"',
];

/** The width of a face that holds `columns` columns between its margins. */
const faceWidth = (columns: number) => columns * type.advance + 2 * type.margin;

/**
 * The typewriter's sheet: its top edge's left end, and how it leans back from the platen. Rows
 * are counted from the top, row 0 the signature.
 */
export const sheet = {
  x: -110,
  w: faceWidth(skeleton.open.length),
  bottom: [0, 9, 38] satisfies Point,
  h: 52,
  lean: (12 * Math.PI) / 180,
  top: 8.5,
};

/** The direction down the sheet's face, from its top edge toward the platen. */
export const sheetDown: Point = [0, Math.sin(sheet.lean), -Math.cos(sheet.lean)];

/** The type element's centre at column 0, on its rail in front of the platen. */
export const head = { x: sheet.x + type.margin + type.advance / 2, y: 20.4, z: 37, r: 3.6 };

/** The copy holder's card, standing at the back of the bench. */
export const card = { x: -112, y: -26, z: 94, w: faceWidth(widest), h: 32, top: 8.5, lead: 9 };

/** The line guide's top, just under the descenders of row `row` of the card. */
export const guideTop = (row: number) => card.z + card.h - card.top - row * card.lead - 2;

/** The reading cabinet and its tape window, on the front face. */
export const cabinet = { x: 20, y: -26, w: faceWidth(widest) + 14, d: 66, h: 84, r: 4 };
export const tape = {
  x: cabinet.x + 7,
  y: cabinet.y + cabinet.d,
  z: 48,
  w: faceWidth(widest),
  h: 28,
  top: 8.5,
};

/** The verdict dial on the cabinet's front, its needle's angle for each verdict. */
export const dial = { x: cabinet.x + 24, z: 24, r: 15.5, red: -0.9, green: 0.9 };

/** The certificate's card: its widest line, and room beside its two short rows for the seal. */
const issueWidth = faceWidth(Math.max(...certificate.map((line) => line.length))) + 10;
const sealR = 6.8;

/** The certificate, issued out of the slot in the cabinet's lid. */
export const issue = {
  x: cabinet.x + 10,
  y: -14,
  w: issueWidth,
  h: 40,
  /** Its bottom edge when issued, just below the lid, held by the feed rollers. */
  z: 86,
  top: 8.5,
  lead: 7.6,
  seal: { u: issueWidth - type.margin - sealR - 1, v: 26.5, r: sealR },
};
/** The lid's top, where the slot is cut. */
export const lid = cabinet.h + 4;

/** The cash railway: its wire between two posts, and where the carrier docks at either end. */
export const wire = { y: -40, z: 148, from: -124, to: 10, dock: { left: -98, right: -6 } };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const ease = (value: number) => {
  const s = clamp(value, 0, 1);
  return s * s * (3 - 2 * s);
};
/** Share of the way from `from` to `to`, eased. */
const between = (t: number, from: number, to: number) => ease((t - from) / (to - from));

/** One attempt, in model time from its start: one unit per attempt. */
const beat = {
  /** Before the second attempt is typed, the last certificate goes back into the slot. */
  filed: 0.08,
  /** The type element returns to the margin, then types the body row by row. */
  type: 0.1,
  typed: 0.42,
  /** A pause at the end of each row while the element returns. */
  row: 0.03,
  /** The carrier takes the sheet to the cabinet. */
  send: 0.46,
  sent: 0.56,
  /** The tape is blank while the needle swings, then the verdict is printed. */
  check: 0.58,
  checked: 0.68,
  /** The carrier brings the verdict back, and a proof's certificate comes up. */
  back: 0.7,
  home: 0.8,
  /** The line guide moves to the failing clause, or back under the spec's id; then all holds. */
  mark: 0.81,
  marked: 0.86,
};

/** One cycle: two attempts at one function, one model unit each. */
export const length = attempts.length;
/** The page shows the cycle's end: the body that holds, its obligations green, the certificate out. */
export const rest = 1.9;

/** What the tape shows. */
export type Tape = { $: "Blank" } | { $: "Rejected" } | { $: "Proved" };

export type Pose = {
  /** The body rows as typed so far. */
  typed: readonly string[];
  /** The type element's column. */
  head: number;
  tape: Tape;
  /** The needle's angle from upright, positive toward green. */
  needle: number;
  /** The carrier's place on the wire: 0 docked at the copy holder, 1 at the cabinet. */
  carrier: number;
  /** The line guide: 0 under the spec's id, 1 under the failing clause. */
  guide: number;
  /** How far the certificate is out of its slot, 0 to 1. */
  issued: number;
};

/** The attempt at index `index` of the cycle, the one before it wrapping round. */
const attemptAt = (index: number) => {
  const attempt = attempts[((index % length) + length) % length];
  if (attempt === undefined) throw new Error(`No attempt ${index}.`);
  return attempt;
};

/** The column the type element stops at after typing an attempt: the end of its last row. */
const endOf = (body: readonly string[]) => skeleton.indent + (body.at(-1)?.length ?? 0);

/** The rows typed and the type element's column, `tau` model time into an attempt. */
function typing(body: readonly string[], previous: readonly string[], tau: number) {
  const typed = body.map(() => "");
  const total = body.reduce((sum, row) => sum + row.length, 0);
  const pace = (beat.typed - beat.type - beat.row * (body.length - 1)) / total;
  if (tau < beat.type) {
    const from = endOf(previous);
    return { typed, column: from + (skeleton.indent - from) * between(tau, 0, beat.type) };
  }
  let start = beat.type;
  for (const [index, row] of body.entries()) {
    const done = start + row.length * pace;
    if (tau < done) {
      const count = (tau - start) / pace;
      typed[index] = row.slice(0, Math.floor(count));
      return { typed, column: skeleton.indent + count };
    }
    typed[index] = row;
    const next = body[index + 1];
    if (next === undefined) break;
    if (tau < done + beat.row) {
      const end = skeleton.indent + row.length;
      return {
        typed,
        column: end + (skeleton.indent - end) * between(tau, done, done + beat.row),
      };
    }
    start = done + beat.row;
  }
  return { typed, column: endOf(body) };
}

/** The needle's angle for an attempt's verdict. */
const verdictOf = (outcome: { proved: boolean }) => (outcome.proved ? dial.green : dial.red);
/** Where the guide stands after an attempt's verdict: under the failing clause after a rejection. */
const markOf = (outcome: { proved: boolean }) => (outcome.proved ? 0 : 1);

/** The whole bench at model time `t`, from 0 to 2: two attempts at one function. */
export function pose(t: number): Pose {
  const index = clamp(Math.floor(t), 0, length - 1);
  const tau = t - index;
  const attempt = attemptAt(index);
  const before = attemptAt(index - 1);
  const { typed, column } = typing(attempt.body, before.body, tau);
  const printout: Tape =
    tau < beat.check
      ? before.proved
        ? { $: "Proved" }
        : { $: "Rejected" }
      : tau < beat.checked
        ? { $: "Blank" }
        : attempt.proved
          ? { $: "Proved" }
          : { $: "Rejected" };
  const swung = between(tau, beat.check, beat.checked - 0.02);
  const carrier = between(tau, beat.send, beat.sent) - between(tau, beat.back, beat.home);
  // The guide marks the failing clause from a rejection until the next verdict comes back.
  const moved = between(tau, beat.mark, beat.marked);
  const issued = attempt.proved
    ? between(tau, beat.back, beat.home)
    : before.proved
      ? 1 - between(tau, 0, beat.filed)
      : 0;
  return {
    typed,
    head: column,
    tape: printout,
    needle: verdictOf(before) + (verdictOf(attempt) - verdictOf(before)) * swung,
    carrier,
    guide: markOf(before) + (markOf(attempt) - markOf(before)) * moved,
    issued,
  };
}
