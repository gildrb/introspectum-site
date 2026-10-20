// Draws the Software Factory's figure, a mint (see `src/figures/mint-model.ts`), and writes it to
// `src/figures/mint.svg`. Run: node scripts/figures/mint.mjs [--preview] (see `engrave.mjs`).
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/mint-model.ts";
import { offsetOf, translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "mint";
const { press: PR, balance: BA } = M;

const BENCH = { x: -160, y: -62, w: 252, d: 124, r: 6 };
const BENCH_H = 10;
const FOOT_H = 7;
const PLINTH = { x: -122, y: -34, w: 80, d: 68, r: 3 };
const BOX = { x: -36, y: 36, w: 44, d: 22, r: 2 };
const BOX_H = 18;
const LID_H = 4;

const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  points: [
    ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
    [PR.x + PR.barHalf + PR.ballR, 0, PR.barZ + PR.ballR],
    [PR.x - PR.barHalf - PR.ballR, 0, PR.barZ + PR.ballR],
    [PR.x, PR.barHalf + PR.ballR, PR.barZ + PR.ballR],
    [PR.x, -PR.barHalf - PR.ballR, PR.barZ + PR.ballR],
  ],
});
const { P, at, S, L, D, up, byDepth, shadow, shadowOf } = E;

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
  // A ruler strip along the front edge, its ticks hanging from the strip's back edge.
  const strip = { x: -150, y: BENCH.y + BENCH.d - 12, w: 102, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3, 5, strip.y, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 1.5, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.5, strip.y + 3, 0.6])], {
      size: 0.4,
    }),
  );
  // The maker's plate, at the back on the right.
  const plate = { x: 50, y: BENCH.y + 6, w: 34, d: 12, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P), { tone: "faint" }));
  out.push(
    L(
      [
        [plate.y + 4, 28],
        [plate.y + 6.5, 20],
        [plate.y + 9, 24],
      ]
        .map(([y, length]) => k.lineOnTop([plate.x + 6, y], [plate.x + 6 + length, y], 0.8, P))
        .join(""),
      { tone: "lo", free: true },
    ),
  );
  out.push(
    D([at([plate.x + 3, plate.y + 6.5, 0.8]), at([plate.x + plate.w - 3, plate.y + 6.5, 0.8])], {
      size: 0.4,
    }),
  );
  return out.join("");
}

function crucible() {
  const { x, y, r, top } = M.crucible;
  const out = [shadow(k.cylinder(x + 3, y - 1, 15, 0, 0.01, P, 40).fill)];
  // A fire ring of brick, its vents, and the crucible sitting in it.
  out.push(
    S(k.cylinder(x, y, 14, 0, 6, P, 48, 0.6), {
      tone: "mid",
      inner: L(k.sideArc(x, y, 14, 3, P, 32), { tone: "faint" }),
    }),
  );
  for (const angle of [0.35, 0.95, 1.55]) {
    const c = [x + Math.cos(angle) * 14.05, y + Math.sin(angle) * 14.05];
    out.push(
      S(k.slabOf({ x: c[0] - 1.2, y: c[1] - 1.2, w: 2.4, d: 2.4, r: 1.1 }, 1.2, 2.8, P, 3), {
        tone: "lo",
        crease: "none",
      }),
    );
  }
  const F = up(x, y, 6);
  const body = [
    [0, 6.5],
    [1.5, 7.6, 1],
    [4, 9, 1],
    [7, 9.8, 1],
    [top - 6 - 1.2, r, 1],
    [top - 6, r],
  ];
  out.push(
    S(G.solidOf(body, F, P), {
      tone: "hi",
      inner: L(G.arcOf(F, 4, 9, P, { slope: 0.5 }), { tone: "faint" }),
    }),
  );
  // The lip, and the melt inside it.
  out.push(S(G.ringBand(top - 6, top - 6 + 1.2, r - 1.3, r + 0.6, F, P), { tone: "hi" }));
  out.push(`<path class="iso-paper" d="${G.circleOf(F, top - 6 + 1.2, r - 1.3, P)}"/>`);
  out.push(shadow(G.circleOf(F, top - 6 + 1.2 - 0.01, r - 1.3, P)));
  out.push(L(G.circleOf(F, top - 6 + 1.2, r - 1.3, P), { tone: "mid" }));
  out.push(`<path class="iso-paper" d="${G.circleOf(F, top - 6 - 1.5, r - 3.2, P)}"/>`);
  out.push(L(G.circleOf(F, top - 6 - 1.5, r - 3.2, P), { tone: "faint" }));
  return out.join("");
}

/** A trough on posts, from `from` to `to` (its floor under the coin), open at the top. */
function trough(from, to, posts, { width = 14 } = {}) {
  const axis = G.sub3(to, from);
  const a = G.unit3(axis);
  const u = G.unit3(G.cross3([0, 0, 1], a));
  const v = G.cross3(a, u);
  const length = G.len3(axis);
  const F = G.frameOf(G.sub3(from, G.mul3(v, 0.9)), a, u, v);
  const half = width / 2;
  const out = [];
  for (const [s, base] of posts) {
    const p = G.add3(from, G.mul3(a, s));
    out.push(S(k.cylinder(p[0], p[1], 3, base, 1.2, P, 20), { tone: "mid" }));
    out.push(
      S(k.cylinder(p[0], p[1], 1.3, base + 1.2, p[2] - base - 2.2, P, 16), {
        tone: "mid",
        crease: "none",
      }),
    );
  }
  const floor = G.prismOf(
    F,
    [
      [-half, -0.9],
      [half, -0.9],
      [half, 0],
      [-half, 0],
    ],
    0,
    length,
    P,
  );
  out.push(S(floor, { tone: "mid" }));
  for (const side of [-1, 1]) {
    const x0 = side * half - (side > 0 ? 1.2 : 0);
    const wall = G.prismOf(
      F,
      [
        [x0, 0],
        [x0 + 1.2, 0],
        [x0 + 1.2, 3.2],
        [x0, 3.2],
      ],
      0,
      length,
      P,
    );
    out.push(S(wall, { tone: "mid" }));
  }
  return out.join("");
}

function plinth() {
  const out = [shadowOf(PLINTH, 0, 5)];
  const seam = k.sideSeam(PLINTH, PR.plinthTop / 2, P, 3);
  out.push(
    S(k.slabOf(PLINTH, 0, PR.plinthTop, P, 3, 1), {
      tone: "mid",
      inner: L(seam, { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(PLINTH, 4), PR.plinthTop, P, 3), { tone: "faint" }));
  const bolster = { x: PR.x - 26, y: -28, w: 52, d: 56, r: 2 };
  out.push(
    S(k.slabOf(bolster, PR.plinthTop, PR.bolsterTop - PR.plinthTop, P, 3, 0.6), { tone: "mid" }),
  );
  out.push(
    D(
      k.corners(bolster, 4).map(([x, y]) => at([x, y, PR.bolsterTop])),
      { size: 0.55 },
    ),
  );
  // The blanks waiting for the press, a short stack on the plinth.
  const stack = [PR.x - 30, 22];
  for (let index = 0; index < 4; index++)
    out.push(
      S(
        k.cylinder(stack[0], stack[1], M.coin.r, PR.plinthTop + index * M.coin.h, M.coin.h, P, 36),
        { tone: "hi" },
      ),
    );
  return out.join("");
}

function column(y) {
  const out = [];
  out.push(S(k.cylinder(PR.x, y, 6.2, PR.bolsterTop, 4, P, 32, 0.4), { tone: "mid" }));
  const seams = [70, 104].map((z) => k.sideArc(PR.x, y, PR.columnR, z, P, 20)).join("");
  out.push(
    S(
      k.cylinder(
        PR.x,
        y,
        PR.columnR,
        PR.bolsterTop + 4,
        PR.crossheadBottom - PR.bolsterTop - 8,
        P,
        28,
      ),
      { tone: "mid", crease: "none", inner: L(seams, { tone: "faint" }) },
    ),
  );
  out.push(S(k.cylinder(PR.x, y, 6.2, PR.crossheadBottom - 4, 4, P, 32, 0.4), { tone: "mid" }));
  return out.join("");
}

function anvil() {
  const out = [];
  out.push(S(k.cylinder(PR.x, 0, 11, PR.bolsterTop, 6, P, 48, 0.6), { tone: "mid" }));
  // Two clamps hold the lower die, each with its screw.
  for (const dx of [-15, 9]) {
    const plan = { x: PR.x + dx, y: -5, w: 6, d: 10, r: 1 };
    out.push(S(k.slabOf(plan, PR.bolsterTop, 7.5, P, 2, 0.4), { tone: "mid" }));
    out.push(L(k.ring(plan.x + 3, 0, 1.6, PR.bolsterTop + 7.5, P, 14), { tone: "lo" }));
    out.push(D([at([plan.x + 3, 0, PR.bolsterTop + 7.5])], { size: 0.5 }));
  }
  out.push(
    S(k.cylinder(PR.x, 0, 8, PR.bolsterTop + 6, PR.dieTop - PR.bolsterTop - 6, P, 40, 0.4), {
      tone: "hi",
    }),
  );
  out.push(L(k.ring(PR.x, 0, 5.6, PR.dieTop, P, 32), { tone: "faint" }));
  return out.join("");
}

/** The ram, its upper die and the screw below the crosshead, drawn at rest: the live code lowers them. */
function ram() {
  const out = [];
  const z0 = PR.ramRest + 5;
  out.push(S(k.cylinder(PR.x, 0, 8, PR.ramRest, 5, P, 40, 0.4), { tone: "hi" }));
  const body = {
    x: PR.x - 10,
    y: -PR.columnY + PR.columnR,
    w: 20,
    d: 2 * (PR.columnY - PR.columnR),
    r: 2,
  };
  const seam = k.sideSeam(body, z0 + 5, P, 3);
  out.push(
    S(k.slabOf(body, z0, 10, P, 3, 0.6), { tone: "mid", inner: L(seam, { tone: "faint" }) }),
  );
  // Guide shoes against the columns, and the screw's collar on top.
  for (const y of [body.y + 1.6, body.y + body.d - 1.6]) {
    out.push(D([at([PR.x - 6, y, z0 + 10]), at([PR.x + 6, y, z0 + 10])], { size: 0.5 }));
  }
  out.push(S(k.cylinder(PR.x, 0, 5.8, z0 + 10, 4, P, 32, 0.4), { tone: "mid" }));
  return out.join("");
}

/** A screw that slides out of a face along `+F.a` (`G.rodOut`), with its thread. */
function screwRod(id, F, from, to, stroke) {
  const rod = G.rodOut(F, from, to, PR.screwR, P, { stroke });
  let threads = "";
  for (let s = from - stroke; s < to - 1; s += 3) {
    const ribs = G.ribsOf(F, s, Math.min(s + 3, to), PR.screwR, 9, P, { twist: 0.7, least: 0.2 });
    if (typeof ribs !== "string") throw new Error("Unfaded ribs come as one path.");
    threads += ribs;
  }
  return (
    `<clipPath id="${NAME}-${id}"><path data-hold d="${rod.clip}"/></clipPath>` +
    `<g clip-path="url(#${NAME}-${id})">${S(rod.paths, { tone: "hi", crease: "none", inner: L(threads, { tone: "faint" }) })}</g>`
  );
}

function crosshead() {
  const out = [];
  const plan = { x: PR.x - 12, y: -30, w: 24, d: 60, r: 5 };
  const seam = k.sideSeam(plan, PR.crossheadBottom + 7, P, 5);
  out.push(
    S(k.slabOf(plan, PR.crossheadBottom, PR.crossheadTop - PR.crossheadBottom, P, 5, 1), {
      tone: "mid",
      inner: L(seam, { tone: "faint" }),
    }),
  );
  out.push(
    D(
      [-PR.columnY, PR.columnY].map((y) => at([PR.x, y, PR.crossheadTop])),
      { size: 0.7 },
    ),
  );
  out.push(
    L([-PR.columnY, PR.columnY].map((y) => k.ring(PR.x, y, 3, PR.crossheadTop, P, 18)).join(""), {
      tone: "lo",
    }),
  );
  out.push(
    S(k.cylinder(PR.x, 0, 8, PR.crossheadTop, PR.nutTop - PR.crossheadTop, P, 40, 0.5), {
      tone: "mid",
      inner: L(k.knurl(PR.x, 0, 8, PR.crossheadTop + 1, PR.nutTop - 1, 30, P), { tone: "faint" }),
    }),
  );
  return out.join("");
}

/** The fly bar's hub, which the screw carries; the bar and its balls are drawn live. */
function hub() {
  const z = PR.barZ;
  return (
    S(k.cylinder(PR.x, 0, 5.4, z - 4, 8, P, 32, 0.5), { tone: "mid" }) +
    L(k.ring(PR.x, 0, 2, z + 4, P, 16), { tone: "lo" })
  );
}

const ballAtOrigin = S(G.sphereOf([0, 0, 0], PR.ballR, P), { tone: "hi" });
const knobAtOrigin = S(G.sphereOf([0, 0, 0], BA.knobR, P), { tone: "hi" });

function pan(sign) {
  const x = BA.x + sign * BA.half;
  const F = up(x, 0, BA.panZ);
  const out = [];
  out.push(
    S(
      G.solidOf(
        [
          [0, BA.panR - 2.4],
          [0.8, BA.panR - 1, 1],
          [2.6, BA.panR],
        ],
        F,
        P,
      ),
      { tone: "hi" },
    ),
  );
  out.push(`<path class="iso-paper" d="${G.circleOf(F, 2.6, BA.panR - 0.7, P)}"/>`);
  out.push(L(G.circleOf(F, 2.6, BA.panR - 0.7, P), { tone: "lo" }));
  out.push(L(G.circleOf(F, 0.6, BA.panR - 3.4, P), { tone: "faint" }));
  return out.join("");
}

/** The standard weight on the right pan: the specification, its seal struck on top. */
function weight() {
  const F = up(BA.x + BA.half, 0, BA.panZ + 0.6);
  const body = [
    [0, 4.8],
    [5.6, 4.8],
    [6.4, 4, 1],
    [6.8, 2.2],
    [8.4, 2.2],
    [9.2, 3],
    [10.6, 3, 1],
    [11.4, 2],
  ];
  return (
    S(G.solidOf(body, F, P), { tone: "hi", inner: L(G.arcOf(F, 2.8, 4.8, P), { tone: "faint" }) }) +
    L(G.circleOf(F, 11.4, 1.2, P), { tone: "mid" })
  );
}

function balanceStand() {
  const out = [shadow(k.cylinder(BA.x + 3, -1, 15, 0, 0.01, P, 40).fill)];
  out.push(S(k.cylinder(BA.x, 0, 14, 0, 4, P, 56, 0.6), { tone: "mid" }));
  out.push(
    D(
      [0.6, 2.2, 3.8].map((angle) => at([BA.x + Math.cos(angle) * 11, Math.sin(angle) * 11, 4])),
      { size: 0.5 },
    ),
  );
  out.push(S(k.cylinder(BA.x, 0, 9, 4, 4, P, 48, 0.5), { tone: "mid" }));
  out.push(
    S(k.cylinder(BA.x, 0, 3.4, 8, BA.pivotZ - 14, P, 28), {
      tone: "mid",
      crease: "none",
      inner: L([24, 44].map((z) => k.sideArc(BA.x, 0, 3.4, z, P, 16)).join(""), { tone: "faint" }),
    }),
  );
  // The fork that holds the pivot, behind the beam.
  out.push(
    S(k.slabOf({ x: BA.x - 4, y: -5, w: 8, d: 2, r: 0.6 }, BA.pivotZ - 6, 9, P, 2), {
      tone: "mid",
    }),
  );
  out.push(
    S(k.slabOf({ x: BA.x - 4, y: -5, w: 8, d: 10, r: 1 }, BA.pivotZ - 8, 2, P, 2, 0.3), {
      tone: "mid",
    }),
  );
  // The scale behind the needle: a sector plate, its ticks hanging from its upper edge.
  const plateY = -3.6;
  const r0 = BA.needle - 1;
  const r1 = BA.needle + 4;
  const sector = (r, from, to) =>
    Array.from({ length: 13 }, (_, index) => {
      const angle = from + ((to - from) * index) / 12;
      return [BA.x + Math.sin(angle) * r, plateY, BA.pivotZ + Math.cos(angle) * r];
    });
  const span = 0.36;
  const outline = [...sector(r0, -span, span), ...sector(r1, span, -span)];
  const plateF = G.frameOf([0, plateY, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const polygon = outline.map(([x, , z]) => [x, z]);
  out.push(S(G.prismOf(plateF, polygon, -0.8, 0, P), { tone: "mid" }));
  const ticks = [];
  for (let step = -9; step <= 9; step++) {
    const angle = (step * span) / 9.5;
    const long = step % 3 === 0 ? 3 : 1.6;
    ticks.push({
      step,
      d: k.segment(
        [BA.x + Math.sin(angle) * r1, plateY, BA.pivotZ + Math.cos(angle) * r1],
        [BA.x + Math.sin(angle) * (r1 - long), plateY, BA.pivotZ + Math.cos(angle) * (r1 - long)],
        P,
      ),
    });
  }
  out.push(
    L(
      ticks
        .filter((tick) => tick.step % 3 !== 0)
        .map((tick) => tick.d)
        .join(""),
      { tone: "faint" },
    ),
  );
  out.push(
    L(
      ticks
        .filter((tick) => tick.step % 3 === 0 && tick.step !== 0)
        .map((tick) => tick.d)
        .join(""),
      { tone: "lo" },
    ),
  );
  out.push(
    L(
      ticks
        .filter((tick) => tick.step === 0)
        .map((tick) => tick.d)
        .join(""),
      { tone: "hi" },
    ),
  );
  return out.join("");
}

function pivot() {
  const F = G.frameOf([BA.x, -2.6, BA.pivotZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  return (
    S(G.disc(0, 5.2, 3.2, F, P), { tone: "mid" }) + L(G.circleOf(F, 5.2, 1.2, P), { tone: "lo" })
  );
}

function strongbox() {
  const out = [shadowOf(BOX, 0, 4)];
  const seam = k.sideSeam(BOX, 6, P, 2);
  out.push(
    S(k.slabOf(BOX, 0, BOX_H, P, 2, 0.6), { tone: "mid", inner: L(seam, { tone: "faint" }) }),
  );
  const lid = k.insetPlan(BOX, -0.8);
  out.push(S(k.slabOf(lid, BOX_H, LID_H, P, 2, 0.8), { tone: "mid" }));
  // Straps over the lid, the coin slot, and the hasp with its lock.
  for (const x of [BOX.x + 8, BOX.x + BOX.w - 8]) {
    out.push(
      S(
        k.slabOf(
          { x: x - 2, y: lid.y - 0.3, w: 4, d: lid.d + 0.6, r: 0.4 },
          BOX_H + LID_H,
          0.5,
          P,
          2,
        ),
        { tone: "lo", crease: "none" },
      ),
    );
    out.push(
      D(
        [at([x, lid.y + 2, BOX_H + LID_H + 0.5]), at([x, lid.y + lid.d - 2, BOX_H + LID_H + 0.5])],
        { size: 0.45 },
      ),
    );
  }
  // The mouth the coin drops through, a round hole as wide as the clip that hides it (`M.holes`).
  const mouth = k.ring(M.slot[0], M.slot[1], M.holes.box.r, BOX_H + LID_H, P, 40);
  out.push(`<path fill="url(#${NAME}-h0)" d="${mouth}"/>`);
  out.push(L(mouth, { tone: "mid" }));
  // The tally on the front face: four wheels behind a window, the audit trail.
  const face = BOX.y + BOX.d;
  const window = [BOX.x + 10, face, 7];
  const corners = [
    [window[0], face, window[2]],
    [window[0] + 24, face, window[2]],
    [window[0] + 24, face, window[2] + 7],
    [window[0], face, window[2] + 7],
  ];
  out.push(`<path class="iso-paper" d="${k.pathOf(corners.map(at), true)}"/>`);
  out.push(L(k.pathOf(corners.map(at), true), { tone: "mid" }));
  out.push(
    L(
      [6, 12, 18]
        .map((dx) =>
          k.segment([window[0] + dx, face, window[2]], [window[0] + dx, face, window[2] + 7], P),
        )
        .join(""),
      { tone: "faint" },
    ),
  );
  out.push(`<g data-part="tally">${tallyDigits(M.tallyOf(moment, 0))}</g>`);
  // The hasp, on the front edge of the lid.
  out.push(
    S(k.slabOf({ x: BOX.x + BOX.w - 9, y: face - 0.2, w: 5, d: 1, r: 0.3 }, BOX_H - 6, 10, P, 2), {
      tone: "mid",
    }),
  );
  out.push(D([at([BOX.x + BOX.w - 6.5, face + 0.8, BOX_H + 2])], { size: 0.6 }));
  return out.join("");
}

function tallyDigits(text) {
  const face = BOX.y + BOX.d;
  return [...text]
    .map((digit, index) =>
      k.faceTextSvg(k.sideMatrix([BOX.x + 13 + index * 6, face], 8.6, P, "right"), digit, {
        size: 5.2,
        tone: "hi",
        anchor: "middle",
      }),
    )
    .join("");
}

const coinAtOrigin =
  S(k.cylinder(0, 0, M.coin.r, 0, M.coin.h, P, 40, 0.4), { tone: "hi", lit: true }) +
  L(k.ring(0, 0, M.coin.r - 1.4, M.coin.h, P, 32), { tone: "lo" });

const { moment } = E;
const live = M.liveParts(M.pose(moment), P);
const restPose = M.pose(moment);
const lift = (dz) => transform(offsetOf([0, 0, dz], P));
const panLeft = M.panShift(restPose.tilt);
/** The coin in one slot of the drawing order; at a hole, clipped to what stands above its face. */
const coinSlot = (layer) => {
  const shown = restPose.coin !== null && restPose.layer === layer;
  const offset = restPose.coin === null ? [0, 0] : offsetOf(restPose.coin, P);
  const hole = M.holes[layer];
  if (hole === undefined)
    return `<g data-part="coin-${layer}" transform="${transform(offset)}"${shown ? "" : ' display="none"'}>${coinAtOrigin}</g>`;
  const [x, y, z] = hole.centre;
  // The clip stays at the hole while the group moves: `mint.ts` moves it back by the same offset.
  const clip = G.rodOut(up(x, y, z), 0, 30, hole.r, P).clip;
  const back = transform([-offset[0], -offset[1]]);
  return (
    `<g data-part="coin-${layer}" transform="${transform(offset)}"${shown ? "" : ' display="none"'}>` +
    `<clipPath id="${NAME}-hole-${layer}"><path data-hold transform="${back}" d="${clip}"/></clipPath>` +
    `<g clip-path="url(#${NAME}-hole-${layer})">${coinAtOrigin}</g></g>`
  );
};

const pressPart = (x) => `<g data-part="press" transform="${lift(-restPose.ramDrop)}">${x}</g>`;
const parts = [
  bench(),
  crucible(),
  trough(M.reject.from, M.reject.to, [[12, 0]]),
  coinSlot("back"),
  coinSlot("crucible"),
  plinth(),
  column(-PR.columnY),
  anvil(),
  coinSlot("rise"),
  coinSlot("die"),
  pressPart(ram()),
  pressPart(
    screwRod(
      "screw-low",
      G.frameOf([PR.x, 0, PR.crossheadBottom], [0, 0, -1], [1, 0, 0], [0, -1, 0]),
      0,
      PR.crossheadBottom - PR.ramRest - 19,
      PR.ramDrop,
    ),
  ),
  column(PR.columnY),
  crosshead(),
  pressPart(screwRod("screw-high", up(PR.x, 0, PR.nutTop), 0, PR.barZ - 4 - PR.nutTop, PR.ramDrop)),
  `<path data-part="bar" class="iso-fill" d="${live.bar.body}"/>`,
  `<path data-part="bar-shade" fill="url(#${NAME}-h1)" d="${live.bar.shade}"/>`,
  `<path data-part="bar-edges" class="iso-line" data-tone="hi" d="${live.bar.edges}"/>`,
  pressPart(hub()),
  `<g data-part="ball-a" transform="${transform(live.ballA)}">${ballAtOrigin}</g>`,
  `<g data-part="ball-b" transform="${transform(live.ballB)}">${ballAtOrigin}</g>`,
  trough(M.chute.from, M.chute.to, [
    [6, PR.plinthTop],
    [34, 0],
  ]),
  balanceStand(),
  `<g data-part="pan-left" transform="${transform(offsetOf(panLeft, P))}">${pan(-1)}</g>`,
  `<g data-part="pan-right" transform="${transform(offsetOf([-panLeft[0], 0, -panLeft[2]], P))}">${pan(1)}${weight()}</g>`,
  `<path data-part="chains" class="iso-line" data-tone="lo" d="${live.chains}"/>`,
  `<path data-part="beam" class="iso-fill" d="${live.beam.body}"/>`,
  `<path data-part="beam-shade" fill="url(#${NAME}-h1)" d="${live.beam.shade}"/>`,
  `<path data-part="beam-edges" class="iso-line" data-tone="hi" d="${live.beam.edges}"/>`,
  `<g data-part="knob-left" transform="${transform(live.knobLeft)}">${knobAtOrigin}</g>`,
  `<g data-part="knob-right" transform="${transform(live.knobRight)}">${knobAtOrigin}</g>`,
  `<path data-part="needle" class="iso-line" data-tone="hi" data-free="end" d="${live.needle}"/>`,
  pivot(),
  strongbox(),
  trough(M.accept.from, M.accept.to, [[10, 0]]),
  coinSlot("free"),
  coinSlot("box"),
];
E.write(parts, moment);
