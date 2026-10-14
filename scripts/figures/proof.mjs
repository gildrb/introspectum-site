// Draws the homepage's figure, a proof bench (see `src/figures/proof-model.ts`), and writes it to
// `src/figures/proof.svg`. Run: node scripts/figures/proof.mjs [--preview] (see `engrave.mjs`).
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/proof-model.ts";
import { offsetOf, translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "proof";
const { type: T, sheet: SH, card: CH, cabinet: CB, tape: TP, dial: DL, issue: IS, wire: W } = M;

const BENCH = { x: -136, y: -50, w: 284, d: 122, r: 6 };
const BENCH_H = 10;
const FOOT_H = 7;

// The typewriter, built round its sheet: frame, platen housing, and the stepped keyboard deck.
const TW = { x: SH.x - 10, y: 2, w: SH.w + 21, d: 60, r: 5 };
const TW_FEET = 2;
const TW_BASE = 10;
const HOUSING = { x: TW.x + 2, y: 4, w: TW.w - 4, d: 20, r: 3 };
const HOUSING_TOP = 28;
const PLATEN = { x0: SH.x - 2, x1: SH.x + SH.w + 2, y: 12, z: 33, r: 5.5 };
const RAIL = { y: 24, z: HOUSING_TOP + 0.9, r: 0.9 };
const DECK = [
  { y: 24, d: 37.5, z: TW_BASE, h: 3 },
  { y: 24, d: 26, z: TW_BASE + 3, h: 3 },
  { y: 24, d: 14, z: TW_BASE + 6, h: 3 },
];
const KEY_ROWS = [
  { y: 31, z: TW_BASE + 9, x0: TW.x + 8, count: 12 },
  { y: 44, z: TW_BASE + 6, x0: TW.x + 11, count: 11 },
  { y: 54, z: TW_BASE + 3, x0: TW.x + 14, count: 10 },
];
const KEY_PITCH = 9.6;

const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  points: [
    ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
    [W.from, W.y, W.z + 6],
    [W.to, W.y, W.z + 6],
    [IS.x, IS.y, IS.z + IS.h],
    [IS.x + IS.w, IS.y, IS.z + IS.h],
    [CH.x, CH.y, CH.z + CH.h + 4],
  ],
});
const { P, at, S, L, D, byDepth, shadow, shadowOf } = E;

const fixed = (value) => Math.round(value * 1000) / 1000;
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];

/**
 * A transform onto a face: local `u` runs along world +x from `origin`, local `v` along `down`
 * (straight down for an upright face), one local unit a world unit, as `k.sideMatrix` does.
 */
function faceAt(origin, down = [0, 0, -1]) {
  const o = at(origin);
  const u = sub2(at([origin[0] + 1, origin[1], origin[2]]), o);
  const v = sub2(at([origin[0] + down[0], origin[1] + down[1], origin[2] + down[2]]), o);
  return `matrix(${[...u, ...v, ...o].map(fixed).join(" ")})`;
}

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * One line of code in a face's own coordinates, its baseline at `v`: monospace, and stretched to
 * exactly its columns' width, so it fits its face in whichever monospace face the reader has.
 */
function code(u, v, text, { part, anchor = "start", size = T.size } = {}) {
  const length =
    text.length === 0 ? "" : ` textLength="${fixed(M.span(text))}" lengthAdjust="spacingAndGlyphs"`;
  const named = part === undefined ? "" : ` data-part="${part}"`;
  const anchored = anchor === "start" ? "" : ` text-anchor="${anchor}"`;
  return `<text class="iso-code"${named} x="${fixed(u)}" y="${fixed(v)}" font-size="${size}"${length}${anchored}>${escape(text)}</text>`;
}

/** A rounded rectangle in a face's own coordinates. */
const rect = (u0, v0, u1, v1, r = 0.6) =>
  k.pathOf(k.roundedPlan({ x: u0, y: v0, w: u1 - u0, d: v1 - v0, r }, 3), true);

function bench() {
  const out = [shadow(k.slabOf(k.insetPlan(BENCH, -2), -BENCH_H - FOOT_H, 0.01, P).fill)];
  for (const [x, y] of byDepth(k.corners(BENCH, 18))) {
    out.push(S(k.cylinder(x, y, 8, -BENCH_H - FOOT_H, 2, P, 32), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 6, -BENCH_H - FOOT_H + 2, FOOT_H - 2, P, 28), { tone: "mid" }));
  }
  const seam = k.sideSeam(BENCH, -BENCH_H / 2, P, 8);
  out.push(
    S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.4), {
      tone: "hi",
      inner: L(seam, { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(BENCH, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "faint" }));
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, 0])),
      { size: 0.5 },
    ),
  );
  // A ruler strip along the front edge before the cabinet, its ticks hanging from its back edge.
  const strip = { x: CB.x + 2, y: BENCH.y + BENCH.d - 12, w: CB.w - 50, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3, 5, strip.y, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 1.5, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.5, strip.y + 3, 0.6])], {
      size: 0.4,
    }),
  );
  // The maker's plate, in front of the cabinet.
  const plate = { x: CB.x + CB.w - 44, y: CB.y + CB.d + 12, w: 36, d: 12, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P), { tone: "faint" }));
  out.push(
    L(
      [
        [plate.y + 4, 28],
        [plate.y + 6.5, 20],
        [plate.y + 9, 24],
      ]
        .map(([y, length]) => k.lineOnTop([plate.x + 5, y], [plate.x + 5 + length, y], 0.8, P))
        .join(""),
      { tone: "lo", free: true },
    ),
  );
  out.push(
    D(
      [at([plate.x + 2.6, plate.y + 6.5, 0.8]), at([plate.x + plate.w - 2.6, plate.y + 6.5, 0.8])],
      {
        size: 0.4,
      },
    ),
  );
  return out.join("");
}

/** A post of the cash railway, on its flange, the wire's eye on top. */
function post(x) {
  const out = [shadow(k.cylinder(x + 2, W.y - 1, 7, 0, 0.01, P, 28).fill)];
  out.push(S(k.cylinder(x, W.y, 6, 0, 2.4, P, 32, 0.4), { tone: "mid" }));
  out.push(
    D(
      k
        .corners({ x: x - 4.4, y: W.y - 4.4, w: 8.8, d: 8.8, r: 4 }, 0)
        .slice(2)
        .map(([px, py]) => at([px, py, 2.4])),
      { size: 0.45 },
    ),
  );
  out.push(
    S(k.cylinder(x, W.y, 2, 2.4, W.z + 4 - 2.4, P, 20), {
      tone: "mid",
      crease: "none",
      inner: L([40, 96].map((z) => k.sideArc(x, W.y, 2, z, P, 12)).join(""), { tone: "faint" }),
    }),
  );
  out.push(S(k.cylinder(x, W.y, 3, W.z - 2.2, 4.4, P, 24, 0.3), { tone: "mid" }));
  out.push(S(G.sphereOf([x, W.y, W.z + 4.6], 2.2, P), { tone: "mid" }));
  return out.join("");
}

/** The wire, between the posts' collars. */
function wireLine() {
  const out = [L(k.segment([W.from + 3, W.y, W.z], [W.to - 3, W.y, W.z], P), { tone: "mid" })];
  // The turnbuckle that keeps it taut, by the copy holder's post.
  const F = G.frameAlong([W.from + 8, W.y, W.z], [1, 0, 0]);
  out.push(S(G.disc(0, 1.4, 1.5, F, P), { tone: "mid" }));
  out.push(S(G.disc(1.4, 7.4, 1.1, F, P), { tone: "mid", crease: "none" }));
  out.push(S(G.disc(7.4, 8.8, 1.5, F, P), { tone: "mid" }));
  return out.join("");
}

/** The cash carrier, built docked at the copy holder: two wheels on the wire, a frame, its cup. */
function carrier() {
  const x = W.dock.left;
  const out = [];
  for (const dx of [-4.2, 4.2]) {
    const F = G.frameAlong([x + dx, W.y - 0.7, W.z + 2.4], [0, 1, 0]);
    out.push(S(G.disc(0, 1.4, 2.4, F, P), { tone: "mid" }));
  }
  // The frame in front of the wheels, their axles on it, and the rod down to the cup.
  const plate = { x: x - 7, y: W.y + 0.7, w: 14, d: 0.8, r: 0.3 };
  out.push(S(k.slabOf(plate, W.z - 4, 8.6, P, 2), { tone: "mid" }));
  out.push(
    D([at([x - 4.2, W.y + 1.5, W.z + 2.4]), at([x + 4.2, W.y + 1.5, W.z + 2.4])], { size: 0.6 }),
  );
  out.push(S(k.cylinder(x, W.y, 0.9, W.z - 8, 4, P, 12), { tone: "mid", crease: "none" }));
  // The cup the sheet and its verdict ride in, with its lid.
  out.push(
    S(k.cylinder(x, W.y, 5, W.z - 16, 6.4, P, 32, 0.3), {
      tone: "hi",
      inner: L(k.sideArc(x, W.y, 5, W.z - 12.8, P, 20), { tone: "faint" }),
    }),
  );
  out.push(S(k.cylinder(x, W.y, 5.4, W.z - 9.6, 1.6, P, 32, 0.3), { tone: "mid" }));
  out.push(L(k.ring(x, W.y, 1.4, W.z - 8, P, 12), { tone: "lo" }));
  return out.join("");
}

function copyHolder() {
  const board = { x: CH.x - 3, y: CH.y - 4, w: CH.w + 6, d: 3, r: 0.8 };
  const px = CH.x + CH.w / 2;
  const py = board.y - 2.4;
  const out = [shadow(k.cylinder(px + 3, py - 1, 10, 0, 0.01, P, 32).fill)];
  // The stand: a weighted foot, the post, and the clamp that holds the board.
  out.push(S(k.cylinder(px, py, 9, 0, 3, P, 40, 0.5), { tone: "mid" }));
  out.push(
    D(
      [0.7, 2.3, 3.9].map((a) => at([px + Math.cos(a) * 6.6, py + Math.sin(a) * 6.6, 3])),
      { size: 0.45 },
    ),
  );
  out.push(
    S(k.cylinder(px, py, 2.4, 3, CH.z - 3, P, 20), {
      tone: "mid",
      crease: "none",
      inner: L([30, 64].map((z) => k.sideArc(px, py, 2.4, z, P, 12)).join(""), { tone: "faint" }),
    }),
  );
  const clamp = { x: px - 4, y: board.y - 4.6, w: 8, d: 4.6, r: 1 };
  out.push(S(k.slabOf(clamp, CH.z - 6, 12, P, 2, 0.4), { tone: "mid" }));
  const knob = G.frameAlong([clamp.x + clamp.w, py, CH.z - 1], [1, 0, 0]);
  out.push(S(G.disc(0, 2, 1, knob, P), { tone: "mid" }));
  out.push(
    S(G.disc(2, 4.4, 2.4, knob, P), {
      tone: "mid",
      inner: L(G.ribsOf(knob, 2, 4.4, 2.4, 14, P, { least: 0.2 }), { tone: "faint" }),
    }),
  );
  // The board, and the card in front of it.
  const boardSeam = k.sideSeam(board, CH.z + CH.h / 2, P, 2);
  out.push(
    S(k.slabOf(board, CH.z - 4, CH.h + 8, P, 2, 0.5), {
      tone: "mid",
      inner: L(boardSeam, { tone: "faint" }),
    }),
  );
  out.push(
    S(k.slabOf({ x: CH.x, y: CH.y - 1, w: CH.w, d: 1, r: 0.3 }, CH.z, CH.h, P, 2), { tone: "hi" }),
  );
  const lines = M.spec.lines
    .map((text, row) => code(T.margin, CH.top + row * CH.lead, text))
    .join("");
  out.push(
    `<g transform="${faceAt([CH.x, CH.y, CH.z + CH.h])}">` +
      `<path class="iso-paper" d="${rect(0, 0, CH.w, CH.h, 0.3)}"/>${lines}` +
      `<path class="iso-line" data-tone="faint" d="${rect(0, 0, CH.w, CH.h, 0.3)}"/></g>`,
  );
  // The clip bar across the top, with its two screws.
  const bar = { x: CH.x + 12, y: CH.y - 0.6, w: CH.w - 24, d: 2.2, r: 0.8 };
  out.push(S(k.slabOf(bar, CH.z + CH.h - 1.6, 5.2, P, 2, 0.4), { tone: "mid" }));
  out.push(
    D(
      [
        at([bar.x + 4, bar.y + 1.1, CH.z + CH.h + 3.6]),
        at([bar.x + bar.w - 4, bar.y + 1.1, CH.z + CH.h + 3.6]),
      ],
      { size: 0.55 },
    ),
  );
  return out.join("");
}

/** The line guide, built under the spec's id: a bar across the card on two slides round the board. */
function guide() {
  const top = M.guideTop(0);
  const out = [];
  for (const x of [CH.x - 5.4, CH.x + CH.w + 3]) {
    out.push(
      S(k.slabOf({ x, y: CH.y - 4.6, w: 2.4, d: 5.8, r: 0.5 }, top - 3, 4.2, P, 2), {
        tone: "mid",
      }),
    );
  }
  out.push(
    S(k.slabOf({ x: CH.x - 4, y: CH.y + 0.2, w: CH.w + 8, d: 1.2, r: 0.4 }, top - 1.2, 1.2, P, 2), {
      tone: "hi",
      lit: true,
    }),
  );
  return out.join("");
}

function typewriter() {
  const out = [shadowOf(TW, 0, 5)];
  for (const [x, y] of byDepth(k.corners(TW, 7))) {
    out.push(S(k.cylinder(x, y, 3.4, 0, TW_FEET, P, 20), { tone: "mid" }));
  }
  const baseSeam = k.sideSeam(TW, (TW_FEET + TW_BASE) / 2, P, 5);
  out.push(
    S(k.slabOf(TW, TW_FEET, TW_BASE - TW_FEET, P, 5, 0.8), {
      tone: "mid",
      inner: L(baseSeam, { tone: "faint" }),
    }),
  );
  const housingSeam = k.sideSeam(HOUSING, HOUSING_TOP - 6, P, 3);
  out.push(
    S(k.slabOf(HOUSING, TW_BASE, HOUSING_TOP - TW_BASE, P, 3, 0.8), {
      tone: "mid",
      inner: L(housingSeam, { tone: "faint" }),
    }),
  );
  out.push(sheet());
  // The platen between its side plates, its knobs outside them.
  for (const x of [PLATEN.x0 - 6, PLATEN.x1]) {
    out.push(
      S(k.slabOf({ x, y: 6, w: 6, d: 14, r: 1 }, HOUSING_TOP, 12, P, 2, 0.4), { tone: "mid" }),
    );
    out.push(D([at([x + 6, PLATEN.y, PLATEN.z])], { size: 0.6 }));
  }
  const F = G.frameAlong([PLATEN.x0, PLATEN.y, PLATEN.z], [1, 0, 0]);
  const length = PLATEN.x1 - PLATEN.x0;
  out.push(S(G.disc(0, length, PLATEN.r, F, P), { tone: "mid" }));
  for (const [s0, s1] of [
    [-13, -6],
    [length + 6, length + 13],
  ]) {
    out.push(
      S(G.disc(s0, s1, 6.5, F, P), {
        tone: "mid",
        inner: L(G.ribsOf(F, s0, s1, 6.5, 26, P, { least: 0.2 }), { tone: "faint" }),
      }),
    );
  }
  out.push(S(G.disc(length + 13, length + 14.4, 2.6, F, P), { tone: "mid" }));
  // The bail that holds the sheet to the platen, on two arms from the side plates.
  out.push(bail());
  // The rail in front of the platen that the type element runs on.
  out.push(rodSvg([PLATEN.x0 - 1, RAIL.y, RAIL.z], [PLATEN.x1 + 1, RAIL.y, RAIL.z], RAIL.r));
  // The margin stops, one either side of the line's columns.
  for (const column of [-1.2, M.skeleton.open.length + 0.2]) {
    const x = M.head.x - T.advance / 2 + column * T.advance;
    out.push(
      S(k.slabOf({ x: x - 1, y: RAIL.y - 1.6, w: 2, d: 3.2, r: 0.4 }, HOUSING_TOP, 3, P, 2), {
        tone: "mid",
      }),
    );
  }
  out.push(
    `<g data-part="head" transform="${transform(offsetOf([restPose.head * T.advance, 0, 0], P))}">${typeElement()}</g>`,
  );
  // The keyboard deck, in steps, and its keys, back row first.
  for (const step of DECK) {
    out.push(
      S(
        k.slabOf(
          { x: HOUSING.x, y: step.y, w: HOUSING.w, d: step.d, r: 2 },
          step.z,
          step.h,
          P,
          2,
          0.4,
        ),
        {
          tone: "mid",
        },
      ),
    );
  }
  for (const row of KEY_ROWS) {
    for (let index = 0; index < row.count; index++) {
      const x = row.x0 + index * KEY_PITCH;
      out.push(S(k.cylinder(x, row.y, 3, row.z, 2.6, P, 20, 0.3), { tone: "hi", crease: "lo" }));
      out.push(L(k.ring(x, row.y, 2, row.z + 2.6, P, 16), { tone: "faint" }));
    }
  }
  const space = { x: TW.x + 34, y: 58, w: 48, d: 3.4, r: 1.6 };
  out.push(S(k.slabOf(space, TW_BASE + 3, 1.4, P, 3, 0.3), { tone: "hi", crease: "lo" }));
  // The name plate on the front of the frame, with its two rivets.
  const nose = TW.y + TW.d;
  const plate =
    `<g transform="${faceAt([TW.x + TW.w / 2 - 18, nose, TW_BASE - 1.6])}">` +
    `<path class="iso-line" data-tone="lo" d="${rect(0, 0, 36, 4.6)}"/>` +
    L(
      [
        [5, 1.7, 22],
        [5, 3.1, 16],
      ]
        .map(([u, v, w]) => `M${u} ${v}H${u + w}`)
        .join(""),
      { tone: "faint", free: true },
    ) +
    `</g>`;
  out.push(plate);
  out.push(
    D(
      [
        at([TW.x + TW.w / 2 - 16, nose, TW_BASE - 3.9]),
        at([TW.x + TW.w / 2 + 16, nose, TW_BASE - 3.9]),
      ],
      { size: 0.45 },
    ),
  );
  return out.join("");
}

/** A round rod between two world points, turned on the lathe so its ends are true caps. */
function rodSvg(a, b, r) {
  const along = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const length = Math.hypot(...along);
  const F = G.frameAlong(a, along);
  return S(G.disc(0, length, r, F, P), { tone: "mid", crease: "none" });
}

/** A point `v` down the sheet from its top edge's left end, `out` in front of it. */
function onSheet(u, v, out = 0) {
  const top = [SH.x, SH.bottom[1] - M.sheetDown[1] * SH.h, SH.bottom[2] - M.sheetDown[2] * SH.h];
  const n = [0, Math.cos(SH.lean), Math.sin(SH.lean)];
  return [
    top[0] + u,
    top[1] + M.sheetDown[1] * v + n[1] * out,
    top[2] + M.sheetDown[2] * v + n[2] * out,
  ];
}

function sheet() {
  const out = [];
  const face = faceAt(onSheet(0, 0), M.sheetDown);
  const rows = [M.skeleton.open, ...restPose.typed.map(() => ""), M.skeleton.close];
  const body = M.skeleton.indent * T.advance + T.margin;
  const text = [
    code(T.margin, SH.top, M.skeleton.open),
    ...restPose.typed.map((typed, index) =>
      code(body, SH.top + (index + 1) * T.lead, typed, { part: `typed-${index}` }),
    ),
    code(T.margin, SH.top + (rows.length - 1) * T.lead, M.skeleton.close),
  ];
  // The sheet, then the scale that the type element's column is read against, one tick a column.
  const scaleV = SH.top + rows.length * T.lead - 2.4;
  const ticks = [];
  const columns = Math.round((SH.w - 2 * T.margin) / T.advance);
  for (let column = 0; column <= columns; column++) {
    const u = T.margin + column * T.advance;
    ticks.push({
      major: column % 5 === 0,
      d: `M${fixed(u)} ${fixed(scaleV)}V${fixed(scaleV + (column % 5 === 0 ? 2.2 : 1.2))}`,
    });
  }
  out.push(
    `<g transform="${face}">` +
      `<path class="iso-paper" d="${rect(0, 0, SH.w, SH.h, 0.4)}"/>` +
      `<path class="iso-line" data-tone="mid" d="${rect(0, 0, SH.w, SH.h, 0.4)}"/>` +
      text.join("") +
      `<path class="iso-paper" d="${rect(-3, scaleV, SH.w + 3, scaleV + 3.6, 0.6)}"/>` +
      L(
        ticks
          .filter((tick) => !tick.major)
          .map((tick) => tick.d)
          .join(""),
        { tone: "faint" },
      ) +
      L(
        ticks
          .filter((tick) => tick.major)
          .map((tick) => tick.d)
          .join(""),
        { tone: "lo" },
      ) +
      `<path class="iso-line" data-tone="mid" d="${rect(-3, scaleV, SH.w + 3, scaleV + 3.6, 0.6)}"/>` +
      `</g>`,
  );
  return out.join("");
}

function bail() {
  const v = SH.h - 7;
  const a = onSheet(-5, v, 1.6);
  const b = onSheet(SH.w + 5, v, 1.6);
  const out = [];
  // Its arms run down to the side plates' tops.
  for (const [end, x] of [
    [a, PLATEN.x0 - 3],
    [b, PLATEN.x1 + 3],
  ]) {
    out.push(rodSvg([x, end[1], end[2]], [x, 13, HOUSING_TOP + 12], 0.9));
  }
  out.push(rodSvg([a[0] - 3, a[1], a[2]], [b[0] + 3, b[1], b[2]], 1));
  for (const u of [SH.w * 0.22, SH.w * 0.78]) {
    const F = G.frameAlong(onSheet(u - 3, v, 1.6), [1, 0, 0]);
    out.push(S(G.disc(0, 6, 2, F, P), { tone: "hi" }));
  }
  return out.join("");
}

/** The type element on its carrier, built at column 0: the reader watches it write. */
function typeElement() {
  const out = [];
  const { x, y, z, r } = M.head;
  out.push(
    S(k.slabOf({ x: x - 4.5, y: RAIL.y - 3, w: 9, d: 6, r: 1 }, HOUSING_TOP, 5, P, 2, 0.4), {
      tone: "mid",
    }),
  );
  out.push(
    S(k.cylinder(x, y, 1.4, HOUSING_TOP + 5, z - r - HOUSING_TOP - 5 + 0.6, P, 12), {
      tone: "mid",
      crease: "none",
    }),
  );
  out.push(S(G.sphereOf([x, y, z], r, P), { tone: "hi" }));
  // The rows of type round the ball, as dots on its near side.
  const dots = [];
  for (const [lat, count] of [
    [0.45, 5],
    [0, 6],
    [-0.45, 5],
  ]) {
    for (let index = 0; index < count; index++) {
      const lon = 0.35 + (index / (count - 1)) * 1.9;
      dots.push(
        at([
          x + Math.cos(lon) * Math.cos(lat) * r,
          y + Math.sin(lon) * Math.cos(lat) * r,
          z + Math.sin(lat) * r,
        ]),
      );
    }
  }
  out.push(D(dots, { size: 0.35, tone: "lo" }));
  return out.join("");
}

/** The cabinet: its body, the slot the certificate comes out of, the tape window and the dial. */
function cabinet() {
  const out = [shadowOf(CB, 0, 6)];
  out.push(S(k.slabOf(k.insetPlan(CB, 2), 0, 4, P, 3), { tone: "mid" }));
  const seam = k.sideSeam(CB, 43.5, P, 4);
  out.push(
    S(k.slabOf(CB, 4, CB.h - 4, P, 4, 1), { tone: "mid", inner: L(seam, { tone: "faint" }) }),
  );
  out.push(S(k.slabOf(k.insetPlan(CB, -0.8), CB.h, 4, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(CB, 4), M.lid, P, 4), { tone: "faint" }));
  out.push(
    D(
      k.corners(CB, 3.4).map(([x, y]) => at([x, y, M.lid])),
      { size: 0.5 },
    ),
  );
  // The lid's two latches on the front, and a grip let into the right side.
  const face = CB.y + CB.d;
  for (const x of [CB.x + 18, CB.x + CB.w - 18]) {
    out.push(
      S(k.slabOf({ x: x - 3, y: face, w: 6, d: 1.2, r: 0.4 }, CB.h - 4.8, 6.8, P, 2, 0.3), {
        tone: "mid",
      }),
    );
    out.push(D([at([x, face + 1.2, CB.h - 2.4])], { size: 0.5 }));
  }
  const right = CB.x + CB.w;
  const grip = k
    .roundedPlan({ x: CB.y + 20, y: CB.h - 26, w: 26, d: 6, r: 3 }, 6)
    .map(([y, z]) => at([right, y, z]));
  out.push(
    `<path fill="url(#${NAME}-h0)" d="${k.pathOf(grip, true)}"/>`,
    L(k.pathOf(grip, true), { tone: "lo" }),
  );
  out.push(
    D([at([right, CB.y + 16, CB.h - 23]), at([right, CB.y + 50, CB.h - 23])], { size: 0.45 }),
  );
  // A carrying handle folded flat on the lid, on two lugs.
  const lugs = [CB.x + 10, CB.x + CB.w - 14];
  for (const x of lugs) {
    out.push(S(k.slabOf({ x, y: 4, w: 4, d: 6, r: 0.8 }, M.lid, 3.2, P, 2, 0.3), { tone: "mid" }));
  }
  const [left, rightLug] = lugs.map((x) => x + 2);
  const z = M.lid + 1.4;
  out.push(rodSvg([left, 7, z], [left, 22, z], 1.1));
  out.push(rodSvg([rightLug, 7, z], [rightLug, 22, z], 1.1));
  out.push(rodSvg([left - 1, 22, z], [rightLug + 1, 22, z], 1.4));
  out.push(
    D(
      lugs.map((x) => at([x + 4, 7, z])),
      { size: 0.6 },
    ),
  );
  out.push(certificateSlot());
  out.push(front());
  return out.join("");
}

function certificateSlot() {
  const out = [];
  const slot = { x: IS.x - 1.5, y: IS.y - 2, w: IS.w + 3, d: 3, r: 1 };
  const mouth = k.planOutline(slot, M.lid, P, 3);
  out.push(`<path fill="url(#${NAME}-h0)" d="${mouth}"/>`, L(mouth, { tone: "mid" }));
  // The feed rollers either side of the card, in their bearing blocks.
  const rollerZ = M.lid + 2.2;
  const roller = (y) => {
    const F = G.frameAlong([IS.x - 2, y, rollerZ], [1, 0, 0]);
    return S(G.disc(0, IS.w + 4, 2.2, F, P), { tone: "hi", crease: "lo" });
  };
  const bearings = (side) =>
    [IS.x - 7, IS.x + IS.w + 2]
      .map(
        (x) =>
          S(k.slabOf({ x, y: IS.y - 6.2, w: 5, d: 9.4, r: 1 }, M.lid, 5.4, P, 2, 0.4), {
            tone: "mid",
          }) + D([at([x + 2.5, side, rollerZ])], { size: 0.45 }),
      )
      .join("");
  out.push(bearings(IS.y - 3.2));
  out.push(roller(IS.y - 3.2));
  out.push(issued());
  out.push(roller(IS.y + 2.2));
  return out.join("");
}

/** The certificate, built issued; it slides down out of sight into the slot it is clipped to. */
function issued() {
  const rise = offsetOf([0, 0, (restPose.issued - 1) * IS.h], P);
  const clip = k.slabOf({ x: IS.x - 4, y: IS.y - 2, w: IS.w + 8, d: 3, r: 0.5 }, M.lid, 80, P).fill;
  const face = faceAt([IS.x, IS.y, IS.z + IS.h]);
  const lines = M.certificate
    .map((text, row) => code(T.margin, IS.top + row * IS.lead, text))
    .join("");
  const { u, v, r } = IS.seal;
  const seal = [];
  const ring = (radius) =>
    k.pathOf(
      Array.from({ length: 49 }, (_, i) => [
        u + Math.cos((i / 48) * Math.PI * 2) * radius,
        v + Math.sin((i / 48) * Math.PI * 2) * radius,
      ]),
    );
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    seal.push(
      `M${fixed(u + Math.cos(a) * (r - 1.6))} ${fixed(v + Math.sin(a) * (r - 1.6))}L${fixed(u + Math.cos(a) * r)} ${fixed(v + Math.sin(a) * r)}`,
    );
  }
  const star = k.pathOf(
    Array.from({ length: 11 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const radius = i % 2 === 0 ? r * 0.42 : r * 0.18;
      return [u + Math.cos(a) * radius, v + Math.sin(a) * radius];
    }),
  );
  const back = transform([-rise[0], -rise[1]]);
  return (
    `<g data-part="issued" transform="${transform(rise)}">` +
    `<clipPath id="${NAME}-slot"><path data-hold transform="${back}" d="${clip}"/></clipPath>` +
    `<g clip-path="url(#${NAME}-slot)">` +
    S(k.slabOf({ x: IS.x, y: IS.y - 1, w: IS.w, d: 1, r: 0.3 }, IS.z, IS.h, P, 2), { tone: "hi" }) +
    `<g transform="${face}"><path class="iso-paper" d="${rect(0, 0, IS.w, IS.h, 0.3)}"/>${lines}` +
    L(ring(r) + ring(r - 1.6) + ring(r * 0.62), { tone: "mid" }) +
    L(seal.join(""), { tone: "lo" }) +
    L(star, { tone: "mid" }) +
    `</g></g></g>`
  );
}

/** The cabinet's front: the tape window, the dial, the maker's plate and the vents. */
function front() {
  const y = CB.y + CB.d;
  const out = [];
  // The window, a recess with the tape at its back: its floor and left wall show, as seen from above right.
  const x0 = TP.x;
  const x1 = TP.x + TP.w;
  const z0 = TP.z;
  const z1 = TP.z + TP.h;
  const depth = 2.4;
  out.push(
    `<clipPath id="${NAME}-window"><path transform="${faceAt([x0, y, z1])}" d="${rect(0, 0, TP.w, TP.h, 1.2)}"/></clipPath>`,
  );
  const error = M.rejected
    .map((line, row) => code(T.margin + line.indent * T.advance, TP.top + row * T.lead, line.text))
    .join("");
  const obligations = M.proved
    .map(
      (line, row) =>
        code(T.margin, TP.top + row * T.lead, line.status) +
        code(T.margin + M.clauseColumn * T.advance, TP.top + row * T.lead, line.clause),
    )
    .join("");
  const floor = k.pathOf(
    [at([x0, y, z0]), at([x1, y, z0]), at([x1, y - depth, z0]), at([x0, y - depth, z0])],
    true,
  );
  const wall = k.pathOf(
    [at([x0, y, z0]), at([x0, y, z1]), at([x0, y - depth, z1]), at([x0, y - depth, z0])],
    true,
  );
  out.push(
    `<g clip-path="url(#${NAME}-window)">` +
      `<g transform="${faceAt([x0, y - depth, z1])}">` +
      `<path class="iso-paper" d="${rect(-2, -2, TP.w + 2, TP.h + 2)}"/>` +
      `<g data-part="tape-rejected"${shownOn("Rejected")}>${error}</g>` +
      `<g data-part="tape-proved"${shownOn("Proved")}>${obligations}</g>` +
      `</g>` +
      `<path class="iso-top" d="${floor}"/>` +
      `<path class="iso-shade" data-shade="1" d="${wall}"/>` +
      `</g>`,
  );
  out.push(
    `<g transform="${faceAt([x0, y, z1])}">` +
      `<path class="iso-line" data-tone="lo" d="${rect(0, 0, TP.w, TP.h, 1.2)}"/>` +
      `<path class="iso-line" data-tone="faint" d="${rect(-2.4, -2.4, TP.w + 2.4, TP.h + 2.4, 2)}"/>` +
      `</g>`,
  );
  out.push(
    D(
      [
        at([x0 - 1.2, y, z1 + 1.2]),
        at([x1 + 1.2, y, z1 + 1.2]),
        at([x0 - 1.2, y, z0 - 1.2]),
        at([x1 + 1.2, y, z0 - 1.2]),
      ],
      { size: 0.45 },
    ),
  );
  out.push(dial(y));
  // The maker's plate and the vents, right of the dial.
  const right = CB.x + CB.w;
  const plateU = DL.x + DL.r + 10;
  out.push(
    `<g transform="${faceAt([plateU, y, DL.z + 11])}">` +
      `<path class="iso-line" data-tone="lo" d="${rect(0, 0, right - 8 - plateU, 9, 0.8)}"/>` +
      `<path class="iso-line" data-tone="faint" d="${rect(1.4, 1.4, right - 8 - plateU - 1.4, 7.6, 0.5)}"/>` +
      L(
        [
          [3.2, 30],
          [5.2, 22],
          [7.2, 26],
        ]
          .map(([v, w]) => `M5 ${v}H${5 + w}`)
          .join(""),
        { tone: "lo", free: true },
      ) +
      `</g>`,
  );
  const vents = [];
  for (let u = plateU + 2; u < right - 10; u += 4) vents.push(rect(u, 0, u + 1.6, 12, 0.8));
  out.push(
    `<g transform="${faceAt([0, y, DL.z - 2])}">${L(vents.join(""), { tone: "faint" })}</g>`,
  );
  out.push(
    D(
      k.corners({ x: CB.x, y: 0, w: CB.w, d: CB.h, r: 0 }, 3.4).map(([x, z]) => at([x, y, z])),
      { size: 0.5 },
    ),
  );
  return out.join("");
}

/** The verdict dial: a bezel standing out of the front, its scale from red to green, the needle. */
function dial(y) {
  const out = [];
  const F = G.frameAlong([DL.x, y, DL.z], [0, 1, 0]);
  out.push(S(G.disc(0, 1.8, DL.r + 1.8, F, P), { tone: "mid" }));
  const face = faceAt([DL.x, y + 1.8, DL.z]);
  const arc = [];
  const ticks = { minor: [], major: [] };
  const radius = DL.r - 2.2;
  const from = DL.red * 1.15;
  const to = DL.green * 1.15;
  for (let i = 0; i <= 40; i++) {
    const a = from + ((to - from) * i) / 40;
    arc.push([Math.sin(a) * radius, -Math.cos(a) * radius]);
  }
  for (let i = 0; i <= 12; i++) {
    const a = from + ((to - from) * i) / 12;
    const long = i % 3 === 0;
    (long ? ticks.major : ticks.minor).push(
      `M${fixed(Math.sin(a) * radius)} ${fixed(-Math.cos(a) * radius)}L${fixed(Math.sin(a) * (radius - (long ? 2.4 : 1.4)))} ${fixed(-Math.cos(a) * (radius - (long ? 2.4 : 1.4)))}`,
    );
  }
  const needleDeg = (restPose.needle * 180) / Math.PI;
  out.push(
    `<g transform="${face}">` +
      `<circle class="iso-paper" r="${DL.r}"/><circle class="iso-line" data-tone="faint" r="${DL.r}"/>` +
      L(k.pathOf(arc), { tone: "lo" }) +
      L(ticks.minor.join(""), { tone: "faint" }) +
      L(ticks.major.join(""), { tone: "lo" }) +
      `<text class="iso-face-text" data-tone="mid" x="${fixed(-DL.r * 0.5)}" y="${fixed(DL.r * 0.5)}" font-size="4.2" text-anchor="middle">red</text>` +
      `<text class="iso-face-text" data-tone="mid" x="${fixed(DL.r * 0.5)}" y="${fixed(DL.r * 0.5)}" font-size="4.2" text-anchor="middle">green</text>` +
      `<path data-part="needle" class="iso-line" data-tone="hi" data-free="end" transform="rotate(${fixed(needleDeg)})" d="M0 0.6V${fixed(-(radius - 0.6))}"/>` +
      `<circle class="iso-paper" r="1.6"/><circle class="iso-line" data-tone="mid" r="1.6"/>` +
      `</g>`,
  );
  return out.join("");
}

const { moment } = E;
const restPose = M.pose(moment);
/** Hides a printout of the tape unless the drawn moment shows it. */
const shownOn = (printout) => (restPose.tape.$ === printout ? "" : ' display="none"');

const parts = [
  bench(),
  post(W.from),
  post(W.to),
  wireLine(),
  `<g data-part="carrier" transform="${transform(offsetOf([restPose.carrier * (W.dock.right - W.dock.left), 0, 0], P))}">${carrier()}</g>`,
  copyHolder(),
  `<g data-part="guide" transform="${transform(offsetOf([0, 0, (M.guideTop(M.spec.failing) - M.guideTop(0)) * restPose.guide], P))}">${guide()}</g>`,
  typewriter(),
  cabinet(),
];
E.write(parts, moment);
