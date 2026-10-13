// Draws the home page's figure, an assayer's balance in its glass case (see
// `src/figures/balance-model.ts`), and writes it to `src/figures/balance.svg`.
// Run: node scripts/figures/balance.mjs [--preview] (see `engrave.mjs`).
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/balance-model.ts";
import { offsetOf, rod, translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "balance";
const { beam: BE, arrest: AR, floorTop: FLOOR_TOP } = M;

const BENCH = { x: -102, y: -62, w: 250, d: 150, r: 6 };
const BENCH_H = 9;
const BENCH_FOOT = 7;
/** The balance's base: a cabinet on levelling feet, two drawers, a moulded cap. */
const FEET_TOP = 7;
const PLINTH = { x: -87, y: -53, w: 174, d: 118, r: 2 };
const PLINTH_TOP = 29;
const CAP = { x: -90, y: -56, w: 180, d: 124, r: 3 };
const CAP_TOP = 33;
/** The case: corner posts, rails at the foot and the top, a transom, and the front sash. */
const POST_X = 78;
const POST_Y = 48;
const POST = 5;
const RAIL_LOW = 39;
// The top and the transom sit where they hide nothing: at this camera a front rail covers the
// inside about 43 units lower, so the top clears the beam and the transom falls between the
// pans and the beam. The sash, raised, rests in front of the fixed upper pane.
const RAIL_HIGH = 216;
const CASE_TOP = 224;
const TRANSOM = [128, 133];
const SASH = { y: POST_Y + POST / 2, d: 2, bottom: 129, top: 223, stile: 4, rail: 5 };
/** The fitted box of weights, on the bench to the right of the base. */
const BOX = { x: 98, y: -8, w: 48, d: 32, r: 2 };
const BOX_H = 11;

const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  points: [
    ...k.boxCorners(BENCH, -BENCH_H - BENCH_FOOT, 0),
    ...k.boxCorners(
      { x: -POST_X - 3, y: -POST_Y - 3, w: 2 * POST_X + 6, d: 2 * POST_Y + 8, r: 0 },
      0,
      SASH.top,
    ),
  ],
});
const { P, at, S, L, D, up, byDepth, shadow, shadowOf } = E;

/** A closed loop through world points, as a line: a pane's edge, a slot, a moulding. */
const loop = (points, style = { tone: "faint" }) => L(k.pathOf(points.map(at), true), style);

/** A rectangle in a vertical plane: `x` fixed (`axis` "x") or `y` fixed, from (a0, z0) to (a1, z1). */
function upright(axis, at0, a0, a1, z0, z1) {
  const point = (a, z) => (axis === "x" ? [at0, a, z] : [a, at0, z]);
  return [point(a0, z0), point(a1, z0), point(a1, z1), point(a0, z1)];
}

/** A convex solid from its faces (each a loop of world points), shaded like the kit's prisms. */
function hullSolid(faces) {
  const V = G.viewOf(P);
  const light = G.lightOf(P);
  const corners = faces.flat();
  const centre = G.mul3(
    corners.reduce((sum, point) => G.add3(sum, point), [0, 0, 0]),
    1 / corners.length,
  );
  const buckets = [[], [], [], [], []];
  const edges = new Map();
  for (const face of faces) {
    let normal = G.unit3(G.cross3(G.sub3(face[1], face[0]), G.sub3(face[2], face[0])));
    if (G.dot3(normal, G.sub3(face[0], centre)) < 0) normal = G.mul3(normal, -1);
    if (G.dot3(normal, V) <= 1e-6) continue;
    buckets[G.bandOf(G.dot3(normal, light))].push(k.pathOf(face.map(at), true));
    for (const [index, point] of face.entries()) {
      const next = face[(index + 1) % face.length];
      const key = [point, next]
        .map((p) => p.map((value) => value.toFixed(3)).join(","))
        .toSorted((a, b) => a.localeCompare(b))
        .join("|");
      edges.set(key, [...(edges.get(key) ?? []), [point, next]]);
    }
  }
  const crease = [...edges.values()]
    .filter((list) => list.length > 1)
    .map(([[a, b]]) => k.segment(a, b, P))
    .join("");
  const hull = k.pathOf(G.hullOf(corners.map(at)), true);
  return {
    fill: hull,
    outline: hull,
    crease,
    top: buckets[4].join(""),
    shades: buckets.slice(0, 4).map((list) => list.join("")),
  };
}

/** A block tapering from `bottom` to `top` (half sizes along x and y), standing at a point. */
function frustum([x, y, z], [bx, by], [tx, ty], h) {
  const ring = (hx, hy, zz) => [
    [x - hx, y - hy, zz],
    [x + hx, y - hy, zz],
    [x + hx, y + hy, zz],
    [x - hx, y + hy, zz],
  ];
  const low = ring(bx, by, z);
  const high = ring(tx, ty, z + h);
  const sides = low.map((point, index) => [
    point,
    low[(index + 1) % 4],
    high[(index + 1) % 4],
    high[index],
  ]);
  return hullSolid([low.toReversed(), high, ...sides]);
}

function bench() {
  const out = [shadow(k.slabOf(k.insetPlan(BENCH, -2), -BENCH_H - BENCH_FOOT, 0.01, P).fill)];
  // The far foot stands wholly behind the top; only the other three show.
  for (const [x, y] of byDepth(k.corners(BENCH, 18)).slice(1)) {
    out.push(S(k.cylinder(x, y, 8, -BENCH_H - BENCH_FOOT, 2, P, 20), { tone: "mid" }));
    out.push(
      S(k.cylinder(x, y, 6, -BENCH_H - BENCH_FOOT + 2, BENCH_FOOT - 2, P, 16), { tone: "mid" }),
    );
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
  const strip = { x: BENCH.x + 14, y: BENCH.y + BENCH.d - 13, w: 112, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3, 5, strip.y, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 1.5, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.5, strip.y + 3, 0.6])], {
      size: 0.4,
    }),
  );
  return out.join("");
}

/** The base: levelling feet, the cabinet with its drawers, and the moulded cap the case stands on. */
function base() {
  const out = [shadowOf(PLINTH, 0, 6)];
  for (const [x, y] of byDepth(k.corners(PLINTH, 11)).slice(1)) {
    out.push(S(k.cylinder(x, y, 6.5, 0, 1.6, P, 20, 0.4), { tone: "mid" }));
    out.push(
      S(k.cylinder(x, y, 2.4, 1.6, 2.4, P, 12), {
        tone: "mid",
        crease: "none",
        inner: L(k.sideArc(x, y, 2.4, 2.8, P, 12), { tone: "faint" }),
      }),
    );
    out.push(
      S(k.cylinder(x, y, 5, 4, FEET_TOP - 4, P, 16), {
        tone: "mid",
        inner: L(k.knurl(x, y, 5, 4.3, FEET_TOP - 0.3, 14, P), { tone: "faint" }),
      }),
    );
  }
  const seam = k.sideSeam(PLINTH, FEET_TOP + 3, P, 3);
  out.push(
    S(k.slabOf(PLINTH, FEET_TOP, PLINTH_TOP - FEET_TOP, P, 3, 0.6), {
      tone: "mid",
      inner: L(seam, { tone: "faint" }),
    }),
  );
  // Two drawers either side of the arrest knob, each with a moulding and a turned pull.
  const face = PLINTH.y + PLINTH.d;
  for (const [x0, x1] of [
    [-80, -15],
    [15, 80],
  ]) {
    const plan = { x: x0, y: face, w: x1 - x0, d: 1.2, r: 0.4 };
    out.push(S(k.slabOf(plan, 12, 13, P, 2, 0.3), { tone: "mid" }));
    out.push(loop(upright("y", face + 1.2, x0 + 2.4, x1 - 2.4, 14.4, 22.6)));
    const F = G.frameOf([(x0 + x1) / 2, face + 1.2, 18.5], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    out.push(S(G.disc(0, 1.2, 0.9, F, P, { smooth: false }), { tone: "mid", crease: "none" }));
    out.push(S(G.sphereOf(G.pointOf(F, 2.4, 0, 0), 1.7, P, { steps: 20 }), { tone: "hi" }));
  }
  // The arrest knob's rosette and knurled knob; its lever is drawn live.
  const F = G.frameOf([AR.knob[0], face, AR.knob[2]], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 1, 6.6, F, P), { tone: "mid" }));
  out.push(
    D(
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle) =>
        at(G.pointOf(F, 1, 5.6, angle + Math.PI / 4)),
      ),
      { size: 0.4 },
    ),
  );
  const depth = AR.knob[1] - face;
  out.push(
    S(G.disc(1, depth, 4.6, F, P), {
      tone: "hi",
      inner: L(G.ribsOf(F, 1, depth, 4.6, 28, P), { tone: "faint" }),
    }),
  );
  out.push(L(G.circleOf(F, depth, 3.2, P), { tone: "faint" }));
  // The moulded cap, its groove round the case, a maker's plate and the spirit level.
  out.push(S(k.slabOf(CAP, PLINTH_TOP, CAP_TOP - PLINTH_TOP, P, 4, 1), { tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(CAP, 3), CAP_TOP, P, 4), { tone: "faint" }));
  const plate = { x: -72, y: 54, w: 32, d: 9, r: 1 };
  out.push(S(k.slabOf(plate, CAP_TOP, 0.8, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), CAP_TOP + 0.8, P), { tone: "faint" }));
  out.push(
    L(
      [
        [plate.y + 3, 22],
        [plate.y + 4.6, 15],
        [plate.y + 6.2, 18],
      ]
        .map(([y, length]) =>
          k.lineOnTop([plate.x + 5, y], [plate.x + 5 + length, y], CAP_TOP + 0.8, P),
        )
        .join(""),
      { tone: "lo", free: true },
    ),
  );
  out.push(
    D(
      [
        at([plate.x + 2.6, plate.y + 4.5, CAP_TOP + 0.8]),
        at([plate.x + plate.w - 2.6, plate.y + 4.5, CAP_TOP + 0.8]),
      ],
      { size: 0.4 },
    ),
  );
  out.push(level(56, 60));
  return out.join("");
}

/** A round spirit level set on the cap, its bubble in the ring: the case stands true. */
function level(x, y) {
  const z = CAP_TOP;
  const out = [S(k.cylinder(x, y, 6.6, z, 1, P, 28, 0.3), { tone: "mid" })];
  out.push(
    D(
      [0.5, 2.6, 4.7].map((angle) =>
        at([x + Math.cos(angle) * 5.8, y + Math.sin(angle) * 5.8, z + 1]),
      ),
      { size: 0.35 },
    ),
  );
  out.push(S(k.cylinder(x, y, 4.8, z + 1, 2.4, P, 24, 0.4), { tone: "hi" }));
  out.push(
    `<path class="iso-paper" d="${k.planOutline({ x: x - 3.6, y: y - 3.6, w: 7.2, d: 7.2, r: 3.6 }, z + 3.4, P, 10)}"/>`,
  );
  out.push(L(k.ring(x, y, 3.6, z + 3.4, P, 36), { tone: "lo" }));
  out.push(L(k.ring(x, y, 1.7, z + 3.4, P, 24), { tone: "faint" }));
  out.push(L(k.ring(x, y, 1.05, z + 3.4, P, 20), { tone: "mid" }));
  return out.join("");
}

const postPlan = (x, y) => ({ x: x - POST / 2, y: y - POST / 2, w: POST, d: POST, r: 0.5 });

function post(x, y) {
  const plan = postPlan(x, y);
  return S(k.slabOf(plan, CAP_TOP, CASE_TOP - CAP_TOP, P, 2, 0.4), { tone: "mid" });
}

/** A rail between two posts, along `axis`, at heights z0 to z1. */
function rail(axis, at0, z0, z1, tone = "mid") {
  const span = (axis === "x" ? POST_X : POST_Y) - POST / 2;
  const plan =
    axis === "x"
      ? { x: -span, y: at0 - 2, w: 2 * span, d: 4, r: 0.4 }
      : { x: at0 - 2, y: -span, w: 4, d: 2 * span, r: 0.4 };
  return S(k.slabOf(plan, z0, z1 - z0, P, 2, 0.4), { tone });
}

/** The edge of a pane between two posts and two rails, on the frame's outer face. */
function pane(axis, face, z0, z1) {
  const span = (axis === "x" ? POST_X : POST_Y) - POST / 2 - 0.8;
  return loop(upright(axis === "x" ? "y" : "x", face, -span, span, z0 + 0.8, z1 - 0.8));
}

/** The far frame of the case: the back and left posts and rails, the panes behind the balance. */
function caseBack() {
  const out = [];
  out.push(pane("x", -POST_Y - 2, RAIL_LOW, RAIL_HIGH));
  out.push(pane("y", -POST_X - 2, RAIL_LOW, RAIL_HIGH));
  out.push(post(-POST_X, -POST_Y));
  out.push(rail("y", -POST_X, CAP_TOP, RAIL_LOW), rail("y", -POST_X, RAIL_HIGH, CASE_TOP));
  out.push(rail("x", -POST_Y, CAP_TOP, RAIL_LOW), rail("x", -POST_Y, RAIL_HIGH, CASE_TOP));
  out.push(post(-POST_X, POST_Y));
  // The floor: a slab of black glass between the rails.
  const floor = { x: -POST_X + 2, y: -POST_Y + 2, w: 2 * POST_X - 4, d: 2 * POST_Y - 4, r: 0.4 };
  out.push(
    `<path fill="url(#${NAME}-h3)" d="${k.planOutline(floor, FLOOR_TOP, P, 2)}"/>`,
    L(k.planOutline(floor, FLOOR_TOP, P, 2), { tone: "lo" }),
  );
  return out.join("");
}

/** The near frame: the right posts, the front rails and transom, the panes in front. */
function caseFront() {
  const out = [];
  out.push(post(POST_X, -POST_Y));
  out.push(rail("x", POST_Y, CAP_TOP, RAIL_LOW), rail("x", POST_Y, RAIL_HIGH, CASE_TOP));
  out.push(rail("x", POST_Y, TRANSOM[0], TRANSOM[1]));
  out.push(rail("y", POST_X, CAP_TOP, RAIL_LOW), rail("y", POST_X, RAIL_HIGH, CASE_TOP));
  out.push(post(POST_X, POST_Y));
  out.push(pane("y", POST_X + 2, RAIL_LOW, RAIL_HIGH));
  out.push(pane("x", POST_Y + 2, TRANSOM[1], RAIL_HIGH));
  // The glass top, lying in a rebate on the top rails, and screws at the corners.
  const top = {
    x: -POST_X + 0.6,
    y: -POST_Y + 0.6,
    w: 2 * POST_X - 1.2,
    d: 2 * POST_Y - 1.2,
    r: 0.3,
  };
  out.push(L(k.planOutline(top, CASE_TOP, P, 2), { tone: "faint" }));
  out.push(
    D(
      k
        .corners({ x: -POST_X, y: -POST_Y, w: 2 * POST_X, d: 2 * POST_Y })
        .map(([x, y]) => at([x, y, CASE_TOP])),
      { size: 0.45 },
    ),
  );
  return out.join("");
}

/** The front sash, raised in its guides: the case stands open to look inside. */
function sash() {
  const { y, d, bottom, top, stile, rail: height } = SASH;
  const x0 = -POST_X - POST / 2;
  const x1 = POST_X + POST / 2;
  const out = [];
  const piece = (plan, z0, z1) => S(k.slabOf(plan, z0, z1 - z0, P, 2, 0.3), { tone: "mid" });
  out.push(piece({ x: x0, y, w: x1 - x0, d, r: 0.3 }, top - height, top));
  out.push(piece({ x: x0 + stile, y, w: x1 - x0 - 2 * stile, d, r: 0.3 }, bottom, bottom + height));
  out.push(piece({ x: x0, y, w: stile, d, r: 0.3 }, bottom, top - height));
  out.push(piece({ x: x1 - stile, y, w: stile, d, r: 0.3 }, bottom, top - height));
  out.push(
    loop(
      upright(
        "y",
        y + d,
        x0 + stile - 0.8,
        x1 - stile + 0.8,
        bottom + height - 0.8,
        top - height + 0.8,
      ),
    ),
  );
  // A brass lift on the bottom rail, and the guides on the posts that hold it up.
  out.push(
    S(k.slabOf({ x: -6, y: y + d, w: 12, d: 1.4, r: 0.6 }, bottom + 0.6, 3.4, P, 3), {
      tone: "hi",
    }),
  );
  for (const x of [x0 + stile / 2, x1 - stile / 2])
    out.push(
      S(k.slabOf({ x: x - 3.2, y: y + d, w: 6.4, d: 1, r: 0.3 }, CASE_TOP - 6, 6, P, 2), {
        tone: "mid",
      }),
      D([at([x, y + d + 1, CASE_TOP - 3])], { size: 0.45 }),
    );
  return out.join("");
}

/** The pillar on its foot, a capital under the beam's centre knife. */
function pillar() {
  const out = [];
  const foot = { x: -9, y: -9, w: 18, d: 18, r: 1.5 };
  out.push(S(k.slabOf(foot, FLOOR_TOP, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(
    D(
      k.corners(foot, 2.4).map(([x, y]) => at([x, y, FLOOR_TOP + 4])),
      { size: 0.45 },
    ),
  );
  out.push(S(k.cylinder(0, 0, 7.2, FLOOR_TOP + 4, 1.6, P, 28, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 5.6, FLOOR_TOP + 5.6, 2.6, P, 24, 0.3), { tone: "mid" }));
  const z0 = FLOOR_TOP + 8.2;
  const z1 = BE.pivotZ - 8;
  out.push(
    S(k.cylinder(0, 0, 4.4, z0, z1 - z0, P, 24), {
      tone: "mid",
      crease: "none",
      inner: L([80, 120].map((z) => k.sideArc(0, 0, 4.4, z, P, 20)).join(""), { tone: "faint" }),
    }),
  );
  // The capital, and the agate plane the centre knife rests on.
  out.push(S(k.cylinder(0, 0, 6, z1, 4, P, 28, 0.4), { tone: "mid" }));
  out.push(
    S(k.slabOf({ x: -3.2, y: -3.2, w: 6.4, d: 6.4, r: 0.4 }, z1 + 4, 2, P, 2), { tone: "hi" }),
  );
  return out.join("");
}

/** The scale under the pointer: an ivory plate on a bracket from the pillar, ticks from its top. */
function scale() {
  const out = [];
  const y = BE.needleY - 1.6;
  out.push(S(k.slabOf({ x: -2, y: 3.6, w: 4, d: y - 3.6, r: 0.3 }, 45, 6, P, 2), { tone: "mid" }));
  const top = 56;
  out.push(
    S(k.slabOf({ x: -15, y, w: 30, d: 0.8, r: 0.2 }, 48, top - 48, P, 2), {
      tone: "hi",
      flat: true,
    }),
  );
  const face = y + 0.8;
  const ticks = [];
  for (let step = -10; step <= 10; step++) {
    const x = step * 1.25;
    const long = step === 0 ? 5 : step % 5 === 0 ? 3.6 : 2;
    ticks.push({ step, d: k.segment([x, face, top], [x, face, top - long], P) });
  }
  const of = (keep) =>
    ticks
      .filter((tick) => keep(tick.step))
      .map((tick) => tick.d)
      .join("");
  out.push(
    L(
      of((step) => step % 5 !== 0),
      { tone: "faint" },
    ),
  );
  out.push(
    L(
      of((step) => step % 5 === 0 && step !== 0),
      { tone: "lo" },
    ),
  );
  out.push(
    L(
      of((step) => step === 0),
      { tone: "hi" },
    ),
  );
  out.push(D([at([-13.6, face, 50]), at([13.6, face, 50])], { size: 0.35 }));
  return out.join("");
}

/** One half of the arrest bar, through the pillar, with its pin that cradles the beam. */
function bar(sign) {
  const out = [];
  const from = sign < 0 ? -40 : 4.4;
  const to = sign < 0 ? -4.4 : 40;
  const z = AR.barTop - 3;
  out.push(
    S(k.slabOf({ x: from, y: -1.5, w: to - from, d: 3, r: 0.5 }, z, 3, P, 2, 0.3), {
      tone: "mid",
    }),
  );
  const x = sign * AR.pinX;
  const cradle = BE.pivotZ - BE.chordR;
  out.push(
    S(k.cylinder(x, 0, 0.9, AR.barTop, cradle - 1.8 - AR.barTop, P, 12), {
      tone: "mid",
      crease: "none",
    }),
  );
  out.push(
    S(k.slabOf({ x: x - 1.8, y: -1.8, w: 3.6, d: 3.6, r: 0.3 }, cradle - 1.8, 1.8, P, 2), {
      tone: "mid",
    }),
  );
  out.push(D([at([x, 1.5, z + 1.5])], { size: 0.4 }));
  return out.join("");
}

/** A pan rest's collar on the floor; its stem and pad are drawn live. */
function collar(x) {
  return (
    S(k.cylinder(x, 0, 4.4, FLOOR_TOP, 1, P, 32), { tone: "mid" }) +
    S(k.cylinder(x, 0, 2.6, FLOOR_TOP + 1, AR.collarTop - FLOOR_TOP - 1, P, 24, 0.3), {
      tone: "mid",
    }) +
    L(k.ring(x, 0, AR.stemR, AR.collarTop, P, 16), { tone: "lo" })
  );
}

const padAtOrigin =
  S(k.cylinder(0, 0, 5, 0, AR.padH, P, 32, 0.3), { tone: "mid" }) +
  L(k.ring(0, 0, 3.4, AR.padH, P, 28), { tone: "faint" });

/** A pan's bow, hung from its stirrup: a flat wire arch whose legs land on the pan's rim. */
function bow(x) {
  const r = BE.panR - 0.5;
  const top = BE.pivotZ - 5.5;
  const centre = top - r - 0.6;
  const low = BE.panZ + 2.2;
  const side = (radius, from, to) => {
    const points = [[x + radius * Math.cos(from), 0, low]];
    for (let step = 0; step <= 24; step++) {
      const angle = from + ((to - from) * step) / 24;
      points.push([x + radius * Math.cos(angle), 0, centre + radius * Math.sin(angle)]);
    }
    points.push([x + radius * Math.cos(to), 0, low]);
    return points.map(at);
  };
  const outer = side(r + 0.6, Math.PI, 0);
  const inner = side(r - 0.6, 0, Math.PI);
  return (
    `<path class="iso-fill" d="${k.pathOf([...outer, ...inner], true)}"/>` +
    L(k.pathOf(outer) + k.pathOf(inner), { tone: "hi" }) +
    S(G.sphereOf([x, 0, top - 0.6], 1.1, P, { steps: 16 }), { tone: "hi" })
  );
}

function pan(x) {
  const F = up(x, 0, BE.panZ);
  const r = BE.panR;
  return (
    S(
      G.solidOf(
        [
          [0, r - 2.6],
          [0.8, r - 1.1],
          [2.6, r],
        ],
        F,
        P,
        { steps: 40 },
      ),
      { tone: "hi" },
    ) +
    `<path class="iso-paper" d="${G.circleOf(F, 2.6, r - 0.7, P)}"/>` +
    L(G.circleOf(F, 2.6, r - 0.7, P), { tone: "lo" }) +
    L(G.circleOf(F, 0.6, r - 3.6, P), { tone: "faint" })
  );
}

/** The ingot on the left pan: the work being checked, its assay marks struck on top. */
function ingot() {
  const z = BE.panZ + 0.6;
  const x = -BE.half;
  const paths = frustum([x, 0, z], [6.4, 3.8], [5, 2.6], 4);
  return (
    S(paths, { tone: "hi" }) +
    L(k.ring(x + 1.6, 0, 1.2, z + 4, P, 18), { tone: "lo" }) +
    L(k.planOutline({ x: x - 3.6, y: -1.6, w: 3.2, d: 3.2, r: 0.3 }, z + 4, P, 2), {
      tone: "faint",
    })
  );
}

/** The sealed standard weight on the right pan: the specification. */
function standard() {
  const F = up(BE.half, 0, BE.panZ + 0.6);
  const body = [
    [0, 5.8],
    [6.6, 5.8],
    [7.6, 4.8],
    [8.2, 2.6],
    [10.2, 2.6],
    [11, 3.6],
    [12.8, 3.6],
    [13.8, 2.4],
  ];
  return (
    S(G.solidOf(body, F, P, { steps: 24 }), {
      tone: "hi",
      inner: L(G.arcOf(F, 3.2, 5.8, P), { tone: "faint" }),
    }) +
    L(G.circleOf(F, 13.8, 1.4, P), { tone: "mid" }) +
    D([at(G.pointOf(F, 13.8, 0, 0))], { size: 0.45 })
  );
}

/** The stirrup on a beam end, over its knife, with the hook the bow hangs from. */
function stirrup(x) {
  const top = BE.pivotZ - 5.5;
  return (
    S(k.cylinder(x, 0, 0.6, top, BE.pivotZ - 2.2 - top, P, 10), { tone: "mid", crease: "none" }) +
    S(k.slabOf({ x: x - 2.4, y: -3, w: 4.8, d: 6, r: 0.6 }, BE.pivotZ - 2.2, 5.2, P, 2, 0.3), {
      tone: "mid",
    }) +
    D([at([x, 3, BE.pivotZ + 1.2])], { size: 0.4 })
  );
}

/** The beam's centre boss over the pivot, and the arm forward that carries the pointer. */
function boss() {
  const F = G.frameOf([0, BE.chordR, BE.pivotZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const arm = BE.needleY - 0.6 - BE.chordR;
  return (
    S(G.disc(0, 3.6, 3.8, F, P), { tone: "mid" }) +
    S(G.disc(3.6, arm, 1.3, F, P, { smooth: false }), { tone: "mid", crease: "none" })
  );
}

function hub() {
  const F = G.frameOf([0, BE.needleY - 0.6, BE.pivotZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  return S(G.disc(0, 1.2, 1.9, F, P, { smooth: false }), { tone: "hi" });
}

/** The rider carrier: a rod across the top of the case, worked from a knob outside the right side. */
const RIDER = { y: -10, z: 200, r: 0.8, x: 6 };
const riderFrame = G.frameOf([0, RIDER.y, RIDER.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const RIDER_SIDE = POST_X + 2.5;

/** A thin rod between two world points, drawn like the live rods; its ends hide in what it joins. */
function thinRod(a, b, r) {
  const paths = rod(a, b, r, P);
  return (
    `<path class="iso-fill" d="${paths.body}"/>` +
    `<path fill="url(#${NAME}-h1)" d="${paths.shade}"/>` +
    L(paths.edges, { tone: "mid" })
  );
}

function riderInside() {
  const F = riderFrame;
  const { x, y, z } = RIDER;
  const out = [thinRod([-RIDER_SIDE, y, z], [RIDER_SIDE, y, z], RIDER.r)];
  out.push(
    S(G.disc(-RIDER_SIDE - 1.6, -RIDER_SIDE, 2.2, F, P, { smooth: false }), { tone: "mid" }),
  );
  // The hook on its collar, a rider hanging from it ready to set on the beam.
  out.push(thinRod([x, y, z - 16], [x, y, z], 0.45));
  out.push(S(G.disc(x - 1.4, x + 1.4, 1.5, F, P, { smooth: false }), { tone: "mid" }));
  const ring = G.frameOf([x, y, z - 17.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  out.push(L(G.circleOf(ring, 0, 1.6, P, 20), { tone: "hi" }));
  return out.join("");
}

function riderOutside() {
  const F = riderFrame;
  const { y, z } = RIDER;
  const out = [thinRod([RIDER_SIDE, y, z], [RIDER_SIDE + 5, y, z], RIDER.r)];
  out.push(S(G.disc(RIDER_SIDE, RIDER_SIDE + 1.6, 2.2, F, P, { smooth: false }), { tone: "mid" }));
  out.push(
    S(G.disc(RIDER_SIDE + 5, RIDER_SIDE + 8.4, 3, F, P, { smooth: false }), {
      tone: "hi",
      inner: L(G.ribsOf(F, RIDER_SIDE + 5, RIDER_SIDE + 8.4, 3, 14, P), { tone: "faint" }),
    }),
  );
  return out.join("");
}

const knobHub = S(G.sphereOf([AR.knob[0], AR.knob[1] + 0.9, AR.knob[2]], 1.5, P, { steps: 20 }), {
  tone: "hi",
});

/** The fitted box of weights: one hole stands empty, its weight on the pan. */
function weights() {
  const out = [shadowOf(BOX, 0, 4)];
  const seam = k.sideSeam(BOX, BOX_H - 3, P, 2);
  out.push(
    S(k.slabOf(BOX, 0, BOX_H, P, 2, 0.6), { tone: "mid", inner: L(seam, { tone: "faint" }) }),
  );
  out.push(L(k.planOutline(k.insetPlan(BOX, 2), BOX_H, P, 2), { tone: "faint" }));
  // The lid, open on its hinges along the back edge, lined inside.
  const lid = { x: BOX.x, y: BOX.y - 2, w: BOX.w, d: 2, r: 0.4 };
  out.push(S(k.slabOf(lid, BOX_H, BOX.d - 2, P, 2, 0.4), { tone: "mid" }));
  out.push(
    loop(upright("y", BOX.y, BOX.x + 2.4, BOX.x + BOX.w - 2.4, BOX_H + 2.4, BOX_H + BOX.d - 4.4)),
  );
  for (const x of [BOX.x + 8, BOX.x + BOX.w - 8])
    out.push(
      S(k.slabOf({ x: x - 3, y: BOX.y - 0.6, w: 6, d: 1.6, r: 0.6 }, BOX_H, 1.4, P, 2), {
        tone: "hi",
      }),
    );
  const top = BOX_H;
  // The largest hole stands empty: its weight, the standard, is on the pan.
  const holes = [
    { x: BOX.x + 9, y: BOX.y + 10, r: 6, h: 11, empty: true },
    { x: BOX.x + 23, y: BOX.y + 10, r: 4.8, h: 9 },
    { x: BOX.x + 35, y: BOX.y + 10, r: 4.8, h: 9 },
    { x: BOX.x + 8, y: BOX.y + 24, r: 3.8, h: 7.4 },
    { x: BOX.x + 19, y: BOX.y + 24, r: 3.2, h: 6.2 },
    { x: BOX.x + 29, y: BOX.y + 24, r: 2.6, h: 5 },
  ];
  for (const hole of byDepth(holes.map((each) => [each.x, each.y, each])).map(([, , h]) => h)) {
    const seat = {
      x: hole.x - hole.r - 0.8,
      y: hole.y - hole.r - 0.8,
      w: 2 * hole.r + 1.6,
      d: 2 * hole.r + 1.6,
      r: hole.r + 0.8,
    };
    if (hole.empty === true) {
      out.push(`<path fill="url(#${NAME}-h0)" d="${k.planOutline(seat, top, P, 10)}"/>`);
      out.push(L(k.planOutline(seat, top, P, 10), { tone: "mid" }));
      continue;
    }
    out.push(L(k.planOutline(seat, top, P, 10), { tone: "lo" }));
    const F = up(hole.x, hole.y, top);
    const r = hole.r;
    const h = hole.h;
    out.push(
      S(
        G.solidOf(
          [
            [0, r],
            [h * 0.52, r],
            [h * 0.6, r * 0.78],
            [h * 0.64, r * 0.42],
            [h * 0.78, r * 0.42],
            [h * 0.84, r * 0.6],
            [h, r * 0.6],
          ],
          F,
          P,
          { steps: 12 },
        ),
        { tone: "hi" },
      ),
    );
  }
  // Three leaf weights in their recesses at the right end, the small fractions.
  for (const [index, y] of [BOX.y + 7, BOX.y + 14, BOX.y + 21].entries()) {
    const recess = { x: BOX.x + 41, y, w: 5, d: 5, r: 0.4 };
    out.push(L(k.planOutline(recess, top, P, 2), { tone: "lo" }));
    const leaf = k.insetPlan(recess, 0.8 + index * 0.2);
    out.push(S(k.slabOf(leaf, top, 0.35, P, 2), { tone: "hi", crease: "none" }));
  }
  return out.join("");
}

/** Tweezers on the bench beside the box: two flat arms from a bow. */
function tweezers() {
  const joint = [86, 70];
  const angle = -0.18;
  const along = [Math.cos(angle), Math.sin(angle)];
  const across = [-along[1], along[0]];
  const point = (s, n) => [
    joint[0] + along[0] * s + across[0] * n,
    joint[1] + along[1] * s + across[1] * n,
  ];
  const out = [
    shadow(
      k.extrude([point(-3, -2.6), point(44, -3.6), point(44, 3.6), point(-3, 2.6)], 0, 0.01, P)
        .fill,
    ),
  ];
  for (const sign of [-1, 1]) {
    const arm = [
      point(2, sign * 0.4),
      point(40, sign * 2.6),
      point(40, sign * 3.4),
      point(2, sign * 2),
    ];
    out.push(S(k.extrude(arm, 0, 0.7, P), { tone: "hi", crease: "none" }));
  }
  out.push(
    S(k.extrude([point(-3, -2), point(4, -2.2), point(4, 2.2), point(-3, 2)], 0, 1, P), {
      tone: "hi",
    }),
  );
  return out.join("");
}

const { moment } = E;
const restPose = M.pose(moment);
const live = M.liveParts(restPose, P);
const shift = M.panShift(restPose.tilt);
const toLeft = transform(offsetOf(shift, P));
const toRight = transform(offsetOf([-shift[0], 0, -shift[2]], P));
const rodSvg = (part, tone = "hi") => {
  const paths = live.rods[part];
  return (
    `<path data-part="${part}" class="iso-fill" d="${paths.body}"/>` +
    `<path data-part="${part}-shade" fill="url(#${NAME}-h1)" d="${paths.shade}"/>` +
    `<path data-part="${part}-edges" class="iso-line" data-tone="${tone}" d="${paths.edges}"/>`
  );
};
const group = (part, transformed, body) =>
  `<g data-part="${part}" transform="${transformed}">${body}</g>`;
const barMove = transform(live.bar);

const parts = [
  bench(),
  base(),
  rodSvg("lever", "mid"),
  group(
    "ball",
    transform(live.ball),
    S(G.sphereOf([0, 0, 0], AR.ballR, P, { steps: 24 }), { tone: "hi" }),
  ),
  knobHub,
  caseBack(),
  riderInside(),
  collar(-BE.half),
  rodSvg("stem-left", "mid"),
  group("pad-left", transform(live.padLeft), padAtOrigin),
  group("left", toLeft, bow(-BE.half) + pan(-BE.half) + ingot()),
  group("bar", barMove, bar(-1)),
  pillar(),
  group("bar", barMove, bar(1)),
  scale(),
  collar(BE.half),
  rodSvg("stem-right", "mid"),
  group("pad-right", transform(live.padRight), padAtOrigin),
  group("right", toRight, bow(BE.half) + pan(BE.half) + standard()),
  rodSvg("strut-left"),
  rodSvg("strut-right"),
  rodSvg("chord"),
  group(
    "apex",
    transform(live.apex),
    S(G.sphereOf([0, 0, 0], BE.apexR, P, { steps: 20 }), { tone: "hi" }),
  ),
  boss(),
  `<path data-part="needle" class="iso-line" data-tone="lit" data-free="end" d="${live.needle}"/>`,
  hub(),
  group("left", toLeft, stirrup(-BE.half)),
  group("right", toRight, stirrup(BE.half)),
  caseFront(),
  riderOutside(),
  sash(),
  weights(),
  tweezers(),
];
E.write(parts, moment);
