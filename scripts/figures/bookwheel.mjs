// Draws the About page's figure, Ramelli's book wheel (see `src/figures/bookwheel-model.ts`), and
// writes it to `src/figures/bookwheel.svg`.
// Run: node scripts/figures/bookwheel.mjs [--preview] (see `engrave.mjs`).
//
// Painting order. The lecterns hang between the wheel's two side frames, so along every line of
// sight the far frame lies behind every lectern and the near frame in front of it, whatever the
// wheel's angle. The far standard, the far frame (spokes, rim, hub) and the axle come first, then
// the eight lecterns, then the near frame, its gears and the pins' ends, and the near standard.
// From this camera no two lecterns ever overlap on the page, at any angle (`lecternsApart` checks
// it on every build), so they need no order among themselves while they go round.
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import * as M from "../../src/figures/bookwheel-model.ts";
import { translate as transform } from "../../src/figures/projection.ts";
import { engraver } from "./engrave.mjs";

const NAME = "bookwheel";
const { wheel: W, gears: GE, face: FACE } = M;
const TAU = 2 * Math.PI;

/** The floor platform the machine and the reader's things stand on, on four feet. */
const PLATFORM = { x: -262, y: -84, w: 446, d: 212, r: 6 };
const PLATFORM_H = 10;
const FOOT_H = 6;
/** The two A-shaped standards stand this far either side of the wheel's centre plane. */
const STAND_Y = 60;
/** Each standard's sill on its bun feet, and the legs' feet on it. */
const SILL = { half: 134, d: 16, feet: 4, h: 12 };
const SILL_TOP = SILL.feet + SILL.h;
const LEG = { spread: 112, w: 10, d: 8 };
/** The bearing block at the top of each standard, round the fixed axle. */
const BLOCK = { w: 22, d: 11, below: 11, above: 12 };
const AXLE_R = 5;
/** The legs meet under the bearing block. */
const LEG_TOP = W.z - BLOCK.below + 2;

/**
 * A lectern in its own frame, its pivot at the origin: x toward the reader, z up. The reading board
 * runs from its foot `B0` up to `B1`, its face turned to the reader.
 */
const B0 = [-25, -54];
const B1 = [-3, -15];
const SLOPE = Math.hypot(B1[0] - B0[0], B1[1] - B0[1]);
const UP = [(B1[0] - B0[0]) / SLOPE, (B1[1] - B0[1]) / SLOPE];
const OUT = [-UP[1], UP[0]];
/** A point on the board's plane in x, z: `along` up the slope from its foot, `out` off its face. */
const onBoard = (along, out) => [
  B0[0] + UP[0] * along + OUT[0] * out,
  B0[1] + UP[1] * along + OUT[1] * out,
];
const CHEEK = { inner: W.span / 2 - 3, outer: W.span / 2 - 1 };
/** A cheek's outline in x, z: a boss round the pivot, its edges just proud of the board and book. */
const CHEEK_RING = G.hullOf([
  ...Array.from({ length: 10 }, (_, index) => [
    Math.cos((index / 10) * TAU) * 5.5,
    Math.sin((index / 10) * TAU) * 5.5,
  ]),
  onBoard(-3, 5.5),
  onBoard(-3, -3.5),
  onBoard(SLOPE, 3.5),
  onBoard(SLOPE, -3.5),
]);

const E = engraver(NAME, {
  ...M.view,
  rest: M.rest,
  pad: 12,
  points: [
    ...k.boxCorners(PLATFORM, -PLATFORM_H - FOOT_H, 0),
    ...[-FACE, FACE].flatMap((y) =>
      Array.from({ length: 48 }, (_, index) => {
        const a = (index / 48) * TAU;
        return [Math.cos(a) * W.tyre, y, W.z + Math.sin(a) * W.tyre];
      }),
    ),
    ...Array.from({ length: 48 }, (_, index) => {
      const a = (index / 48) * TAU;
      const x = Math.cos(a) * W.r;
      const z = W.z + Math.sin(a) * W.r;
      return [
        [x + B0[0] - 4, FACE + 3, z + B0[1] - 4],
        [x + 6, -FACE, z + 6],
      ];
    }).flat(),
  ],
});
const { P, at, S, L, D, shadow, shadowOf, byDepth } = E;

/** A frame along +y through `o`: the wheel, the axle, the lecterns' prisms (polygons in x, z). */
const alongY = (o) => G.frameOf(o, [0, 1, 0], [1, 0, 0], [0, 0, 1]);
/** A frame standing up at a point, for turned things on the floor. */
const upAt = (x, y, z) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const line3 = (points) => k.pathOf(points.map(at));
/** A point in a frame's own coordinates: `s` along its axis, `u` and `v` across it. */
const inFrame = (F, s, u, v) => [
  F.o[0] + F.a[0] * s + F.u[0] * u + F.v[0] * v,
  F.o[1] + F.a[1] * s + F.u[1] * u + F.v[1] * v,
  F.o[2] + F.a[2] * s + F.u[2] * u + F.v[2] * v,
];
const placed = (part, offset, svg) =>
  `<g data-part="${part}" transform="${transform(offset)}">${svg}</g>`;

/** A small seeded generator (mulberry32), so every build rules the same lines. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), 1 | state);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Twice the signed area of a screen polygon: its winding. */
const areaOf = (ring) =>
  ring.reduce((sum, [x, y], index) => {
    const [nx, ny] = ring[(index + 1) % ring.length];
    return sum + x * ny - nx * y;
  }, 0);

/** The part of polygon `subject` inside convex polygon `clip` (screen points). */
function clipped(subject, clip) {
  const sign = Math.sign(areaOf(clip));
  let out = subject;
  for (let index = 0; index < clip.length && out.length > 0; index++) {
    const [ax, ay] = clip[index];
    const [bx, by] = clip[(index + 1) % clip.length];
    const side = ([x, y]) => sign * ((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    const next = [];
    for (let j = 0; j < out.length; j++) {
      const p = out[j];
      const q = out[(j + 1) % out.length];
      const sp = side(p);
      const sq = side(q);
      if (sp >= 0) next.push(p);
      if (sp >= 0 !== sq >= 0) {
        const t = sp / (sp - sq);
        next.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
    out = next;
  }
  return out;
}

/** Whether a screen point lies inside a convex screen polygon. */
const within = (point, ring) => {
  const sign = Math.sign(areaOf(ring));
  return ring.every(([ax, ay], index) => {
    const [bx, by] = ring[(index + 1) % ring.length];
    return sign * ((bx - ax) * (point[1] - ay) - (by - ay) * (point[0] - ax)) >= 0;
  });
};

/**
 * A circle of radius `r` about the frame's axis at `s`, on the page: a 72-gon, under a fifth of a
 * pixel from the circle at the wheel's size.
 */
const circleAt = (F, s, r) =>
  Array.from({ length: 72 }, (_, index) => at(G.pointOf(F, s, r, (index / 72) * TAU)));

/**
 * A ring turned about the frame's axis from `s0` to `s1` (the nearer face), open in the middle: a
 * side frame's rim. The bore shows what lies behind it, edged by the near face's inner circle and
 * the far edge of the bore; `seam` is drawn on its face. Its outline and edges are 72-gons rather
 * than the kit's finer outline, which would make the two rims a third of the figure's bytes.
 */
function annulus(F, s0, s1, rIn, rOut, seam) {
  const paths = G.ringBand(s0, s1, rIn, rOut, F, P, { steps: 48 });
  const near = circleAt(F, s1, rIn);
  const far = circleAt(F, s0, rIn);
  const hull = k.pathOf(G.hullOf([...circleAt(F, s0, rOut), ...circleAt(F, s1, rOut)]), true);
  const runs = [[]];
  for (const point of [...far, far[0]]) {
    if (within(point, near)) runs[runs.length - 1].push(point);
    else if (runs[runs.length - 1].length > 0) runs.push([]);
  }
  const bore = runs
    .filter((run) => run.length > 1)
    .map((run) => k.pathOf(run))
    .join("");
  return S(
    {
      ...paths,
      fill: hull + k.pathOf(clipped(far, near), true),
      outline: hull,
      crease: k.pathOf(circleAt(F, s1, rOut), true),
    },
    {
      tone: "mid",
      inner:
        L(k.pathOf(near, true), { tone: "lo" }) +
        L(bore, { tone: "faint" }) +
        L(seam, { tone: "faint" }),
    },
  ).replace('class="iso-fill"', 'class="iso-fill" fill-rule="evenodd"');
}

function platform() {
  const out = [shadow(k.slabOf(k.insetPlan(PLATFORM, -2), -PLATFORM_H - FOOT_H, 0.01, P).fill)];
  // The farthest foot hides wholly behind the platform.
  for (const [x, y] of byDepth(k.corners(PLATFORM, 20)).slice(1))
    out.push(S(k.cylinder(x, y, 8, -PLATFORM_H - FOOT_H, FOOT_H, P, 12, 0.4), { tone: "mid" }));
  out.push(
    S(k.slabOf(PLATFORM, -PLATFORM_H, PLATFORM_H, P, 6, 1.4), {
      tone: "hi",
      inner: L(k.sideSeam(PLATFORM, -PLATFORM_H / 2, P, 6), { tone: "faint" }),
    }),
  );
  const groove = k.insetPlan(PLATFORM, 5);
  out.push(L(k.planOutline(groove, 0, P, 6), { tone: "faint" }));
  // Floorboards: seams along x from groove to groove.
  out.push(
    L(
      [-38, 6, 50, 94]
        .map((y) => k.lineOnTop([groove.x, y], [groove.x + groove.w, y], 0, P))
        .join(""),
      { tone: "faint" },
    ),
  );
  const screws = k.corners(PLATFORM, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "faint" }));
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, 0])),
      { size: 0.5 },
    ),
  );
  // A ruler strip along the front edge, its ticks hanging from the strip's back edge.
  const strip = { x: -150, y: PLATFORM.y + PLATFORM.d - 13, w: 154, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 2), { tone: "mid", crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "faint" }), L(ticks.major, { tone: "lo" }));
  out.push(
    D([at([strip.x + 1.5, strip.y + 3, 0.6]), at([strip.x + strip.w - 1.5, strip.y + 3, 0.6])], {
      size: 0.4,
    }),
  );
  // The maker's plate in the front corner, its three rule lines standing for the inscription.
  const plate = { x: 136, y: PLATFORM.y + PLATFORM.d - 24, w: 30, d: 14, r: 1.5 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(
    L(
      [
        [plate.y + 4.5, 19],
        [plate.y + 7, 13],
        [plate.y + 9.5, 16],
      ]
        .map(([y, length]) => k.lineOnTop([plate.x + 6, y], [plate.x + 6 + length, y], 0.8, P))
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

/** A standard's sill on its bun feet, along x under the standard at `y`. */
function sill(y) {
  const plan = { x: -SILL.half, y: y - SILL.d / 2, w: 2 * SILL.half, d: SILL.d, r: 1.5 };
  const out = [shadowOf(plan, 0, 3)];
  for (const x of [-SILL.half + 12, SILL.half - 12])
    out.push(S(k.cylinder(x, y, 6, 0, SILL.feet, P, 14, 0.3), { tone: "mid" }));
  out.push(
    S(k.slabOf(plan, SILL.feet, SILL.h, P, 2, 0.6), {
      tone: "mid",
      inner: L(k.sideSeam(plan, SILL.feet + 3, P, 2), { tone: "faint" }),
    }),
  );
  out.push(
    D(
      [-SILL.half + 4, SILL.half - 4].map((x) => at([x, y, SILL_TOP])),
      { size: 0.5 },
    ),
  );
  return out.join("");
}

/** The two stretchers that tie the sills together under the wheel, pegged into them. */
function stretchers() {
  return [-90, 90]
    .map((x) => {
      const plan = { x: x - 5, y: -STAND_Y + SILL.d / 2, w: 10, d: 2 * STAND_Y - SILL.d, r: 1 };
      return (
        shadowOf(plan, 0, 2) +
        S(k.slabOf(plan, SILL.feet + 2, 8, P, 2, 0.5), { tone: "mid" }) +
        D(
          [plan.y + 2.5, plan.y + plan.d - 2.5].map((y) => at([x, y, SILL.feet + 10])),
          { size: 0.45 },
        )
      );
    })
    .join("");
}

/** The x of a standard's leg centre at height `z`, on the side `side` (-1 or 1). */
const legX = (side, z) =>
  side * (LEG.spread + (4 - LEG.spread) * ((z - SILL_TOP) / (LEG_TOP - SILL_TOP)));

/** An A-shaped standard at `y`: a crossbar, two legs, the bearing block and its brass cap. */
function standard(y) {
  const out = [];
  const F = alongY([0, y - LEG.d / 2, 0]);
  // The crossbar sits between the legs, its ends in them.
  const barZ = 88;
  const reach = legX(1, barZ + 8);
  out.push(
    S(k.slabOf({ x: -reach, y: y - 3, w: 2 * reach, d: 6, r: 0.6 }, barZ, 8, P, 1, 0.4), {
      tone: "mid",
    }),
  );
  for (const side of [1, -1]) {
    const foot = side * LEG.spread;
    const head = side * 4;
    const half = LEG.w / 2;
    const polygon = [
      [foot - half, SILL_TOP],
      [foot + half, SILL_TOP],
      [head + half, LEG_TOP],
      [head - half, LEG_TOP],
    ];
    out.push(S(G.prismOf(F, polygon, 0, LEG.d, P), { tone: "mid" }));
    // A trenail through the leg where the crossbar meets it.
    out.push(D([at([legX(side, barZ + 4), y + LEG.d / 2, barZ + 4])], { size: 0.55 }));
  }
  const block = { x: -BLOCK.w / 2, y: y - BLOCK.d / 2, w: BLOCK.w, d: BLOCK.d, r: 1 };
  out.push(
    S(k.slabOf(block, W.z - BLOCK.below, BLOCK.below + BLOCK.above, P, 2, 0.6), {
      tone: "mid",
      inner: L(k.sideSeam(block, W.z, P, 2), { tone: "faint" }),
    }),
  );
  // The brass cap over the bearing, held down by two screws.
  const cap = k.insetPlan(block, 1.5);
  const top = W.z + BLOCK.above + 2;
  out.push(S(k.slabOf(cap, W.z + BLOCK.above, 2, P, 2, 0.4), { tone: "hi" }));
  out.push(
    D(
      [cap.x + 2.5, cap.x + cap.w - 2.5].map((x) => at([x, y, top])),
      { size: 0.55 },
    ),
  );
  return out.join("");
}

/** The fixed axle from `y0` to `y1`. */
const axle = (y0, y1) =>
  S(G.disc(y0, y1, AXLE_R, alongY([0, 0, W.z]), P, { steps: 20 }), { tone: "mid" });

/** The axle's end outside the near standard: a washer, a knurled nut and its pin. */
function axleEnd(y) {
  const F = alongY([0, 0, W.z]);
  const nut = [y + 1.2, y + 5.2];
  return (
    S(G.disc(y, nut[0], 8, F, P, { steps: 28 }), { tone: "mid" }) +
    S(G.disc(nut[0], nut[1], 6, F, P, { steps: 28 }), {
      tone: "mid",
      inner: L(G.ribsOf(F, nut[0], nut[1], 6, 28, P), { tone: "faint" }),
    }) +
    S(G.disc(nut[1], nut[1] + 1.6, 2.4, F, P, { steps: 14 }), { tone: "hi" }) +
    D([at([0, nut[1] + 1.6, W.z])], { size: 0.6 })
  );
}

const rodParts = (name, paths, tone = "mid") =>
  `<path data-part="${name}" class="iso-fill" d="${paths.body}"/>` +
  `<path data-part="${name}-shade" fill="url(#${NAME}-h1)" d="${paths.shade}"/>` +
  `<path data-part="${name}-edges" class="iso-line" data-tone="${tone}" d="${paths.edges}"/>`;

/**
 * A side frame of the wheel between `y0` and `y1`: its spokes (live), the rim bound by its iron
 * tyre (one ring, the tyre's edge a line on the face), the rim's bolts, the felloes' joints over
 * the spokes (live) and the hub, proud of the frame on the inside.
 */
function frame(side, y0, y1, live) {
  const F = alongY([0, 0, W.z]);
  const out = [rodParts(`${side}-spokes`, live[`${side}Spokes`])];
  out.push(annulus(F, y0, y1, W.rim.inner, W.tyre, k.pathOf(circleAt(F, y1, W.rim.outer), true)));
  out.push(
    `<path data-part="${side}-joints" class="iso-line" data-tone="faint" d="${live[`${side}Joints`]}"/>`,
  );
  const bolts = Array.from({ length: 16 }, (_, index) =>
    at(G.pointOf(F, y1, W.rim.outer - 2.5, ((index + 0.5) / 16) * TAU)),
  );
  out.push(D(bolts, { size: 0.4 }));
  const boss = side === "near" ? [y0 - 5, y1 + 1.2] : [y0, y1 + 5];
  out.push(S(G.disc(boss[0], boss[1], W.hub, F, P, { steps: 32 }), { tone: "mid" }));
  if (side === "far") {
    out.push(L(G.circleOf(F, boss[1], W.hub - 5, P), { tone: "faint" }));
    out.push(D(G.dotsOf(F, boss[1], W.hub - 5, 8, P, { all: true, phase: 0.2 }), { size: 0.45 }));
  }
  return out.join("");
}

/**
 * The near hub's gearing: the carrier plate, the sun gear fixed to the axle, its back face hatched
 * under its front, and the pinions (live) on the plate round it.
 */
function gearing(live) {
  const F = alongY([0, 0, W.z]);
  const back = GE.y - GE.thick;
  const out = [S(G.disc(FACE + 1.2, back, GE.plate, F, P, { steps: 40 }), { tone: "mid" })];
  out.push(D(G.dotsOf(F, back, GE.plate - 2.5, 16, P, { all: true }), { size: 0.4 }));
  const sunBack = M.gearOutline([0, W.z], GE.sun, 0, back, P);
  const sun = M.gearOutline([0, W.z], GE.sun, 0, GE.y, P);
  out.push(`<path data-shade="1" d="${sunBack}"/>`, L(sunBack, { tone: "lo" }));
  out.push(`<path class="iso-fill" d="${sun}"/>`, L(sun, { tone: "mid" }));
  out.push(L(G.circleOf(F, GE.y, GE.sun.r - 4, P), { tone: "faint" }));
  out.push(
    `<path data-part="pinions" class="iso-fill" d="${live.pinions}"/>`,
    `<path data-part="pinion-edges" class="iso-line" data-tone="mid" d="${live.pinions}"/>`,
    `<path data-part="pinion-bores" class="iso-line" data-tone="lo" d="${live.pinionBores}"/>`,
  );
  return out.join("");
}

/** The board's face as a frame at `along` up the slope: axis off the face, u along y, v up it. */
const faceFrame = (along) => {
  const [x, z] = onBoard(along, 0);
  return G.frameOf([x, 0, z], [OUT[0], 0, OUT[1]], [0, 1, 0], [UP[0], 0, UP[1]]);
};

/** Rule lines from the top of a page down: a short heading, then lines, some ending a paragraph. */
function* rules(top, bottom, gap, random) {
  for (let v = top, first = true; v >= bottom; v -= gap, first = false)
    yield [v, first ? 0.5 : random() < 0.22 ? 0.3 + random() * 0.4 : 1];
}

/** A rectangle from `u0` to `u1` across and `v0` to `v1` up, as a polygon for `prismOf`. */
const rectangle = (u0, u1, v0, v1) => [
  [u0, v0],
  [u1, v0],
  [u1, v1],
  [u0, v1],
];

/**
 * An open book on the board: its cover, and two page blocks that rise from the fore-edge and dip
 * to the gutter, ruled across their curve.
 */
function openBook(random) {
  const out = [];
  const half = 28;
  const tall = SLOPE - 4;
  const F = faceFrame(2.4);
  out.push(S(G.prismOf(F, rectangle(-half, half, 0, tall), 0, 0.8, P), { tone: "mid" }));
  // A page block's cross-section across the spread: distance from the gutter, height off the face.
  const profile = [
    [27, 0.8],
    [27, 2.0],
    [22, 3.0],
    [15, 3.5],
    [8, 3.2],
    [3, 2.3],
    [0.3, 1.2],
    [0.3, 0.8],
  ];
  const heightAt = (u) => {
    for (let index = 1; index < profile.length - 2; index++) {
      const [ua, ha] = profile[index];
      const [ub, hb] = profile[index + 1];
      if (u <= ua && u >= ub) return ha + ((hb - ha) * (u - ua)) / (ub - ua);
    }
    return 1;
  };
  // The pages run up the slope: a frame along the board, u along y, v off the face.
  const [x0, z0] = onBoard(3.4, 0);
  const Fp = G.frameOf([x0, 0, z0], [UP[0], 0, UP[1]], [0, 1, 0], [OUT[0], 0, OUT[1]]);
  let lines = "";
  for (const side of [-1, 1]) {
    out.push(
      S(
        G.prismOf(
          Fp,
          profile.map(([u, h]) => [side * u, h]),
          0,
          tall - 2,
          P,
        ),
        { tone: "mid" },
      ),
    );
    for (const [v, share] of rules(tall - 6, 3, 2.2, random)) {
      // From the fore-edge margin toward the gutter, through the profile's knots it crosses.
      const from = 24.5;
      const to = from - (from - 3.5) * share;
      const across = [from, ...[22, 15, 8].filter((u) => u > to), to];
      lines += line3(across.map((u) => inFrame(Fp, v, side * u, heightAt(u) + 0.05)));
    }
  }
  out.push(L(lines, { tone: "faint", free: true }));
  return out.join("");
}

/**
 * A bound report on the board, `[u0, u1]` across and `tall` up it: its sheets, the cloth binding
 * along the top with three rivets, and its ruled text; `chart` adds a bar chart.
 */
function report([u0, u1], tall, random, chart) {
  const F = faceFrame(2.4);
  const out = [
    S(G.prismOf(F, rectangle(u0, u1, 0, tall - 4), 0, 2.2, P), { tone: "mid" }),
    S(G.prismOf(F, rectangle(u0 - 0.4, u1 + 0.4, tall - 5, tall), 0, 2.8, P), { tone: "lo" }),
  ];
  out.push(
    D(
      [0.2, 0.5, 0.8].map((share) => at(inFrame(F, 2.8, u0 + (u1 - u0) * share, tall - 2.5))),
      { size: 0.45 },
    ),
  );
  const left = u0 + 2.6;
  const right = u1 - 2.6;
  let lines = "";
  for (const [v, share] of rules(tall - 8, chart ? 12 : 3, 2.2, random))
    lines += line3([inFrame(F, 2.25, left, v), inFrame(F, 2.25, left + (right - left) * share, v)]);
  if (chart) {
    // A bar chart at the foot of the page: four bars standing on a baseline.
    const base = 3;
    const width = (right - left) / 9;
    lines += line3([inFrame(F, 2.25, left, base), inFrame(F, 2.25, right, base)]);
    for (const [index, share] of [0.5, 0.8, 0.35, 0.65].entries()) {
      const ua = left + width * (1 + 2 * index);
      const h = base + 6.5 * share;
      lines += line3([
        inFrame(F, 2.25, ua, base),
        inFrame(F, 2.25, ua, h),
        inFrame(F, 2.25, ua + width, h),
        inFrame(F, 2.25, ua + width, base),
      ]);
    }
  }
  out.push(L(lines, { tone: "faint", free: true }));
  return out.join("");
}

/** What lectern `index` carries: open books between bound reports, single and in pairs. */
function contents(index) {
  const random = seeded(1588 + index * 31);
  if (index % 2 === 0) return openBook(random);
  if (index % 4 === 1) return report([-18, 18], SLOPE - 4, random, true);
  return (
    report([-27, -1.5], SLOPE - 6, random, index === 3) +
    report([1.5, 27], SLOPE - 6, random, index === 7)
  );
}

/** Lectern `index` built at the origin: a cheek, the pin, the board and ledge, its load, a cheek. */
function lectern(index) {
  const cheek = (y0, y1) =>
    S(G.prismOf(alongY([0, y0, 0]), CHEEK_RING, 0, y1 - y0, P), { tone: "mid" });
  const F = alongY([0, -CHEEK.inner, 0]);
  const across = 2 * CHEEK.inner;
  const board = [onBoard(0, 0), onBoard(SLOPE, 0), onBoard(SLOPE, -2.5), onBoard(0, -2.5)];
  const ledge = [onBoard(-2.6, -2.5), onBoard(-2.6, 4.8), onBoard(2.4, 4.8), onBoard(2.4, -2.5)];
  const screw = (along, out) => {
    const [x, z] = onBoard(along, out);
    return at([x, CHEEK.outer, z]);
  };
  return [
    cheek(-CHEEK.outer, -CHEEK.inner),
    S(G.disc(-W.span / 2, W.span / 2, 2.2, alongY([0, 0, 0]), P, { steps: 10 }), { tone: "mid" }),
    S(G.prismOf(F, board, 0, across, P), { tone: "mid" }),
    S(G.prismOf(F, ledge, 0, across, P), { tone: "mid" }),
    contents(index),
    cheek(CHEEK.inner, CHEEK.outer),
    D([screw(SLOPE - 4, -1), screw(2, -1)], { size: 0.45 }),
  ].join("");
}

/** A lectern's outline on the page with its pivot at `pivot`: its cheeks, out to the book. */
const outlineOf = (pivot) =>
  G.hullOf(
    [...CHEEK_RING, onBoard(-2.6, 5), onBoard(SLOPE, 5)].flatMap(([x, z]) =>
      [-CHEEK.outer, CHEEK.outer].map((y) => at([pivot[0] + x, y, pivot[2] + z])),
    ),
  );

/** Throws if two lecterns could overlap on the page at any angle of the wheel. */
function lecternsApart() {
  for (let degree = 0; degree < 360; degree += 0.5) {
    const turn = (degree * TAU) / 360;
    const first = outlineOf(M.pivotOf(0, turn));
    for (let index = 1; index < M.shelves; index++) {
      const other = outlineOf(M.pivotOf(index, turn));
      if (clipped(first, other).length > 0)
        throw new Error(`Lecterns 0 and ${index} overlap at ${degree} degrees.`);
    }
  }
}

/** The end of a lectern's pin, flush in the near rim's face in its washer, built at the origin. */
const pinHead =
  L(G.circleOf(alongY([0, 0, 0]), FACE, 3.2, P, 14), { tone: "lo" }) +
  D([at([0, FACE, 0])], { size: 0.75 });

/** The footboard's top at `x`: 3 high at the reader's end, rising 8 over its 30 toward the wheel. */
const footboardRise = (x) => 3 + ((x + 200) / 30) * 8;

/** The reader's joint stool and the sloping footboard before it. */
function bench() {
  const out = [];
  // The footboard first, a board rising toward the wheel, two battens across it: it stands
  // further from the eye than the stool.
  out.push(shadowOf({ x: -200, y: -24, w: 30, d: 48, r: 0 }, 0, 2));
  out.push(
    S(
      G.prismOf(
        alongY([0, -24, 0]),
        [
          [-200, 0],
          [-170, 0],
          [-170, footboardRise(-170)],
          [-200, footboardRise(-200)],
        ],
        0,
        48,
        P,
      ),
      { tone: "mid" },
    ),
  );
  out.push(
    L(
      [-190, -180]
        .map((x) =>
          line3([
            [x, -24, footboardRise(x)],
            [x, 24, footboardRise(x)],
          ]),
        )
        .join(""),
      {
        tone: "faint",
      },
    ),
  );
  out.push(
    D(
      [-190, -180].flatMap((x) => [-19, 19].map((y) => at([x, y, footboardRise(x)]))),
      { size: 0.4 },
    ),
  );
  const seat = { x: -244, y: -26, w: 36, d: 52, r: 2 };
  const seatZ = 58;
  out.push(shadowOf(seat, 0, 4));
  const corners = k.corners(seat, 4);
  const [, , front, near] = byDepth(corners);
  const leg = ([x, y]) =>
    S(k.slabOf({ x: x - 2.5, y: y - 2.5, w: 5, d: 5, r: 0.6 }, 0, seatZ, P, 1), {
      tone: "mid",
    });
  // Stretchers run between the legs' inner faces: one on each side, one across the near end.
  const inner = k.insetPlan(seat, 6.5);
  const rail = (plan) => S(k.slabOf(plan, 16, 4, P, 1), { tone: "mid" });
  const side = (x) => rail({ x: x - 1.5, y: inner.y, w: 3, d: inner.d, r: 0.4 });
  // The two far legs, the far side's stretcher, the third leg, the near ones.
  for (const corner of byDepth(corners).slice(0, 2)) out.push(leg(corner));
  out.push(side(seat.x + seat.w - 4));
  out.push(leg(front));
  out.push(side(seat.x + 4));
  out.push(rail({ x: inner.x, y: seat.y + seat.d - 5.5, w: inner.w, d: 3, r: 0.4 }));
  out.push(leg(near));
  // The seat with its moulded edge and pegs.
  out.push(
    S(k.slabOf(seat, seatZ, 4, P, 4, 1), {
      tone: "hi",
      inner: L(k.sideSeam(seat, seatZ + 1.4, P, 4), { tone: "faint" }),
    }),
  );
  out.push(
    D(
      k.corners(seat, 4).map(([x, y]) => at([x, y, seatZ + 4])),
      { size: 0.5 },
    ),
  );
  return out.join("");
}

/** The point halfway between two floor points. */
const midpoint = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

/** A rectangle `w` by `d` centred on `[x, y]`, turned by `angle`, as a floor ring. */
const turned = (x, y, w, d, angle) =>
  [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([u, v]) => [
    x + u * Math.cos(angle) - v * Math.sin(angle),
    y + u * Math.sin(angle) + v * Math.cos(angle),
  ]);

/** A stack of three reports tied with string, a pair of rivet spectacles on top. */
function reports() {
  const x = 66;
  const y = 96;
  const out = [shadowOf({ x: x - 24, y: y - 17, w: 48, d: 34, r: 0 }, 0, 3)];
  let ring = [];
  let top = 0;
  for (const [z, h, angle, dx, dy] of [
    [0, 5, 0, 0, 0],
    [5, 4.4, 0.07, 1, -0.6],
    [9.4, 4.8, -0.05, -0.8, 0.5],
  ]) {
    ring = turned(x + dx, y + dy, 46, 32, angle);
    out.push(
      S(k.extrude(ring, z, h, P), {
        tone: "mid",
        inner: L(k.ringSeam(ring, z + h * 0.45, P), { tone: "faint" }),
      }),
    );
    top = z + h;
  }
  // The string, once each way round the stack, down the sides that show, knotted on top.
  const sides = ring.map((p, index) => midpoint(p, ring[(index + 1) % ring.length]));
  const centre = midpoint(sides[0], sides[2]);
  const seen = sides.filter(
    ([sx, sy]) => k.depthOf([sx, sy, 0], P) > k.depthOf([centre[0], centre[1], 0], P),
  );
  out.push(
    L(
      k.lineOnTop(sides[0], sides[2], top, P) +
        k.lineOnTop(sides[1], sides[3], top, P) +
        seen.map(([sx, sy]) => k.segment([sx, sy, top], [sx, sy, 0], P)).join(""),
      { tone: "mid" },
    ),
  );
  out.push(D([at([...centre, top])], { size: 0.9 }));
  // The spectacles: two round rims riveted together, lying on the top report.
  const rims = [
    [x - 11, y + 6],
    [x + 1, y + 8],
  ];
  for (const [gx, gy] of rims)
    out.push(
      S(k.cylinder(gx, gy, 5.2, top, 0.7, P, 28), {
        tone: "mid",
        crease: "none",
        inner: L(k.ring(gx, gy, 4.1, top + 0.7, P, 28), { tone: "lo" }),
      }),
    );
  const [a, b] = rims;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const unit = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  const from = [a[0] + unit[0] * 5.2, a[1] + unit[1] * 5.2];
  const to = [b[0] - unit[0] * 5.2, b[1] - unit[1] * 5.2];
  const arch = [
    from,
    [(from[0] + to[0]) / 2 - unit[1] * 1.4, (from[1] + to[1]) / 2 + unit[0] * 1.4],
    to,
  ];
  out.push(L(k.onTop(arch, top + 0.7, P), { tone: "mid" }));
  return out.join("");
}

/** A brass candlestick with a lit candle, the one accent. */
function candlestick() {
  const x = -168;
  const y = 84;
  const out = [shadowOf({ x: x - 10, y: y - 10, w: 20, d: 20, r: 10 }, 0, 3)];
  // The foot, the stem with its knop, the drip pan, and the candle in it.
  const F = upAt(x, y, 0);
  out.push(
    S(
      G.solidOf(
        [
          [0, 11],
          [1.4, 11],
          [2.6, 9],
          [3.4, 4],
        ],
        F,
        P,
        { steps: 20 },
      ),
      { tone: "hi" },
    ),
  );
  out.push(S(G.disc(3.4, 22, 1.9, F, P, { steps: 12 }), { tone: "hi" }));
  out.push(S(G.sphereOf([x, y, 9], 3.4, P, { steps: 14 }), { tone: "hi" }));
  out.push(
    S(
      G.solidOf(
        [
          [22, 1.8],
          [23, 3.4],
          [25.5, 6.5],
          [26.5, 6.5],
        ],
        F,
        P,
        { steps: 16 },
      ),
      { tone: "hi" },
    ),
  );
  const base = 26.5 + 24;
  out.push(S(G.disc(0, 24, 2.8, upAt(x, y, 26.5), P, { steps: 16 }), { tone: "hi" }));
  out.push(
    L(
      line3([
        [x, y, base],
        [x, y, base + 2.6],
      ]),
      { tone: "lo" },
    ),
  );
  out.push(D([at([x, y, base])], { size: 0.5 }));
  // The flame: a teardrop round the wick's tip, drawn in the plane facing the viewer.
  const [sx, sy] = [-Math.sin((P.azimuth * Math.PI) / 180), Math.cos((P.azimuth * Math.PI) / 180)];
  const flame = Array.from({ length: 28 }, (_, index) => {
    const a = (index / 28) * TAU;
    const h = 4.6 * (1 - Math.cos(a));
    const r = 1.9 * Math.sin(a) * (1 - h / 11);
    return at([x + sx * r, y + sy * r, base + 1.6 + h]);
  });
  const d = k.pathOf(flame, true);
  out.push(`<path class="iso-fill" d="${d}"/>`, L(d, { tone: "lit" }));
  return out.join("");
}

/** The quill's vane `most` wide at its widest, `s` along the shaft, from a third of the way up. */
const vaneWidth = (s, most) => most * Math.sin(Math.PI * ((s - 0.32) / 0.68) ** 0.6);

/** An inkwell with a quill standing in it. */
function inkwell() {
  const x = -122;
  const y = 102;
  const out = [shadowOf({ x: x - 8, y: y - 8, w: 16, d: 16, r: 8 }, 0, 3)];
  const mouth = 11.4;
  out.push(
    S(
      G.solidOf(
        [
          [0, 8],
          [5, 8],
          [7, 6.4],
          [8, 3.2],
          [10, 3.2],
          [10.6, 3.8],
          [mouth, 3.8],
        ],
        upAt(x, y, 0),
        P,
        { steps: 20 },
      ),
      { tone: "mid", inner: L(k.ring(x, y, 2.2, mouth, P, 16), { tone: "lo" }) },
    ),
  );
  // The quill leans back out of the mouth; its vane runs up the shaft's last two thirds.
  const foot = [x, y, mouth];
  const tip = [x + 15, y - 12, 54];
  const shaft = (s) => foot.map((value, axis) => value + (tip[axis] - value) * s);
  const side = [0.62, 0.78, 0];
  const vane = [];
  for (let index = 0; index <= 12; index++) {
    const s = 0.32 + (0.68 * index) / 12;
    const [px, py, pz] = shaft(s);
    vane.push(at([px + side[0] * vaneWidth(s, 4.2), py + side[1] * vaneWidth(s, 4.2), pz]));
  }
  for (let index = 11; index >= 1; index--) {
    const s = 0.32 + (0.68 * index) / 12;
    const [px, py, pz] = shaft(s);
    vane.push(at([px - side[0] * vaneWidth(s, 2.6), py - side[1] * vaneWidth(s, 2.6), pz]));
  }
  const vaneD = k.pathOf(vane, true);
  out.push(`<path class="iso-fill" d="${vaneD}"/>`, L(vaneD, { tone: "lo" }));
  let barbs = "";
  for (let index = 1; index < 9; index++) {
    const s = 0.36 + (0.6 * index) / 9;
    const [qx, qy, qz] = shaft(s + 0.04);
    const w = vaneWidth(s + 0.04, 4.2);
    barbs += line3([shaft(s), [qx + side[0] * w, qy + side[1] * w, qz]]);
  }
  out.push(L(barbs, { tone: "faint" }));
  out.push(L(line3([foot, tip]), { tone: "mid" }));
  out.push(D([at(foot)], { size: 0.9 }));
  return out.join("");
}

lecternsApart();
const { moment } = E;
const live = M.liveParts(M.pose(moment), P);
const parts = [
  platform(),
  sill(-STAND_Y),
  stretchers(),
  standard(-STAND_Y),
  axle(-STAND_Y + BLOCK.d / 2, -FACE),
  frame("far", -FACE, -W.span / 2, live),
  axle(-W.span / 2 + 5, W.span / 2 - 5),
  ...live.shelves.map((offset, index) => placed(`shelf-${index}`, offset, lectern(index))),
  frame("near", W.span / 2, FACE, live),
  gearing(live),
  ...live.shelves.map((offset, index) => placed(`pin-${index}`, offset, pinHead)),
  axle(GE.y, STAND_Y - BLOCK.d / 2),
  S(G.disc(GE.y, GE.y + 3, 7.5, alongY([0, 0, W.z]), P, { steps: 24 }), { tone: "mid" }),
  sill(STAND_Y),
  standard(STAND_Y),
  axleEnd(STAND_Y + BLOCK.d / 2),
  // The reader's things on the platform, far to near.
  reports(),
  bench(),
  inkwell(),
  candlestick(),
];
E.write(parts, moment);
