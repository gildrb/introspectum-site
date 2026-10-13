// Draws the ERP & CRM figure, a counting house desk (see `src/figures/ledger-model.ts`), and writes
// it to `src/figures/ledger.svg`. Run: node scripts/figures/ledger.mjs [--preview] (see `engrave.mjs`).
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/ledger-model.ts";
import { offsetOf, translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "ledger";
const { book: BOOK } = M;

const BENCH = { x: -150, y: -94, w: 284, d: 182, r: 6 };
const BENCH_H = 10;
const FOOT_H = 7;
/** The glazed case: walls up to `WALL`, the lid frame on them up to `LID`. */
const CASE = { x: -118, y: -54, w: 146, d: 106, r: 1.5 };
const WALL = 12;
const LID = 15;
/** The opening in the lid frame, where the glass shows the ledger. */
const OPEN = { x0: -106, x1: 16, y0: -26, y1: 40 };
/** The posting slot in the case's right face, in line with the next row. */
const SLOT = { y0: 17, y1: 39, z0: 8.4, z1: 10 };
const RIGHT = CASE.x + CASE.w;
const TRAY = { x: RIGHT, y: 15, w: 42, d: 26, r: 1 };
const DISPENSER = { x: 72, y: 14, w: 45, d: 28, r: 1.5 };
const DISPENSER_H = 12;
const PAD = { x: 80, y: 50, w: 34, d: 26, r: 2 };
/** The reading glass's rail runs in front of the case; its carriage reaches back over the glass. */
const RAIL = { y: 58, z: 22, r: 1.6, x0: -126, x1: 24 };
const GLASS = { y: M.lens.y, z: 16, h: 1.2, r: 9.6, inner: 8.2 };
const BOARD = { x: 72, y: -52, w: 54, d: 44, r: 3 };
const RACK = { x: -42, y: -90, w: 140, d: 30, r: 1 };
const RACK_H = 46;

const STAMP_TOP = 53.6;
const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  points: [
    ...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0),
    ...k.boxCorners(RACK, 0, RACK_H),
    [M.slip.feed[0] - 13, M.slip.feed[1] + 9, M.slip.feed[2] + M.stamp.lift + STAMP_TOP],
    [M.stamp.park[0] + 13, M.stamp.park[1] - 9, M.stamp.park[2] + M.stamp.lift + STAMP_TOP],
  ],
});
const { P, at, S, L, D, up, byDepth, shadow, shadowOf } = E;

/** A frame lying along +x at a point, angle 0 toward +y: rails, pens, hinge pins. */
const along = (x, y, z) => G.frameOf([x, y, z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
/** A frame along +y at a point, its polygons in (x, z): profiles extruded front to back. */
const deep = (y) => G.frameOf([0, y, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
/** A closed outline on a vertical face at `y`, from (x0, z0) to (x1, z1). */
const faceRect = (y, x0, x1, z0, z1) =>
  k.pathOf(
    [
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1],
    ].map(at),
    true,
  );
/** A closed outline on a vertical face at `x`, from (y0, z0) to (y1, z1). */
const sideRect = (x, y0, y1, z0, z1) =>
  k.pathOf(
    [
      [x, y0, z0],
      [x, y1, z0],
      [x, y1, z1],
      [x, y0, z1],
    ].map(at),
    true,
  );
/** A dark opening on a face: paper hatched darkest, outlined. */
const opening = (d, tone = "mid") =>
  `<path class="iso-paper" fill="url(#${NAME}-h0)" d="${d}"/>${L(d, { tone })}`;
/** Rule lines that stand for writing on a top face at `z`, each `[x0, x1, y]`. */
const writing = (lines, z, tone = "lo") =>
  L(lines.map(([x0, x1, y]) => k.lineOnTop([x0, y], [x1, y], z, P)).join(""), { tone, free: true });

function bench() {
  const out = [shadow(k.slabOf(k.insetPlan(BENCH, -2), -BENCH_H - FOOT_H, 0.01, P).fill)];
  for (const [x, y] of byDepth(k.corners(BENCH, 18))) {
    out.push(S(k.cylinder(x, y, 8, -BENCH_H - FOOT_H, 2, P, 16), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 6, -BENCH_H - FOOT_H + 2, FOOT_H - 2, P, 14), { tone: "mid" }));
  }
  const seam = k.sideSeam(BENCH, -BENCH_H / 2, P, 5);
  out.push(
    S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 5, 1.4), {
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
  const strip = { x: 10, y: 76, w: 108, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 2), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3, 5, strip.y, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 1.5, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.5, strip.y + 3, 0.6])], {
      size: 0.4,
    }),
  );
  // The maker's plate, in front of the posting tray.
  const plate = { x: 36, y: 50, w: 34, d: 12, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P), { tone: "faint" }));
  out.push(
    writing(
      [
        [plate.x + 6, plate.x + 34 - 6, plate.y + 4],
        [plate.x + 6, plate.x + 26, plate.y + 6.5],
        [plate.x + 6, plate.x + 30, plate.y + 9],
      ],
      0.8,
    ),
  );
  out.push(
    D([at([plate.x + 3, plate.y + 6.5, 0.8]), at([plate.x + plate.w - 3, plate.y + 6.5, 0.8])], {
      size: 0.4,
    }),
  );
  return out.join("");
}

/** A stack of `count` coins of radius `r`: one solid, a seam at every coin, milled or plain. */
function coinStack(x, y, r, count, milled) {
  const h = 1.3;
  const top = 3 + count * h;
  const seams = Array.from({ length: count - 1 }, (_, index) =>
    k.sideArc(x, y, r, 3 + (index + 1) * h, P, 10),
  ).join("");
  const edge = milled ? k.knurl(x, y, r, 3, top, Math.round(r * 5), P, 0.15) : "";
  return (
    S(k.cylinder(x, y, r, 3, count * h, P, 14), {
      tone: "hi",
      crease: "lo",
      inner: L(seams, { tone: "faint" }) + L(edge, { tone: "faint" }),
    }) + L(k.ring(x, y, r - 1, top, P, 20), { tone: "faint" })
  );
}

/** The counting board: coins stacked in columns by denomination, exact to the smallest unit. */
function countingBoard() {
  const out = [shadowOf(BOARD, 0, 3)];
  out.push(
    S(k.slabOf(BOARD, 0, 3, P, 3, 0.6), {
      tone: "mid",
      inner: L(k.sideSeam(BOARD, 1.5, P, 3), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(BOARD, 2.4), 3, P, 3), { tone: "faint" }));
  // Two rows of columns, the largest coins at the back, and loose coins to count in front.
  const columns = [
    [83, -40, 6.2, 8, true],
    [99, -40, 5.6, 6, false],
    [115, -40, 5, 9, false],
    [83, -24, 4.6, 5, false],
    [99, -24, 4, 7, true],
    [115, -24, 3.6, 4, false],
  ].toSorted((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y, r, count, milled] of columns) out.push(coinStack(x, y, r, count, milled));
  for (const [x, r] of [
    [90, 4.4],
    [108, 3.6],
  ]) {
    out.push(
      S(k.cylinder(x, BOARD.y + BOARD.d - 6, r, 3, 1.3, P, 16), { tone: "hi", crease: "lo" }),
    );
    out.push(L(k.ring(x, BOARD.y + BOARD.d - 6, r - 1, 4.3, P, 16), { tone: "faint" }));
  }
  return out.join("");
}

/** The archive: one strapped volume per closed period, on a rack with a back board. */
function rack() {
  const out = [shadowOf(RACK, 0, 4)];
  out.push(S(k.slabOf(RACK, 0, 3, P, 2, 0.5), { tone: "mid" }));
  out.push(
    S(k.slabOf({ x: RACK.x, y: RACK.y, w: RACK.w, d: 3, r: 0.6 }, 3, RACK_H - 3, P, 2), {
      tone: "mid",
    }),
  );
  out.push(
    S(k.slabOf({ x: RACK.x, y: RACK.y, w: 4, d: RACK.d, r: 0.8 }, 3, RACK_H - 3, P, 2, 0.4), {
      tone: "mid",
    }),
  );
  const heights = [38, 40, 37, 39, 40, 38, 36, 39, 40];
  const width = 14.1;
  const spine = RACK.y + RACK.d - 2;
  for (const [index, h] of heights.entries()) {
    const x = RACK.x + 4.3 + index * (width + 0.6);
    const plan = { x, y: RACK.y + 4, w: width, d: spine - RACK.y - 4, r: 0.8 };
    const top = 3 + h;
    // Bands at head and tail, and the strap round its middle, closed by a clasp on the spine.
    const strapZ = 3 + h * 0.36;
    const bands = [top - 4, 8].map((z) => k.sideSeam(plan, z, P, 2)).join("");
    const strap = [strapZ, strapZ + 3].map((z) => k.sideSeam(plan, z, P, 2)).join("");
    out.push(
      S(k.slabOf(plan, 3, h, P, 2), {
        tone: "mid",
        inner: L(bands, { tone: "lo" }) + L(strap, { tone: "mid" }),
      }),
    );
    out.push(L(k.planOutline(k.insetPlan(plan, 1.4), top, P, 1), { tone: "faint" }));
    // The spine's label, its title a rule.
    const cx = x + width / 2;
    out.push(L(faceRect(spine, cx - 4, cx + 4, top - 13, top - 7), { tone: "lo" }));
    out.push(
      L(k.segment([cx - 2.6, spine, top - 10], [cx + 2, spine, top - 10], P), {
        tone: "lo",
        free: true,
      }),
    );
    const strapFace = plan.y + plan.d;
    out.push(
      S(k.slabOf({ x: cx - 2.2, y: strapFace - 0.2, w: 4.4, d: 1, r: 0 }, strapZ - 1, 5, P, 1), {
        tone: "mid",
      }),
    );
    out.push(D([at([cx, strapFace + 0.8, strapZ + 1.5])], { size: 0.45 }));
  }
  out.push(
    S(
      k.slabOf(
        { x: RACK.x + RACK.w - 4, y: RACK.y, w: 4, d: RACK.d, r: 0.8 },
        3,
        RACK_H - 3,
        P,
        2,
        0.4,
      ),
      { tone: "mid" },
    ),
  );
  out.push(
    D(
      [RACK.x + 2, RACK.x + RACK.w - 2].flatMap((x) => [
        at([x, RACK.y + 8, RACK_H]),
        at([x, RACK.y + RACK.d - 4, RACK_H]),
      ]),
      { size: 0.45 },
    ),
  );
  return out.join("");
}

function inkwell() {
  const [cx, cy] = [-108, 72];
  const base = { x: cx - 10, y: cy - 10, w: 20, d: 20, r: 2 };
  const out = [shadowOf(base, 0, 3)];
  out.push(S(k.slabOf(base, 0, 2, P, 2, 0.4), { tone: "mid" }));
  const glass = k.insetPlan(base, 2);
  out.push(S(k.slabOf(glass, 2, 12, P, 2, 1.2), { tone: "hi", crease: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(glass, 2.4), 14, P, 3), { tone: "faint" }));
  const F = up(cx, cy, 14);
  out.push(S(G.disc(0, 2.4, 4.2, F, P, { steps: 20 }), { tone: "mid" }));
  out.push(
    S(
      G.solidOf(
        [
          [2.4, 5],
          [3.4, 5],
          [4.6, 4.2],
          [5.6, 1.6],
        ],
        F,
        P,
        { smooth: false, steps: 28 },
      ),
      { tone: "mid", inner: L(G.arcOf(F, 3.4, 5, P), { tone: "faint" }) },
    ),
  );
  out.push(S(G.sphereOf([cx, cy, 21.4], 2, P), { tone: "mid" }));
  return out.join("");
}

/** The pen tray and the dip pen lying in it. */
function pen() {
  const tray = { x: -92, y: 68, w: 58, d: 11, r: 2 };
  const out = [shadowOf(tray, 0, 2)];
  out.push(S(k.slabOf(tray, 0, 2.2, P, 2, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(tray, 2), 2.2, P, 3), { tone: "faint" }));
  const F = along(tray.x + 5, tray.y + tray.d / 2, 2.2 + 1.9);
  const body = [
    [0, 0.25],
    [5, 1.1],
    [5, 1.6],
    [9, 1.6],
    [9, 1.9],
    [15, 1.75],
    [48, 1.25],
    [50, 0.9],
  ];
  out.push(
    S(G.solidOf(body, F, P, { smooth: false, steps: 14 }), {
      tone: "hi",
      inner: L(G.arcOf(F, 12, 1.9, P), { tone: "faint" }),
    }),
  );
  return out.join("");
}

/** A rocker blotter: a curved foot under a clamp plate and a knob. */
function blotter() {
  const cx = -96;
  const y0 = -83;
  const y1 = -67;
  const R = 30;
  const arc = Array.from({ length: 9 }, (_, index) => {
    const dx = -14 + index * 3.5;
    return [cx + dx, R - Math.sqrt(R * R - dx * dx)];
  });
  const out = [shadowOf({ x: cx - 14, y: y0, w: 28, d: y1 - y0, r: 2 }, 0, 3)];
  const polygon = [...arc, [cx + 14, 6.5], [cx - 14, 6.5]];
  // The blotting paper's edge follows the foot just inside its face.
  const paper = k.pathOf(
    arc.map(([x, z]) => at([x, y1, z + 0.9 * Math.cos(Math.asin((x - cx) / R))])),
  );
  out.push(
    S(G.prismOf(deep(0), polygon, y0, y1, P), {
      tone: "mid",
      inner: L(paper, { tone: "faint" }),
    }),
  );
  const plate = { x: cx - 12, y: y0 + 1, w: 24, d: y1 - y0 - 2, r: 1.5 };
  out.push(S(k.slabOf(plate, 6.5, 1.5, P, 2, 0.4), { tone: "mid" }));
  out.push(
    D(
      k.corners(plate, 2).map(([x, y]) => at([x, y, 8])),
      { size: 0.45 },
    ),
  );
  out.push(S(k.cylinder(cx, (y0 + y1) / 2, 1.6, 8, 2.4, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(G.sphereOf([cx, (y0 + y1) / 2, 13.4], 3.6, P), { tone: "hi" }));
  return out.join("");
}

/** The spike file: vouchers already posted, kept on a spike, never taken off. */
function spike() {
  const [cx, cy] = [-128, -75];
  const out = [shadow(k.cylinder(cx + 2.5, cy - 1, 9, 0, 0.01, P, 20).fill)];
  out.push(S(k.cylinder(cx, cy, 8, 0, 3, P, 20, 0.5), { tone: "mid" }));
  out.push(L(k.ring(cx, cy, 6, 3, P, 24), { tone: "faint" }));
  // Each voucher a little askew of the last, the spike through them all.
  const vouchers = [
    [-1.2, 0.8, 30, 18],
    [1.4, -0.6, 28, 20],
    [-0.4, 1.4, 31, 17],
    [0.8, -1, 29, 19],
  ];
  for (const [index, [dx, dy, w, d]] of vouchers.entries()) {
    const plan = { x: cx + dx - w / 2, y: cy + dy - d / 2, w, d, r: 0.4 };
    const z = 3 + index * 0.9;
    out.push(S(k.slabOf(plan, z, 0.4, P, 2), { tone: "lo", crease: "none" }));
    if (index === vouchers.length - 1)
      out.push(
        writing(
          [
            [plan.x + 3, plan.x + 12, plan.y + 4],
            [plan.x + 3, plan.x + 9, plan.y + 7],
            [plan.x + w - 9, plan.x + w - 3, plan.y + d - 4],
          ],
          z + 0.4,
        ),
      );
  }
  const top = 3 + vouchers.length * 0.9 - 0.5;
  out.push(S(k.cylinder(cx, cy, 1.4, top, 1.2, P, 12), { tone: "mid" }));
  out.push(
    S(
      G.solidOf(
        [
          [0, 0.7],
          [14, 0.6],
          [18, 0.05],
        ],
        up(cx, cy, top + 1.2),
        P,
        { smooth: false, steps: 10 },
      ),
      { tone: "hi", crease: "none" },
    ),
  );
  return out.join("");
}

/** A post of the reading glass's rail: foot, column and the cap the rail runs into. */
function post(x) {
  const y = RAIL.y;
  return (
    shadow(k.cylinder(x + 3, y - 1, 6.5, 0, 0.01, P, 20).fill) +
    S(k.cylinder(x, y, 5.5, 0, 2, P, 20, 0.4), { tone: "mid" }) +
    S(k.cylinder(x, y, 2, 2, RAIL.z - 3.4 - 2, P, 12), {
      tone: "mid",
      crease: "none",
      inner: L(k.sideArc(x, y, 2, 12, P, 12), { tone: "faint" }),
    }) +
    S(k.cylinder(x, y, 3.4, RAIL.z - 3.4, 6.8, P, 16, 0.4), { tone: "mid" }) +
    L(k.ring(x, y, 1.6, RAIL.z + 3.4, P, 14), { tone: "lo" })
  );
}

function rail() {
  const F = along(RAIL.x0, RAIL.y, RAIL.z);
  return S(
    G.solidOf(
      [
        [0, RAIL.r],
        [RAIL.x1 - RAIL.x0, RAIL.r],
      ],
      F,
      P,
      { smooth: false, steps: 14 },
    ),
    { tone: "hi", crease: "none" },
  );
}

/** The case's floor and its far walls, which the ledger lies between. */
function caseBack() {
  const out = [shadowOf(CASE, 0, 4)];
  const inside = k.insetPlan(CASE, 5);
  out.push(S(k.slabOf(inside, 0, 2, P, 2), { tone: "lo", crease: "none" }));
  out.push(
    S(k.slabOf({ x: CASE.x, y: CASE.y, w: CASE.w, d: 5, r: 1 }, 0, WALL, P, 2), { tone: "mid" }),
  );
  out.push(
    S(k.slabOf({ x: CASE.x, y: CASE.y, w: 5, d: CASE.d, r: 1 }, 0, WALL, P, 2), { tone: "mid" }),
  );
  return out.join("");
}

/**
 * The open ledger. The case feeds the book back a row after each posting; along its length the
 * book looks the same wherever it is (its ends are under the lid), so only what is written on its
 * pages is drawn moving, in `data-part="book"`, and the hatching of its solids never shifts.
 */
function ledgerBook(posted, feed) {
  const out = [];
  const written = [];
  const y0 = -42.5;
  const y1 = 46.5;
  for (const cover of [
    { x: -100, y: y0, w: 52, d: y1 - y0, r: 1.5 },
    { x: -48, y: y0, w: 52, d: y1 - y0, r: 1.5 },
  ])
    out.push(S(k.slabOf(cover, 2, 1.2, P, 2), { tone: "mid" }));
  const gutter = -48;
  const low = 6.2;
  const leftPage = [
    [BOOK.left.x0, 3.2],
    [gutter, 3.2],
    [gutter, low],
    [gutter - 2, 7.6],
    [gutter - 5, 8.3],
    [BOOK.left.x1, BOOK.top],
    [BOOK.left.x0, BOOK.top],
  ];
  const rightPage = [
    [gutter, 3.2],
    [BOOK.right.x1, 3.2],
    [BOOK.right.x1, BOOK.top],
    [BOOK.right.x0, BOOK.top],
    [gutter + 5, 8.3],
    [gutter + 2, 7.6],
    [gutter, low],
  ];
  const p0 = y0 + 1;
  const p1 = y1 - 1;
  out.push(S(G.prismOf(deep(0), leftPage, p0, p1, P), { tone: "hi", crease: "lo" }));
  const edges = [4, 4.7, 5.4, 6.1, 6.8, 7.5]
    .map((z) => k.segment([BOOK.right.x1, p0, z], [BOOK.right.x1, p1, z], P))
    .join("");
  out.push(
    S(G.prismOf(deep(0), rightPage, p0, p1, P), {
      tone: "hi",
      crease: "lo",
      inner: L(edges, { tone: "faint" }),
    }),
  );
  // The ruling: every row across both pages and down into the gutter, and the columns.
  const across = [
    [BOOK.left.x0, BOOK.top],
    [BOOK.left.x1, BOOK.top],
    [gutter - 5, 8.3],
    [gutter - 2, 7.6],
    [gutter, low],
    [gutter + 2, 7.6],
    [gutter + 5, 8.3],
    [BOOK.right.x0, BOOK.top],
    [BOOK.right.x1, BOOK.top],
  ];
  const ruling = [];
  for (let row = BOOK.oldest; row <= BOOK.next + 2; row++) {
    const y = M.baselineOf(row);
    if (y > p1) break;
    ruling.push(k.pathOf(across.map(([x, z]) => at([x, y, z]))));
  }
  written.push(L(ruling.join(""), { tone: "faint" }));
  const columns = [-83, -73, -24, -23, -12]
    .map((x) => k.segment([x, p0, BOOK.top], [x, p1, BOOK.top], P))
    .join("");
  out.push(L(columns, { tone: "lo" }));
  // The entries: a number, a date, words and an amount; the next row stays empty until posted.
  for (let row = BOOK.oldest; row <= BOOK.next; row++) {
    const entry = M.entryOf(row, 0);
    const y = M.baselineOf(row);
    const number = k.faceTextSvg(
      k.topMatrix([BOOK.numberX, y - 1.2], BOOK.top, P),
      M.digitsOf(entry),
      { size: 3.4, tone: "mid" },
    );
    const ink = L(M.inkOf(entry, row, P), { tone: "lo", free: true });
    const group = `<g data-row="${row}">${number}${ink}</g>`;
    const shown = posted ? "" : ' display="none"';
    written.push(row === BOOK.next ? `<g data-part="fresh"${shown}>${group}</g>` : group);
  }
  out.push(`<g data-part="book" transform="${place([0, -feed, 0])}">${written.join("")}</g>`);
  return out.join("");
}

/** The case's near walls with the posting slot, the locked lid frame and its glass. */
function caseFront() {
  const out = [];
  const right = { x: RIGHT - 5, y: CASE.y, w: 5, d: CASE.d, r: 1 };
  const front = { x: CASE.x, y: CASE.y + CASE.d - 5, w: CASE.w, d: 5, r: 1 };
  out.push(S(k.slabOf(right, 0, WALL, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf(front, 0, WALL, P, 2), { tone: "mid" }));
  const face = CASE.y + CASE.d;
  // The posting slot: the only way into the case, level with the page (its hood is `slotHood`).
  out.push(opening(sideRect(RIGHT, SLOT.y0, SLOT.y1, SLOT.z0, SLOT.z1)));
  // The lid: a wide header at the back with the hinges, rails round the glass.
  const rails = {
    back: { x: CASE.x, y: CASE.y, w: CASE.w, d: OPEN.y0 - CASE.y, r: 1.5 },
    left: { x: CASE.x, y: OPEN.y0, w: OPEN.x0 - CASE.x, d: OPEN.y1 - OPEN.y0, r: 0 },
    right: { x: OPEN.x1, y: OPEN.y0, w: CASE.x + CASE.w - OPEN.x1, d: OPEN.y1 - OPEN.y0, r: 0 },
    front: { x: CASE.x, y: OPEN.y1, w: CASE.w, d: face - OPEN.y1, r: 1.5 },
  };
  const glass = [LID - 1, LID - 1.8];
  const lidRail = (plan) => S(k.slabOf(plan, WALL, LID - WALL, P, 2, 0.5), { tone: "mid" });
  out.push(lidRail(rails.back));
  out.push(
    L(glass.map((z) => k.segment([OPEN.x0, OPEN.y0, z], [OPEN.x1, OPEN.y0, z], P)).join(""), {
      tone: "lo",
    }),
  );
  out.push(lidRail(rails.left));
  out.push(
    L(glass.map((z) => k.segment([OPEN.x0, OPEN.y0, z], [OPEN.x0, OPEN.y1, z], P)).join(""), {
      tone: "lo",
    }),
  );
  // A few strokes of light across the far corner of the glass, from edge to edge.
  out.push(
    L(
      [7, 11]
        .map((s) =>
          k.segment([OPEN.x0 + s, OPEN.y0, glass[0]], [OPEN.x0, OPEN.y0 + s, glass[0]], P),
        )
        .join(""),
      { tone: "faint" },
    ),
  );
  out.push(lidRail(rails.right));
  out.push(lidRail(rails.front));
  // The lid's plate on the header, the hinges at the back, corner plates at the front.
  const plate = { x: -66, y: CASE.y + 6, w: 40, d: 13, r: 1.2 };
  out.push(S(k.slabOf(plate, LID, 0.6, P, 2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), LID + 0.6, P, 2), { tone: "faint" }));
  out.push(
    writing(
      [
        [plate.x + 5, plate.x + 35, plate.y + 4.5],
        [plate.x + 5, plate.x + 27, plate.y + 6.8],
        [plate.x + 5, plate.x + 31, plate.y + 9.1],
      ],
      LID + 0.6,
    ),
  );
  out.push(
    D(
      [
        at([plate.x + 2.6, plate.y + 6.5, LID + 0.6]),
        at([plate.x + plate.w - 2.6, plate.y + 6.5, LID + 0.6]),
      ],
      {
        size: 0.4,
      },
    ),
  );
  for (const x of [-104, 2]) {
    const leaf = { x, y: CASE.y + 0.6, w: 14, d: 6, r: 0.6 };
    out.push(S(k.slabOf(leaf, LID, 0.4, P, 2), { tone: "lo", crease: "none" }));
    out.push(
      D([at([x + 3.5, CASE.y + 4, LID + 0.4]), at([x + 10.5, CASE.y + 4, LID + 0.4])], {
        size: 0.4,
      }),
    );
    out.push(S(G.disc(0, 14, 1.4, along(x, CASE.y, LID + 0.2), P, { steps: 14 }), { tone: "mid" }));
  }
  for (const x of [CASE.x, CASE.x + CASE.w - 8]) {
    const corner = { x, y: face - 8, w: 8, d: 8, r: 1 };
    out.push(S(k.slabOf(corner, LID, 0.4, P, 2), { tone: "lo", crease: "none" }));
    out.push(D([at([x + 4, face - 4, LID + 0.4])], { size: 0.45 }));
  }
  return out.join("");
}

/** The hood over the posting slot, which the slip passes under. */
function slotHood() {
  const plan = { x: RIGHT, y: SLOT.y0 - 1.5, w: 2.6, d: SLOT.y1 - SLOT.y0 + 3, r: 0.3 };
  return (
    S(k.slabOf(plan, SLOT.z1, 0.9, P, 1, 0.3), { tone: "mid" }) +
    D(
      [
        at([RIGHT + 1.3, plan.y + 1.4, SLOT.z1 + 0.9]),
        at([RIGHT + 1.3, plan.y + plan.d - 1.4, SLOT.z1 + 0.9]),
      ],
      { size: 0.4 },
    )
  );
}

/** The hasp over the lid's front and the padlock that keeps it shut. */
function padlock() {
  const face = CASE.y + CASE.d;
  const x = -45;
  const out = [];
  out.push(
    S(k.slabOf({ x: x - 4, y: face, w: 8, d: 0.8, r: 0.3 }, 5.4, LID + 0.3 - 5.4, P, 2), {
      tone: "mid",
    }),
  );
  out.push(D([at([x - 2.4, face + 0.8, 13.6]), at([x + 2.4, face + 0.8, 13.6])], { size: 0.45 }));
  // The staple through the hasp, and the shackle through the staple.
  out.push(opening(faceRect(face + 0.8, x - 1.1, x + 1.1, 6.8, 10.8), "lo"));
  out.push(
    S(k.slabOf({ x: x - 0.8, y: face + 0.8, w: 1.6, d: 2.2, r: 0.3 }, 8.6, 2.2, P, 2), {
      tone: "mid",
    }),
  );
  const F = G.frameOf([x, face + 1.4, 6.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const shackle = G.lathe(
    [
      [0, 2.2],
      [0, 3.2],
      [1.2, 3.2],
      [1.2, 2.2],
    ],
    F,
    P,
    { hole: [1.2, 2.2], smooth: false, steps: 24 },
  );
  out.push(`<g fill-rule="evenodd">${S(shackle, { tone: "hi" })}</g>`);
  const body = { x: x - 4.4, y: face + 0.8, w: 8.8, d: 3.4, r: 1.2 };
  out.push(S(k.slabOf(body, 0.6, 6.4, P, 2, 0.5), { tone: "hi" }));
  const keyhole = k.sideRing([x, body.y + body.d, 3.8], 0.9, "y", P, 14);
  out.push(opening(keyhole, "lo"));
  return out.join("");
}

/** The reading glass: a lens in a rim and the arm that holds it. Built at x = 0. */
function lensAssembly() {
  const out = [];
  const { y, z, h, r, inner } = GLASS;
  const rim = k.cylinder(0, y, r, z, h, P, 32);
  const hole = k.ring(0, y, inner, z + h, P, 32);
  out.push(
    `<g class="iso-solid" fill-rule="evenodd"><path class="iso-fill" d="${rim.fill}${hole}"/>` +
      rim.shades
        .map((d, shade) =>
          d === ""
            ? ""
            : `<path class="iso-shade" data-shade="${shade}" fill="url(#${NAME}-h${shade})" d="${d}"/>`,
        )
        .join("") +
      `<path class="iso-top" d="${rim.top}${hole}"/>` +
      `<path class="iso-line" data-tone="hi" d="${hole}"/>` +
      `<path class="iso-line iso-edge" data-tone="hi" d="${rim.outline}"/></g>`,
  );
  out.push(L(k.ring(0, y, inner + 0.8, z + h, P, 40), { tone: "faint" }));
  const arm = { x: -1.2, y: y + r - 1.6, w: 2.4, d: RAIL.y - 3.6 - (y + r - 1.6), r: 0.4 };
  out.push(S(k.slabOf(arm, z + h, 1, P, 2), { tone: "mid" }));
  out.push(D([at([0, y + r - 0.6, z + h + 1])], { size: 0.4 }));
  return out.join("");
}

/** The carriage that runs on the rail and carries the glass's arm. Built at x = 0. */
function carriage() {
  const out = [];
  const plan = { x: -5, y: RAIL.y - 3.6, w: 10, d: 7.2, r: 1 };
  const bottom = GLASS.z + GLASS.h - 0.2;
  out.push(
    S(k.slabOf(plan, bottom, RAIL.z + 4.4 - bottom, P, 2, 0.4), {
      tone: "mid",
      inner: L(k.sideSeam(plan, RAIL.z, P, 2), { tone: "faint" }),
    }),
  );
  out.push(
    D([at([-3, plan.y + plan.d, bottom + 2]), at([3, plan.y + plan.d, bottom + 2])], { size: 0.4 }),
  );
  const top = RAIL.z + 4.4;
  out.push(S(k.cylinder(0, RAIL.y, 1.2, top, 1, P, 14), { tone: "mid", crease: "none" }));
  out.push(
    S(k.cylinder(0, RAIL.y, 2.6, top + 1, 2.8, P, 16), {
      tone: "mid",
      inner: L(k.knurl(0, RAIL.y, 2.6, top + 1, top + 3.8, 22, P), { tone: "faint" }),
    }),
  );
  return out.join("");
}

/** The tray the slip is stamped on, in line with the slot, and its far guide. */
function feedTray() {
  const out = [];
  for (const y of [TRAY.y + TRAY.d - 2.5, TRAY.y + 2.5]) {
    const x = TRAY.x + TRAY.w - 4;
    out.push(shadow(k.cylinder(x + 2, y - 1, 2.2, 0, 0.01, P, 12).fill));
    out.push(S(k.cylinder(x, y, 2.2, 0, 1, P, 12), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 1.2, 1, 5.6, P, 10), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf(TRAY, 6.6, 1.8, P, 2, 0.4), { tone: "mid" }));
  out.push(guide(TRAY.y));
  return out.join("");
}

/** A guide strip along the tray's edge at `y`, the slip running between two of them. */
const guide = (y) =>
  S(k.slabOf({ x: TRAY.x + 1, y, w: TRAY.w - 1, d: 2, r: 0.4 }, 8.4, 0.9, P, 2), { tone: "lo" });

/** The slip box, the one place a fresh slip comes from. */
function dispenser() {
  const out = [shadowOf(DISPENSER, 0, 3)];
  out.push(
    S(k.slabOf(DISPENSER, 0, DISPENSER_H, P, 2, 0.8), {
      tone: "mid",
      inner: L(k.sideSeam(DISPENSER, DISPENSER_H - 3, P, 2), { tone: "faint" }),
    }),
  );
  const face = DISPENSER.y + DISPENSER.d;
  out.push(L(faceRect(face, DISPENSER.x + 10, DISPENSER.x + 35, 3, 8.4), { tone: "lo" }));
  out.push(
    L(k.segment([DISPENSER.x + 13, face, 5.6], [DISPENSER.x + 30, face, 5.6], P), {
      tone: "lo",
      free: true,
    }),
  );
  out.push(
    D(
      k.corners(DISPENSER, 3).map(([x, y]) => at([x, y, DISPENSER_H])),
      { size: 0.45 },
    ),
  );
  return out.join("");
}

function inkPad() {
  const out = [shadowOf(PAD, 0, 3)];
  out.push(
    S(k.slabOf(PAD, 0, 3.2, P, 2, 0.5), {
      tone: "mid",
      inner: L(k.sideSeam(PAD, 1.6, P, 2), { tone: "faint" }),
    }),
  );
  const felt = k.insetPlan(PAD, 2.4);
  out.push(S(k.slabOf(felt, 3.2, 1.4, P, 2), { tone: "lo", crease: "none" }));
  out.push(`<path fill="url(#${NAME}-h2)" d="${k.planOutline(felt, 4.6, P, 2)}"/>`);
  out.push(L(k.planOutline(felt, 4.6, P, 2), { tone: "lo" }));
  return out.join("");
}

/** The slip, built at the origin: the entry written, a box for its number. */
const slipAtOrigin = (() => {
  const { w, d, h } = M.slip;
  const plan = { x: -w / 2, y: -d / 2, w, d, r: 0.5 };
  const box = { x: -6, y: -8, w: 12, d: 5.6, r: 0.3 };
  return (
    S(k.slabOf(plan, 0, h, P, 2), { tone: "hi", lit: true, crease: "none" }) +
    L(k.lineOnTop([-w / 2, -1], [w / 2, -1], h, P), { tone: "faint" }) +
    L(k.planOutline(box, h, P, 2), { tone: "lo" }) +
    writing(
      [
        [-17, -9, -5.2],
        [-17, 6, 2.6],
        [-17, -4, 5.6],
        [9, 17, -5.2],
        [8, 17, 5.6],
      ],
      h,
    )
  );
})();

/** The vertical spring under the stamp's knob, as back and front halves for painting. */
function spring(r, z0, z1, turns) {
  const [vx, vy] = k.towardViewer(P);
  const facing = Math.atan2(vy, vx);
  const back = [];
  const front = [];
  const count = turns * 24;
  let run = [];
  let near = null;
  for (let index = 0; index <= count; index++) {
    const angle = facing + Math.PI + (index / count) * turns * 2 * Math.PI;
    const point = at([Math.cos(angle) * r, Math.sin(angle) * r, z0 + ((z1 - z0) * index) / count]);
    const isNear = Math.cos(angle - facing) > 0;
    if (near === null) near = isNear;
    if (isNear !== near) {
      run.push(point);
      (near ? front : back).push(k.pathOf(run));
      run = [];
      near = isNear;
    }
    run.push(point);
  }
  (near ? front : back).push(k.pathOf(run));
  return { back: back.join(""), front: front.join("") };
}

/** The numbering stamp, built with its foot at the origin. */
function stampAtOrigin(next, turn) {
  const out = [];
  const { ratchet } = M.stamp;
  out.push(S(k.slabOf({ x: -12, y: -9, w: 24, d: 18, r: 1.5 }, 0, 3, P, 2, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -12, y: -5, w: 2, d: 10, r: 0.4 }, 3, 24, P, 2), { tone: "mid" }));
  const housing = { x: -9.6, y: -7.5, w: 19.2, d: 15, r: 1.2 };
  out.push(
    S(k.slabOf(housing, 4.5, 13.5, P, 2, 0.5), {
      tone: "hi",
      inner: L(k.sideSeam(housing, 6.4, P, 2), { tone: "faint" }),
    }),
  );
  // The window on the number wheels: four wheels, the next number on them.
  const face = housing.y + housing.d;
  const window = faceRect(face, -8, 8, 8.4, 14.6);
  out.push(`<path class="iso-paper" d="${window}"/>`);
  out.push(
    L([-4, 0, 4].map((x) => k.segment([x, face, 8.4], [x, face, 14.6], P)).join(""), {
      tone: "faint",
    }),
  );
  out.push(L(window, { tone: "mid" }));
  out.push(
    `<g data-part="wheels">${M.digitsOf(next)
      .split("")
      .map((digit, index) =>
        k.faceTextSvg(k.sideMatrix([-6 + index * 4, face], 9.8, P, "left"), digit, {
          size: 4.6,
          tone: "hi",
          anchor: "middle",
        }),
      )
      .join("")}</g>`,
  );
  out.push(S(k.slabOf({ x: 10, y: -5, w: 2, d: 10, r: 0.4 }, 3, 24, P, 2), { tone: "mid" }));
  // The ratchet on the right leg, turned a tooth per entry, and the pawl that holds it.
  const teeth = M.ratchetOf(turn, P);
  out.push(`<path data-part="ratchet" class="iso-fill" d="${teeth}"/>`);
  out.push(`<path data-part="ratchet-edges" class="iso-line" data-tone="mid" d="${teeth}"/>`);
  const hub = G.frameOf([ratchet.x, 0, ratchet.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(L(G.circleOf(hub, 0, ratchet.root - 0.9, P, 24), { tone: "faint" }));
  out.push(S(G.disc(0, 0.8, 1.6, hub, P, { steps: 16 }), { tone: "mid" }));
  out.push(D([at([ratchet.x + 0.8, 0, ratchet.z])], { size: 0.45 }));
  const pawl = G.frameOf([ratchet.x, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(
    S(
      G.prismOf(
        pawl,
        [
          [-4, 19.4],
          [-2.6, 21.6],
          [0.2, ratchet.z + ratchet.r + 0.4],
          [-0.9, ratchet.z + ratchet.r - 0.4],
        ],
        0,
        0.6,
        P,
      ),
      { tone: "mid" },
    ),
  );
  out.push(D([at([ratchet.x + 0.6, -3.2, 20.4])], { size: 0.45 }));
  // The bridge over the legs, the spring and the knob the hand presses.
  out.push(
    S(k.slabOf({ x: -12.8, y: -6, w: 25.6, d: 12, r: 1.2 }, 27, 3, P, 2, 0.5), { tone: "mid" }),
  );
  out.push(D([at([-11, 0, 30]), at([11, 0, 30])], { size: 0.45 }));
  out.push(S(k.cylinder(0, 0, 4.4, 30, 0.8, P, 16), { tone: "mid" }));
  const coil = spring(3.4, 30.8, 38.6, 5);
  out.push(L(coil.back, { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 2.2, 30.8, 8, P, 14), { tone: "mid", crease: "none" }));
  out.push(L(coil.front, { tone: "mid" }));
  out.push(
    S(k.cylinder(0, 0, 3.8, 38.6, 2.6, P, 16), {
      tone: "mid",
      inner: L(k.knurl(0, 0, 3.8, 38.6, 41.2, 20, P), { tone: "faint" }),
    }),
  );
  const ball = 48;
  const ballR = 5.6;
  const neckTop = ball - Math.sqrt(ballR * ballR - 2.4 * 2.4);
  out.push(S(k.cylinder(0, 0, 2.4, 41.2, neckTop - 41.2, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(G.sphereOf([0, 0, ball], ballR, P), { tone: "hi" }));
  return out.join("");
}

const { moment } = E;
const restPose = M.pose(moment);
const place = (point) => transform(offsetOf(point, P));
// The slip shows only outside the case's right face: inside it, it is in the slot.
const slotClip = k.pathOf(
  [
    [RIGHT, -400, SLOT.z0],
    [RIGHT, 400, SLOT.z0],
    [RIGHT + 400, 400, SLOT.z0],
    [RIGHT + 400, -400, SLOT.z0],
  ].map(at),
  true,
);
const imprint = k.faceTextSvg(
  k.topMatrix([-4.6, -3.6], M.slip.h, P),
  M.digitsOf(M.entryOf(BOOK.next, 0)),
  { size: 3.8, tone: "hi" },
);
const lensAt = place([restPose.lens, 0, 0]);
const parts = [
  bench(),
  spike(),
  blotter(),
  rack(),
  countingBoard(),
  caseBack(),
  ledgerBook(restPose.posted, restPose.feed),
  caseFront(),
  padlock(),
  `<g data-part="lens" transform="${lensAt}">${lensAssembly()}</g>`,
  post(RAIL.x0),
  rail(),
  `<g data-part="carriage" transform="${lensAt}">${carriage()}</g>`,
  post(RAIL.x1),
  inkwell(),
  pen(),
  feedTray(),
  `<clipPath id="${NAME}-slot"><path d="${slotClip}"/></clipPath>`,
  `<g clip-path="url(#${NAME}-slot)"><g data-part="slip" transform="${place(restPose.slip ?? M.slip.feed)}"${restPose.slip === null ? ' display="none"' : ""}>${slipAtOrigin}` +
    `<g data-part="imprint"${restPose.inked ? "" : ' display="none"'}>${imprint}</g></g></g>`,
  guide(TRAY.y + TRAY.d - 2),
  slotHood(),
  dispenser(),
  inkPad(),
  `<g data-part="stamp" transform="${place(restPose.stamp)}">${stampAtOrigin(
    M.entryOf(BOOK.next, 0) + (restPose.struck ? 1 : 0),
    restPose.turn,
  )}</g>`,
];
E.write(parts, moment);
