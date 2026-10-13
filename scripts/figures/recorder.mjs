// Draws the Trading Platform's figure, a bank of strip-chart recorders (see
// `src/figures/recorder-model.ts`), and writes it to `src/figures/recorder.svg`.
// Run: node scripts/figures/recorder.mjs [--preview] (see `engrave.mjs`).
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/recorder-model.ts";
import { translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "recorder";
const { bed: B, paper: PA, arm: AR, damper: DA, rolls: RO, clockwork: CW, governor: GO } = M;
const { drum: DR, shaft: SH } = M;

const BENCH = { x: -164, y: -106, w: 318, d: 234, r: 6 };
const BENCH_H = 10;
const FOOT_H = 7;
const PAPER_Z = B.top + PA.thick;
/** The bridge over the paper that carries the pen hub. */
const BRIDGE = { d: 6, bottom: B.top + 12, top: B.top + 15 };
/** The guide roller resting on the blank paper. */
const GUIDE = { r: 2.4, y: -66 };
/** The pillow blocks along the common shaft, between the recorders. */
const BLOCKS = [-128, -68.5, 17.5];

const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  pad: 14,
  points: [
    ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
    [GO.x, GO.y, GO.hinge + 7],
    [GO.x, GO.y + GO.reach + GO.ballR, GO.ballZ],
  ],
});
const { P, at, S, L, D, byDepth, shadow, shadowOf } = E;

/** A frame along +x through a point: rolls, the shaft, the dashpot, the drum. */
const alongX = (x, y, z) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const flatLine = (from, to) => k.pathOf([from, to].map(at));

function bench() {
  const out = [shadow(k.slabOf(k.insetPlan(BENCH, -2), -BENCH_H - FOOT_H, 0.01, P).fill)];
  for (const [x, y] of byDepth(k.corners(BENCH, 18)))
    out.push(S(k.cylinder(x, y, 7, -BENCH_H - FOOT_H, FOOT_H, P, 12, 0.4), { tone: "mid" }));
  out.push(
    S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 6, 1.4), {
      tone: "hi",
      inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P, 6), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P, 6), { tone: "faint" }));
  const screws = k.corners(BENCH, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "faint" }));
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, 0])),
      { size: 0.5 },
    ),
  );
  // A ruler strip along the front edge, its ticks hanging from the strip's back edge.
  const strip = { x: -146, y: BENCH.y + BENCH.d - 12, w: 184, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 2), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 1.5, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.5, strip.y + 3, 0.6])], {
      size: 0.4,
    }),
  );
  // The maker's plate, on the right beside the side shaft.
  const plate = { x: 122, y: 44, w: 26, d: 14, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(
    L(
      [
        [plate.y + 4.5, 26],
        [plate.y + 7, 18],
        [plate.y + 9.5, 22],
      ]
        .map(([y, length]) => k.lineOnTop([plate.x + 5, y], [plate.x + 5 + length, y], 0.8, P))
        .join(""),
      { tone: "lo", free: true },
    ),
  );
  out.push(
    D([at([plate.x + 2.6, plate.y + 7, 0.8]), at([plate.x + plate.w - 2.6, plate.y + 7, 0.8])], {
      size: 0.4,
    }),
  );
  return out.join("");
}

const caseOf = (lane) => ({ x: lane.x - 49, y: -92, w: 75, d: 184, r: 3 });
const tableOf = (lane) => ({ x: lane.x - B.half, y: -75, w: 2 * B.half, d: 151, r: 1.2 });

/** An upright plate against the table's side, from the case top: cheeks, brackets, standards. */
function upright(lane, side, y, half, top, width = 1.5) {
  const x = side < 0 ? lane.x - B.half - width : lane.x + B.half;
  const plan = { x, y: y - half, w: width, d: 2 * half, r: 0 };
  return S(k.slabOf(plan, B.caseTop, top - B.caseTop, P, 1), { tone: "mid" });
}

/** A paper roll between its cheeks, its top level with the table so the paper runs straight off it. */
function rollOf(lane, name) {
  const { y, r } = RO[name];
  const F = alongX(lane.x - B.half, y, B.top - r);
  return S(G.disc(0, 2 * B.half, r, F, P, { steps: 12 }), {
    tone: "hi",
    inner: L([-PA.half, PA.half].map((s) => G.arcOf(F, B.half + s, r, P)).join(""), {
      tone: "faint",
    }),
  });
}

/** The hub cap on a roll's spindle, outside the front cheek; its spokes are drawn live. */
function capOf(lane, name, spokes) {
  const c = M.capOf(lane, name);
  const F = alongX(c[0] - 2, c[1], c[2]);
  return (
    S(G.disc(0, 2, 3.2, F, P, { steps: 10 }), { tone: "mid" }) +
    L(G.circleOf(F, 2, 1.1, P), { tone: "lo" }) +
    `<path data-part="${name}-spokes-${M.lanes.indexOf(lane)}" class="iso-line" data-tone="lo" d="${spokes}"/>`
  );
}

/** The dashpot, its gland end toward the trend arm, and the knob that sets its damping. */
function dashpot(lane) {
  const y = DA.y;
  const z = AR.trendZ;
  const F = alongX(lane.x + DA.from, y, z);
  const span = DA.gland - DA.from;
  const profile = [
    [0, DA.r],
    [span - 1.4, DA.r],
    [span - 1.4, DA.r + 0.5],
    [span, DA.r + 0.5],
  ];
  const out = [];
  const seams = [11, 15].map((s) => G.arcOf(F, s, DA.r, P)).join("");
  out.push(
    S(G.solidOf(profile, F, P, { steps: 12 }), { tone: "hi", inner: L(seams, { tone: "faint" }) }),
  );
  // The needle valve on top: the dial plate with its scale, and the knurled knob on a skirt.
  const kx = lane.x + DA.from + 5.5;
  const plate = z + DA.r + 0.6;
  const start = -0.75 * Math.PI;
  const sweep = 1.5 * Math.PI;
  out.push(S(k.cylinder(kx, y, 5.4, plate - 1.6, 1.6, P, 16, 0.3), { tone: "mid" }));
  const ticks = k.radialTicks(kx, y, 5.2, 16, 4, plate, [0.9, 1.7], P, start, sweep);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(
    S(k.cylinder(kx, y, 2.4, plate, 2.6, P, 12), {
      tone: "mid",
      inner: L(k.knurl(kx, y, 2.4, plate + 0.4, plate + 2.2, 18, P), { tone: "faint" }),
    }),
  );
  // The knob's pointer blade: this stock's time constant, on a scale from fast to slow.
  const share = Math.log(lane.tau / 1.5) / Math.log(20 / 1.5);
  const angle = start + share * sweep;
  const along = [Math.sin(angle), -Math.cos(angle), 0];
  const blade = G.frameOf([kx, y, plate + 2.6], [0, 0, 1], along, [-along[1], along[0], 0]);
  const outline = [
    [-1.4, -0.7],
    [4, -0.45],
    [4.6, 0],
    [4, 0.45],
    [-1.4, 0.7],
  ];
  out.push(S(G.prismOf(blade, outline, 0, 0.9, P), { tone: "hi" }));
  out.push(D([at([kx, y, plate + 3.5])], { size: 0.5 }));
  return out.join("");
}

/** The two saddles the dashpot lies in, standing on the shelf. */
function saddles(lane) {
  const top = AR.trendZ - DA.r + 0.9;
  return [DA.from + 2, DA.gland - 5]
    .map((x) => {
      const plan = { x: lane.x + x, y: DA.y - 3.2, w: 2.6, d: 6.4, r: 0 };
      return S(k.slabOf(plan, B.caseTop, top - B.caseTop, P, 1), { tone: "mid" });
    })
    .join("");
}

/** A pen: a reservoir on the arm's tip, standing on the paper; built at the world origin. */
const penAt = (height, r, lit) =>
  S(k.cylinder(0, 0, r, 0, height, P, 8), { tone: "hi", ...(lit ? { lit: true } : {}) });
const trendPen = penAt(AR.trendZ + 1.4 - PAPER_Z, 1.4, false);
const pricePen = penAt(AR.priceZ + 1.6 - PAPER_Z, 1.6, false);
const litPricePen = penAt(AR.priceZ + 1.6 - PAPER_Z, 1.6, true);
const pinAtOrigin = S(k.cylinder(0, 0, 1.1, -1.2, 2.6, P, 8), { tone: "mid" });

/**
 * The chart's printed arcs, the pens' arc at every `gap`. They travel with the paper but repeat
 * every gap, so they only need to cover the sheet and one gap more.
 */
function ruling(lane) {
  const { gap } = M.ruling;
  let d = "";
  const tip = AR.hubY + AR.price;
  for (let j = Math.ceil((tip - PA.to) / gap); j <= Math.floor((tip - PA.from + gap) / gap); j++) {
    const points = [];
    for (let index = 0; index <= 8; index++) {
      const x = -PA.half + (2 * PA.half * index) / 8;
      points.push([lane.x + x, AR.hubY + Math.sqrt(AR.price ** 2 - x * x) - j * gap, PAPER_Z]);
    }
    d += k.pathOf(points.map(at));
  }
  // Its arcs run edge to edge of the sheet; one beyond the feed end waits under the clip, where
  // the line check, which does not see clips, would take its ends for loose ones.
  return L(d, { tone: "faint", free: true });
}

const rodParts = (name, paths, tone = "hi") =>
  `<path data-part="${name}" class="iso-fill" d="${paths.body}"/>` +
  `<path data-part="${name}-shade" fill="url(#${NAME}-h1)" d="${paths.shade}"/>` +
  `<path data-part="${name}-edges" class="iso-line" data-tone="${tone}" d="${paths.edges}"/>`;

function recorder(lane, index, live) {
  const out = [];
  const plan = caseOf(lane);
  const table = tableOf(lane);
  const parts = live.recorders[index];
  out.push(shadowOf(plan, 0, 3));
  out.push(
    S(k.slabOf(plan, 0, B.caseTop, P, 1, 0.6), {
      tone: "mid",
      inner: L(k.sideSeam(plan, 4, P, 1), { tone: "faint" }),
    }),
  );
  // The shelf behind the table: a groove and its screws.
  const shelf = { x: plan.x + 3, y: plan.y + 3, w: 20, d: plan.d - 6, r: 1.5 };
  out.push(L(k.planOutline(shelf, B.caseTop, P, 3), { tone: "faint" }));
  out.push(
    D(
      [plan.y + 1.6, plan.y + plan.d - 1.6].map((y) => at([plan.x + 1.6, y, B.caseTop])),
      { size: 0.45 },
    ),
  );
  // Back cheeks, the bracket, the bridge's back standard and the dashpot's saddles, far to near.
  const cheek = (side, name) => upright(lane, side, RO[name].y, RO[name].r + 2, B.top - 0.6);
  const bracketTop = PAPER_Z + GUIDE.r + 2.6;
  out.push(cheek(-1, "feed"));
  out.push(upright(lane, -1, GUIDE.y, 2.4, bracketTop));
  out.push(upright(lane, -1, AR.hubY, BRIDGE.d / 2, BRIDGE.bottom, 3));
  out.push(saddles(lane));
  out.push(cheek(-1, "take"));
  // The feed roll, under the paper coming in.
  out.push(rollOf(lane, "feed"));
  out.push(cheek(1, "feed"));
  out.push(capOf(lane, "feed", parts.feedSpokes));
  // The writing table and the paper on it, its ruling, and the two traces.
  out.push(
    S(k.slabOf(table, B.caseTop, B.top - B.caseTop, P, 1, 0.6), {
      tone: "mid",
      inner: L(k.sideSeam(table, B.caseTop + 3, P, 1), { tone: "faint" }),
    }),
  );
  const sheet = { x: lane.x - PA.half, y: PA.from, w: 2 * PA.half, d: PA.to - PA.from, r: 0 };
  // The sheet on the table: paper, edged by its outline.
  const edge = k.planOutline(sheet, PAPER_Z, P, 1);
  out.push(`<path class="iso-fill" d="${edge}"/>`, L(edge, { tone: "lo" }));
  const rules = [-2, -1, 1, 2].map((step) => lane.x + (step * AR.swing) / 2);
  out.push(
    L(rules.map((x) => flatLine([x, PA.from, PAPER_Z], [x, PA.to, PAPER_Z])).join(""), {
      tone: "faint",
    }),
  );
  out.push(L(flatLine([lane.x, PA.from, PAPER_Z], [lane.x, PA.to, PAPER_Z]), { tone: "lo" }));
  const id = (what) => `${NAME}-${what}-${index}`;
  const moving = (clip, part, offset, body) =>
    `<g clip-path="url(#${id(clip)})"><g data-part="${part}-${index}" transform="${transform(offset)}">${body}</g></g>`;
  // A trace starts a sheet's length back, beyond the take-up roll, where the clip always hides it.
  const trace = (pen, tone) => L(M.traceOf(index, pen, P), { tone, free: "start" });
  out.push(
    `<clipPath id="${id("sheet")}"><path d="${k.onTop(k.ringOf(sheet, 1), PAPER_Z, P, true)}"/></clipPath>`,
    `<clipPath id="${id("trend")}"><path d="${M.writtenOf(lane, "trend", P)}"/></clipPath>`,
    `<clipPath id="${id("price")}"><path d="${M.writtenOf(lane, "price", P)}"/></clipPath>`,
    moving("sheet", "ruling", parts.ruling, ruling(lane)),
    moving("trend", "paper", parts.paper, trace("trend", "hi")),
    moving("price", "paper", parts.paper, trace("price", "mid")),
  );
  // The guide roller on the blank paper, and the take-up roll.
  const guide = alongX(lane.x - B.half + 0.4, GUIDE.y, PAPER_Z + GUIDE.r);
  out.push(S(G.disc(0, 2 * B.half - 0.8, GUIDE.r, guide, P, { steps: 10 }), { tone: "hi" }));
  out.push(upright(lane, 1, GUIDE.y, 2.4, bracketTop));
  out.push(D([at([lane.x + B.half + 1.5, GUIDE.y, PAPER_Z + GUIDE.r])], { size: 0.5 }));
  out.push(rollOf(lane, "take"));
  out.push(cheek(1, "take"));
  out.push(capOf(lane, "take", parts.takeSpokes));
  // The dashpot's rod to the pin on the trend arm, its end hidden in the dashpot drawn over it.
  out.push(rodParts(`rod-${index}`, parts.rod));
  out.push(dashpot(lane));
  // The hub's spindle hangs from the bridge; the arms swing on collars round it.
  const spindleFrom = AR.trendZ - 2.6;
  out.push(
    S(k.cylinder(lane.x, AR.hubY, 0.9, spindleFrom, BRIDGE.bottom - spindleFrom, P, 10), {
      tone: "mid",
      crease: "none",
    }),
  );
  out.push(rodParts(`trend-arm-${index}`, parts.trendArm));
  out.push(S(k.cylinder(lane.x, AR.hubY, 2.2, AR.trendZ - 1.2, 2.4, P, 12), { tone: "mid" }));
  out.push(`<g data-part="pin-${index}" transform="${transform(parts.pin)}">${pinAtOrigin}</g>`);
  out.push(
    `<g data-part="trend-pen-${index}" transform="${transform(parts.trendPen)}">${trendPen}</g>`,
  );
  out.push(rodParts(`price-arm-${index}`, parts.priceArm));
  out.push(S(k.cylinder(lane.x, AR.hubY, 2.2, AR.priceZ - 1.2, 2.4, P, 12), { tone: "mid" }));
  const pen = index === M.lanes.length - 1 ? litPricePen : pricePen;
  out.push(`<g data-part="price-pen-${index}" transform="${transform(parts.pricePen)}">${pen}</g>`);
  // The bridge: its crossbar, then the front standard.
  const bar = {
    x: lane.x - B.half - 3,
    y: AR.hubY - BRIDGE.d / 2,
    w: 2 * B.half + 6,
    d: BRIDGE.d,
    r: 0.8,
  };
  out.push(S(k.slabOf(bar, BRIDGE.bottom, BRIDGE.top - BRIDGE.bottom, P, 1, 0.4), { tone: "mid" }));
  out.push(L(k.ring(lane.x, AR.hubY, 1.6, BRIDGE.top, P, 14), { tone: "lo" }));
  out.push(D([at([lane.x, AR.hubY, BRIDGE.top])], { size: 0.6 }));
  out.push(upright(lane, 1, AR.hubY, BRIDGE.d / 2, BRIDGE.bottom, 3));
  return out.join("");
}

/** A bevel gear: teeth on a cone facing the meshing point, a hub behind. */
function bevel(F, hub) {
  const profile = [
    [2.2, 2.4],
    [4.8, 5],
    [6, 5],
    [6, 2.2],
    [hub, 2.2],
  ];
  return S(G.solidOf(profile, F, P, { steps: 8 }), {
    tone: "hi",
    inner: L(G.ribsOf(F, 2.2, 4.8, 2.4, 14, P, { r1: 5 }), { tone: "faint" }),
  });
}

/** A pillow block carrying a shaft that runs along `axis` ("x" or "y") through `[x, y]`. */
function block(x, y, axis) {
  const along = axis === "x";
  const plan = along
    ? { x: x - 4, y: y - 6, w: 8, d: 12, r: 1 }
    : { x: x - 6, y: y - 4, w: 12, d: 8, r: 1 };
  const foot = SH.z - 3.6;
  const screws = along
    ? [
        [x, plan.y + 1.6],
        [x, plan.y + plan.d - 1.6],
      ]
    : [
        [plan.x + 1.6, y],
        [plan.x + plan.w - 1.6, y],
      ];
  const F = along
    ? alongX(x - 2.6, y, SH.z)
    : G.frameOf([x, y - 2.6, SH.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  return (
    S(k.slabOf(plan, 0, foot, P, 1, 0.3), { tone: "mid" }) +
    D(
      screws.map(([sx, sy]) => at([sx, sy, foot])),
      { size: 0.45 },
    ) +
    S(G.disc(0, 5.2, 3.6, F, P, { steps: 10 }), {
      tone: "mid",
      inner: L(G.arcOf(F, 2.6, 3.6, P), { tone: "faint" }),
    })
  );
}
/** Bevel frames meeting at a point: one on a shaft along y (gear behind it), one along x. */
const towardFront = (point) => G.frameOf(point, [0, -1, 0], [1, 0, 0], [0, 0, 1]);
const towardSide = (point) => G.frameOf(point, [-1, 0, 0], [0, 1, 0], [0, 0, 1]);

function drive() {
  const out = [];
  // Each recorder's stub shaft leaves its case and meets the common shaft in a pair of bevels.
  const corner = [SH.side, SH.y, SH.z];
  for (const lane of M.lanes) {
    const face = caseOf(lane).y + caseOf(lane).d;
    out.push(bevel(towardFront([lane.x, SH.y, SH.z]), SH.y - face));
  }
  const from = (BLOCKS[0] ?? 0) - 3;
  out.push(
    S(G.disc(0, SH.side - 2.2 - from, SH.r, alongX(from, SH.y, SH.z), P, { steps: 10 }), {
      tone: "hi",
      crease: "none",
    }),
  );
  for (const lane of M.lanes) out.push(bevel(towardSide([lane.x, SH.y, SH.z]), 8));
  for (const x of BLOCKS) out.push(block(x, SH.y, "x"));
  out.push(bevel(towardSide(corner), 8));
  return out.join("");
}

/** The side shaft from the clockwork's front face, its block, and its bevel at the corner. */
function sideShaft() {
  const start = CW.y + CW.d;
  const F = G.frameOf([SH.side, start, SH.z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  return (
    S(G.disc(0, SH.y - 2.2 - start, SH.r, F, P, { steps: 10 }), { tone: "hi", crease: "none" }) +
    block(SH.side, 22, "y") +
    bevel(towardFront([SH.side, SH.y, SH.z]), 8)
  );
}

const ballAtOrigin = S(G.sphereOf([0, 0, 0], GO.ballR, P, { steps: 28 }), { tone: "hi" });
/** A governor slot's link and arm (live), and its ball, moved live. */
const flyArms = (name, part) =>
  `<g>${rodParts(`${name}-link`, part.link, "mid")}${rodParts(`${name}-arm`, part.arm)}</g>`;
const flyBall = (name, part) =>
  `<g data-part="${name}-ball" transform="${transform(part.ball)}">${ballAtOrigin}</g>`;

function clockwork(live) {
  const plan = { x: CW.x, y: CW.y, w: CW.w, d: CW.d, r: 3 };
  const out = [shadowOf(plan, 0, 4)];
  const body = CW.h - 3;
  out.push(
    S(k.slabOf(plan, 0, body, P, 3, 0.6), {
      tone: "mid",
      inner: L(k.sideSeam(plan, 6, P, 3), { tone: "faint" }),
    }),
  );
  const lid = k.insetPlan(plan, -0.8);
  out.push(S(k.slabOf(lid, body, 3, P, 3, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(lid, 4), CW.h, P, 3), { tone: "faint" }));
  out.push(
    D(
      k.corners(lid, 2.4).map(([x, y]) => at([x, y, CW.h])),
      { size: 0.5 },
    ),
  );
  // The governor: its column on the lid, the balls and arms (live, nearer last), the collars.
  out.push(S(k.cylinder(GO.x, GO.y, 3.6, CW.h, 6, P, 16, 0.3), { tone: "mid" }));
  out.push(flyArms("fly-back", live.back), flyBall("fly-back", live.back));
  out.push(
    S(k.cylinder(GO.x, GO.y, 1, CW.h + 6, GO.hinge + 3 - CW.h - 6, P, 10), {
      tone: "mid",
      crease: "none",
    }),
  );
  out.push(flyArms("fly-front", live.front));
  out.push(S(k.cylinder(GO.x, GO.y, 2.4, GO.sleeve, 3, P, 14), { tone: "mid" }));
  out.push(S(k.cylinder(GO.x, GO.y, 1.9, GO.hinge - 1.5, 3, P, 12), { tone: "mid" }));
  out.push(flyBall("fly-front", live.front));
  // The spring drum, toothed round its rim, its notches turning live, and the winding key.
  const top = CW.h + DR.height;
  out.push(
    S(k.cylinder(DR.x, DR.y, DR.r, CW.h, DR.height, P, 22, 0.4), {
      tone: "hi",
      inner: L(k.knurl(DR.x, DR.y, DR.r, CW.h + 0.6, top - 0.6, 44, P), { tone: "faint" }),
    }),
  );
  out.push(L(DR.notches.map((r) => k.ring(DR.x, DR.y, r, top, P, 32)).join(""), { tone: "faint" }));
  out.push(`<path data-part="notches" class="iso-line" data-tone="lo" d="${live.notches}"/>`);
  out.push(S(k.cylinder(DR.x, DR.y, 1.2, top, 5.4, P, 10), { tone: "mid", crease: "none" }));
  const bow = [
    [-1.6, 0],
    [1.6, 0],
    [4.2, 4.6],
    [3, 8.4],
    [-3, 8.4],
    [-4.2, 4.6],
  ];
  const F = G.frameOf([DR.x - 0.7, DR.y, top + 5], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.prismOf(F, bow, 0, 1.4, P), { tone: "hi" }));
  out.push(D([at([DR.x + 0.7, DR.y, top + 10.6])], { size: 0.6 }));
  return out.join("");
}

const { moment } = E;
const live = M.liveParts(M.pose(moment), P);
const parts = [
  bench(),
  ...M.lanes.map((lane, index) => recorder(lane, index, live)),
  drive(),
  clockwork(live),
  sideShaft(),
];
E.write(parts, moment);
