// Draws How We Work's figure, a drafting pantograph (see `src/figures/pantograph-model.ts`), and
// writes it to `src/figures/pantograph.svg`. Run: node scripts/figures/pantograph.mjs [--preview]
// (see `engrave.mjs`).
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/pantograph-model.ts";
import { offsetOf, translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "pantograph";
const { linkage: LK } = M;
const BOARD = { x: -172, y: -122, w: 272, d: 258, r: 5 };
const BOARD_H = 8;
const FOOT_H = 7;
/** The original sheet, and the copy table: a plate with rails, the pad and the tray in front. */
const ORIGINAL = { x: -92, y: -31, w: 66, d: 50, r: 0.6 };
const TABLE = { x: -25, y: -52, w: 118, d: 181, r: 1.5 };
const TABLE_H = 1.2;
const RAIL_H = 3;
const PAD_TOP = M.copyTop - 0.4;
const SHEET = { x: -20, y: -46, w: 108, d: 80, r: 0.6 };
/** The joints' eyes: the lower arms' and the upper arms', bottom to top. */
const LOW = [LK.low - LK.r, LK.low + LK.r];
const HIGH = [LK.high - LK.r, LK.high + LK.r];
/** The pencil's sleeve, below and above the upper eye. */
const SLEEVE = { bottom: 8.5, top: HIGH[1] + 4.4, r: 2.6 };

const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  points: [
    ...k.boxCorners(BOARD, -BOARD_H - FOOT_H, 0),
    [-60, -112, 24],
    [-30, -40, 24],
    [-10, -36, 36],
    [78, 24, 36],
  ],
});
const { P, at, S, L, D, up, byDepth, shadow, shadowOf } = E;

/** A turned part standing up at the world origin: pins, eyes and knobs that the live code places. */
const post = (r, z0, z1, style = {}, steps = 28) =>
  S(k.cylinder(0, 0, r, z0, z1 - z0, P, steps, 0.3), { tone: "hi", ...style });

/** A knurled thumbscrew head from `z`, its washer under it. */
function thumbscrew(x, y, z, r = 2.5) {
  return (
    S(k.cylinder(x, y, r - 0.4, z, 0.4, P, 20), { tone: "mid", crease: "none" }) +
    S(k.cylinder(x, y, r, z + 0.4, 2.2, P, 28, 0.3), {
      tone: "hi",
      inner: L(k.knurl(x, y, r, z + 0.6, z + 2.4, 18, P), { tone: "faint" }),
    }) +
    D([at([x, y, z + 2.6])], { size: 0.5 })
  );
}

function board() {
  const out = [shadow(k.slabOf(k.insetPlan(BOARD, -2), -BOARD_H - FOOT_H, 0.01, P).fill)];
  for (const [x, y] of byDepth(k.corners(BOARD, 20))) {
    out.push(S(k.cylinder(x, y, 8, -BOARD_H - FOOT_H, 2, P, 32), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, 6, -BOARD_H - FOOT_H + 2, FOOT_H - 2, P, 28), { tone: "mid" }));
  }
  const seam = k.sideSeam(BOARD, -BOARD_H / 2, P, 8);
  out.push(
    S(k.slabOf(BOARD, -BOARD_H, BOARD_H, P, 8, 1.4), {
      tone: "hi",
      inner: L(seam, { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(BOARD, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(BOARD, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "faint" }));
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, 0])),
      { size: 0.5 },
    ),
  );
  // A ruler strip along the left edge, behind the pivot, its ticks growing from its outer edge.
  const strip = { x: BOARD.x + 8, y: BOARD.y + 12, w: 6, d: 84, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(
    strip.y + 3,
    strip.y + strip.d - 3,
    3,
    5,
    strip.x,
    0.6,
    [1.8, 3.4],
    P,
    "y",
  );
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 3, strip.y + 1.5, 0.6]), at([strip.x + 3, strip.y + strip.d - 1.5, 0.6])], {
      size: 0.4,
    }),
  );
  // The maker's plate, at the back on the right.
  const plate = { x: 34, y: BOARD.y + 8, w: 34, d: 12, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P), { tone: "faint" }));
  out.push(
    L(
      [
        [plate.y + 4, 22],
        [plate.y + 6.5, 16],
        [plate.y + 9, 19],
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

/** The tin of drawing pins, at the back on the right, its lid on. */
function tin() {
  const [x, y] = [82, -108];
  return (
    shadow(k.cylinder(x + 2, y - 1, 9, 0, 0.01, P, 40).fill) +
    S(k.cylinder(x, y, 8, 0, 5, P, 48, 0.4), { tone: "mid" }) +
    S(k.cylinder(x, y, 8.4, 5, 2, P, 48, 0.4), {
      tone: "hi",
      inner: L(k.knurl(x, y, 8.4, 5.2, 6.8, 40, P), { tone: "faint" }),
    }) +
    L(k.ring(x, y, 5.4, 7, P, 36), { tone: "faint" })
  );
}

/** A drawing pin at a sheet's corner. */
function pin(x, y, z) {
  return (
    S(k.cylinder(x, y, 2.2, z, 0.5, P, 24), { tone: "mid", crease: "none" }) +
    S(k.cylinder(x, y, 1.2, z + 0.5, 0.7, P, 18), { tone: "hi" }) +
    D([at([x, y, z + 1.2])], { size: 0.4 })
  );
}

/** A title block in a sheet's near corner: a frame and two lines standing for its words. */
function titleBlock(plan, z) {
  const block = { x: plan.x + plan.w - 22, y: plan.y + plan.d - 8, w: 19, d: 5.5, r: 0 };
  return (
    L(k.planOutline(block, z, P, 1), { tone: "lo" }) +
    L(
      [
        [block.y + 1.8, 13],
        [block.y + 3.8, 9],
      ]
        .map(([y, length]) => k.lineOnTop([block.x + 2, y], [block.x + 2 + length, y], z, P))
        .join(""),
      { tone: "faint", free: true },
    )
  );
}

function original() {
  const out = [];
  out.push(S(k.slabOf(ORIGINAL, 0, M.originalTop, P, 2), { tone: "mid", crease: "none" }));
  // The requirement: a box and the two it asks for, joined, engraved on the sheet.
  out.push(L(k.onTop(M.route, M.originalTop, P), { tone: "mid" }));
  out.push(titleBlock(ORIGINAL, M.originalTop));
  for (const [x, y] of byDepth(k.corners(ORIGINAL, 3.5))) out.push(pin(x, y, M.originalTop));
  return out.join("");
}

/** A copy sheet on the pad: its paper, title block, and the copy if it is drawn. */
function sheet(copy) {
  return (
    S(k.slabOf(SHEET, PAD_TOP, 0.4, P, 2), { tone: "mid", crease: "none" }) +
    titleBlock(SHEET, M.copyTop) +
    (copy ? L(M.copyPath(P), { tone: "mid" }) : "")
  );
}

/** A stack of sheets under the top one, its edges showing as seams. */
function stack(plan) {
  const seam = [1.6, 2].map((z) => k.sideSeam(plan, z, P, 2)).join("");
  return S(k.slabOf(plan, TABLE_H, PAD_TOP - TABLE_H, P, 2), {
    tone: "mid",
    crease: "none",
    inner: L(seam, { tone: "faint" }),
  });
}

const tray = { ...SHEET, y: SHEET.y + M.slide };

function tableBack() {
  const out = [shadowOf(TABLE, 0, 3)];
  out.push(S(k.slabOf(TABLE, 0, TABLE_H, P, 3, 0.4), { tone: "mid" }));
  const rail = (x) => ({ x, y: TABLE.y, w: 3, d: TABLE.d, r: 0.8 });
  out.push(S(k.slabOf(rail(TABLE.x), TABLE_H, RAIL_H, P, 2, 0.3), { tone: "mid" }));
  // The back stop the pad is squared against, screwed to both rails' ends.
  const stop = { x: TABLE.x + 3, y: TABLE.y, w: TABLE.w - 6, d: SHEET.y - TABLE.y, r: 0.4 };
  out.push(S(k.slabOf(stop, TABLE_H, RAIL_H, P, 2, 0.3), { tone: "mid" }));
  out.push(
    D(
      [TABLE.x + 1.5, TABLE.x + TABLE.w - 1.5].map((x) => at([x, TABLE.y + 3, TABLE_H + RAIL_H])),
      { size: 0.45 },
    ),
  );
  out.push(stack(SHEET), sheet(false));
  out.push(
    stack(tray),
    `<g transform="${transform(offsetOf([0, M.slide, 0], P))}">${sheet(true)}</g>`,
  );
  return out.join("");
}

function tableFront() {
  const out = [];
  const right = { x: TABLE.x + TABLE.w - 3, y: TABLE.y, w: 3, d: TABLE.d, r: 0.8 };
  out.push(S(k.slabOf(right, TABLE_H, RAIL_H, P, 2, 0.3), { tone: "mid" }));
  out.push(
    D(
      [TABLE.y + 3, TABLE.y + TABLE.d / 2, TABLE.y + TABLE.d - 3].map((y) =>
        at([right.x + 1.5, y, TABLE_H + RAIL_H]),
      ),
    ),
  );
  const lip = { x: TABLE.x, y: TABLE.y + TABLE.d - 3, w: TABLE.w, d: 3, r: 0.8 };
  out.push(S(k.slabOf(lip, TABLE_H, RAIL_H, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

function tSquare() {
  const out = [];
  const stock = { x: -164, y: BOARD.y + BOARD.d, w: 44, d: 5, r: 1 };
  const blade = { x: -152, y: 34, w: 16, d: BOARD.y + BOARD.d + 5 - 34, r: 0.6 };
  out.push(S(k.slabOf(blade, 0, 1.2, P, 2, 0.3), { tone: "mid" }));
  const ticks = k.topTicks(
    blade.y + 4,
    blade.y + blade.d - 9,
    3,
    5,
    blade.x,
    1.2,
    [1.8, 3.2],
    P,
    "y",
  );
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    S(k.slabOf(stock, -BOARD_H - 1, BOARD_H + 2.2, P, 3, 0.4), {
      tone: "hi",
      inner: L(k.sideSeam(stock, -BOARD_H / 2, P, 3), { tone: "faint" }),
    }),
  );
  out.push(
    D(
      [-158, -144, -130].map((x) => at([x, stock.y + 2.5, 1.2])),
      { size: 0.45 },
    ),
  );
  return out.join("");
}

function setSquare() {
  const [x, y] = [-122, 44];
  const outer = [
    [x, y],
    [x + 54, y + 54],
    [x, y + 54],
  ];
  const inner = [
    [x + 9, y + 21],
    [x + 31, y + 43],
    [x + 9, y + 43],
  ];
  const out = [S(k.extrude(outer, 0, 1, P), { tone: "mid" })];
  out.push(`<path class="iso-paper" d="${k.onTop(inner, 1, P, true)}"/>`);
  // The cut's far walls show inside it, down to the board.
  out.push(
    `<path fill="url(#${NAME}-h1)" d="${k.pathOf(
      [inner[0], inner[1]]
        .flatMap(([px, py]) => [at([px, py, 1])])
        .concat([at([inner[1][0], inner[1][1], 0]), at([inner[0][0], inner[0][1], 0])]),
      true,
    )}"/>`,
  );
  out.push(L(k.onTop(inner, 1, P, true), { tone: "lo" }));
  return out.join("");
}

/** The pencil tray in front: a trough with two pencils and an eraser. */
function pencilTray() {
  const plan = { x: -96, y: 110, w: 62, d: 14, r: 2 };
  const out = [shadowOf(plan, 0, 3)];
  out.push(S(k.slabOf(plan, 0, 3.4, P, 3, 0.5), { tone: "mid" }));
  const well = k.insetPlan(plan, 1.6);
  out.push(
    `<path class="iso-paper" d="${k.onTop(k.ringOf(well, 3), 3.4, P, true)}" fill="url(#${NAME}-h2)"/>`,
  );
  out.push(L(k.planOutline(well, 3.4, P, 3), { tone: "lo" }));
  for (const [y, from, to] of [
    [114.5, -91, -50],
    [119.5, -84, -40],
  ]) {
    const F = G.frameOf([from, y, 2.9], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const body = to - from;
    out.push(
      S(
        G.solidOf(
          [
            [0, 0.2],
            [3, 1.1],
            [body - 2.4, 1.1],
            [body - 2.4, 1.2],
            [body, 1.2],
          ],
          F,
          P,
          { smooth: false, steps: 20 },
        ),
        { tone: "hi" },
      ),
    );
  }
  out.push(S(k.slabOf({ x: -48, y: 112.5, w: 9, d: 5, r: 1 }, 1.8, 3, P, 3), { tone: "mid" }));
  return out.join("");
}

/** The pivot's clamp: a plate over the board's edge, its screws, and the pedestal the arm turns on. */
function pivotBase() {
  const [x, y] = LK.pivot;
  const plate = { x: BOARD.x - 4, y: y - 14, w: 36, d: 28, r: 2 };
  const out = [shadowOf({ ...plate, x: BOARD.x }, 0, 3)];
  out.push(S(k.slabOf(plate, 0, 2.4, P, 3, 0.5), { tone: "mid" }));
  out.push(
    D(
      k.corners(plate, 4).map(([px, py]) => at([px, py, 2.4])),
      { size: 0.5 },
    ),
  );
  // The clamp's screw, down through the plate's overhang into the jaw under the board.
  out.push(thumbscrew(BOARD.x - 0.5, y - 8, 2.4, 2.2));
  out.push(S(k.cylinder(x, y, 7, 2.4, 1.6, P, 40, 0.4), { tone: "mid" }));
  out.push(
    S(k.cylinder(x, y, 4, 4, LOW[0] - 4, P, 32), {
      tone: "mid",
      crease: "none",
      inner: L(k.sideArc(x, y, 4, 5.8, P, 20), { tone: "faint" }),
    }),
  );
  return out.join("");
}

/** The jaw that hangs down the board's left edge, behind the board. */
function pivotJaw() {
  const [, y] = LK.pivot;
  const spine = { x: BOARD.x - 4, y: y - 14, w: 4, d: 28, r: 1 };
  return S(k.slabOf(spine, -BOARD_H - 4, BOARD_H + 4, P, 2), { tone: "mid" });
}

// Everything that rides on the linkage, built at the world origin and placed by the live code.

/** The ball castor that carries the elbow on the board. */
const castor =
  shadow(k.cylinder(1.6, -0.8, 2.6, 0, 0.01, P, 20).fill) +
  S(G.sphereOf([0, 0, 2.2], 2.2, P), { tone: "hi" }) +
  post(2.9, 2.8, 5.4, { tone: "mid" }) +
  post(1.3, 5.4, LOW[0], { tone: "mid", crease: "none" }, 16);

/** An eye round a joint on the lower arms. */
const lowEye =
  post(LK.eye, LOW[0], LOW[1], { tone: "hi" }, 32) +
  post(2.2, LOW[1], HIGH[0], { tone: "mid", crease: "none" }, 20);
/** An eye on the upper arms, with its pivot screw. */
const highEye = post(LK.eye, HIGH[0], HIGH[1], { tone: "hi" }, 32) + thumbscrew(0, 0, HIGH[1]);

/** The stylus's point, under the arms. */
const stylusPoint = S(
  G.solidOf(
    [
      [0, 0.12],
      [2.6, 0.9],
      [LOW[0] - M.originalTop, 0.9],
    ],
    up(0, 0, M.originalTop),
    P,
    { smooth: false, steps: 16 },
  ),
  { tone: "hi" },
);
/** The stylus's head over the upper eye: a collar, its shank and the knurled knob. */
const stylusHead =
  post(LK.eye, HIGH[0], HIGH[1], { tone: "hi" }, 32) +
  post(2.2, HIGH[1], HIGH[1] + 1.4, { tone: "mid" }, 20) +
  post(1, HIGH[1] + 1.4, HIGH[1] + 6, { tone: "mid", crease: "none" }, 12) +
  S(k.cylinder(0, 0, 3.2, HIGH[1] + 6, 4.6, P, 32, 0.4), {
    tone: "hi",
    inner: L(k.knurl(0, 0, 3.2, HIGH[1] + 6.2, HIGH[1] + 10.4, 22, P), { tone: "faint" }),
  }) +
  D([at([0, 0, HIGH[1] + 10.6])], { size: 0.55 });

/** The pencil below its sleeve: its point and the wood, which slide up into the sleeve when lifted. */
const pencilPoint = S(
  G.solidOf(
    [
      [0, 0.15],
      [2, 1.1],
      [SLEEVE.bottom + 1.5 - M.copyTop, 1.1],
    ],
    up(0, 0, M.copyTop),
    P,
    { smooth: false, steps: 20 },
  ),
  { tone: "hi", lit: true },
);
/** The sleeve that holds the pencil at the end of the arm, with its locking screw. */
const sleeveLow = post(SLEEVE.r, SLEEVE.bottom, HIGH[0], { tone: "mid" }, 28);
const sleeveHigh =
  post(LK.eye, HIGH[0], HIGH[1], { tone: "hi" }, 32) +
  S(k.cylinder(0, 0, SLEEVE.r, HIGH[1], SLEEVE.top - HIGH[1], P, 28, 0.3), {
    tone: "mid",
    inner: L(k.sideArc(0, 0, SLEEVE.r, HIGH[1] + 1.6, P, 16), { tone: "faint" }),
  }) +
  S(k.slabOf({ x: -0.9, y: SLEEVE.r - 0.4, w: 1.8, d: 1.6, r: 0.3 }, HIGH[1] + 1.8, 1.6, P, 2), {
    tone: "mid",
  }) +
  S(
    G.disc(
      0,
      2,
      1.4,
      G.frameOf([0, SLEEVE.r + 1.2, HIGH[1] + 2.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]),
      P,
    ),
    {
      tone: "hi",
    },
  );
/** The pencil above its sleeve: it slides out of the sleeve's top as the pencil lifts. */
function pencilTop(lift) {
  const F = up(0, 0, SLEEVE.top);
  const reach = 10;
  const rod = G.rodOut(F, 0, reach, 1.1, P, { stroke: LK.lift, steps: 20 });
  const hold = lift === 0 ? "" : ` transform="${transform(offsetOf([0, 0, -lift], P))}"`;
  return (
    `<clipPath id="${NAME}-lead"><path data-hold${hold} d="${rod.clip}"/></clipPath>` +
    `<g clip-path="url(#${NAME}-lead)">${S(rod.paths, { tone: "hi", lit: true, crease: "none" })}</g>` +
    S(k.cylinder(0, 0, 1.25, SLEEVE.top + reach, 1.8, P, 16), {
      tone: "mid",
      inner: L(k.sideArc(0, 0, 1.25, SLEEVE.top + reach + 0.9, P, 12), { tone: "faint" }),
    }) +
    post(1.05, SLEEVE.top + reach + 1.8, SLEEVE.top + reach + 3.4, { tone: "mid" }, 16)
  );
}

const { moment } = E;
const restPose = M.pose(moment);
const live = M.liveParts(restPose, P);
const placed = (part, offset, svg) =>
  `<g data-part="${part}" transform="${transform(offset)}">${svg}</g>`;
const arm = (part) =>
  `<path data-part="${part}" class="iso-fill" d="${live[part].body}"/>` +
  `<path data-part="${part}-shade" fill="url(#${NAME}-h1)" d="${live[part].shade}"/>` +
  `<path data-part="${part}-edges" class="iso-line" data-tone="hi" d="${live[part].edges}"/>`;
const sheetShown = restPose.filed === null ? ' display="none"' : "";

const parts = [
  pivotJaw(),
  board(),
  tin(),
  original(),
  tableBack(),
  // The copy the pencil is drawing: while it draws, its first stroke starts on the bare sheet.
  `<path data-part="ink" class="iso-line" data-tone="mid" data-free="start" d="${live.ink}"/>`,
  `<g data-part="sheet" transform="${transform(live.sheet)}"${sheetShown}>${sheet(true)}</g>`,
  tableFront(),
  tSquare(),
  setSquare(),
  pencilTray(),
  pivotBase(),
  placed("elbow", live.elbow, castor),
  placed("tracer", live.tracer, stylusPoint),
  placed("lead", live.lead, pencilPoint),
  placed("pencil", live.pencil, sleeveLow),
  arm("oa"),
  arm("de"),
  `<g transform="${transform(offsetOf([...LK.pivot, 0], P))}">${lowEye}</g>`,
  placed("elbow", live.elbow, lowEye),
  placed("near", live.near, lowEye),
  placed("far", live.far, lowEye),
  placed("tracer", live.tracer, lowEye),
  arm("ac"),
  arm("be"),
  `<g transform="${transform(offsetOf([...LK.pivot, 0], P))}">${thumbscrew(0, 0, HIGH[0])}</g>`,
  placed("elbow", live.elbow, highEye),
  placed("near", live.near, highEye),
  placed("far", live.far, highEye),
  placed("tracer", live.tracer, stylusHead),
  placed("pencil", live.pencil, sleeveHigh),
  placed("lead", live.lead, pencilTop(restPose.lift)),
];
E.write(parts, moment);
