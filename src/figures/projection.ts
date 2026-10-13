/**
 * The drawn machines' camera and the few shapes their live parts are redrawn with, shared by the
 * build scripts (`scripts/figures/`) and the browser, so both draw the same pose the same way.
 */

export type Point = readonly [number, number, number];
export type Flat = readonly [number, number];
export type Projection = {
  origin: Flat;
  scale: number;
  azimuth: number;
  elevation: number;
};

/** The kit's projection (`iso` in `scripts/anatomy/kit/iso-kit.mjs`), world units to the viewBox. */
export function iso([x, y, z]: Point, P: Projection): Flat {
  const a = (P.azimuth * Math.PI) / 180;
  const e = (P.elevation * Math.PI) / 180;
  const k = screenScale(P);
  return [
    P.origin[0] + (x * Math.sin(a) - y * Math.cos(a)) * k,
    P.origin[1] + ((x * Math.cos(a) + y * Math.sin(a)) * Math.sin(e) - z * Math.cos(e)) * k,
  ];
}

/** Screen units per world unit along any direction perpendicular to the view. */
export function screenScale(P: Projection): number {
  return P.scale * Math.sqrt(1.6);
}

/** The screen offset of a world offset, for a part that only translates. */
export function offsetOf(by: Point, P: Projection): Flat {
  const [x0, y0] = iso([0, 0, 0], P);
  const [x1, y1] = iso(by, P);
  return [x1 - x0, y1 - y0];
}

/** An SVG `translate` for a screen offset. */
export function translate([x, y]: Flat): string {
  return `translate(${fixed(x)} ${fixed(y)})`;
}

const fixed = (value: number) => Math.round(value * 100) / 100;

/** A polyline through screen points, closed or open. */
export function pathOf(points: readonly Flat[], closed = false): string {
  return (
    points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${fixed(x)} ${fixed(y)}`).join("") +
    (closed ? "Z" : "")
  );
}

/**
 * A rod between two world points, in any direction: its body, the shaded half under its axis
 * (hatched by the figure), and its two edges. Its ends hide inside whatever it joins.
 */
export function rod(a: Point, b: Point, r: number, P: Projection) {
  const [ax, ay] = iso(a, P);
  const [bx, by] = iso(b, P);
  const length = Math.hypot(bx - ax, by - ay) || 1;
  // The screen normal that points down the page: the shaded half of a rod lit from above.
  const flip = bx - ax < 0 ? -1 : 1;
  const nx = (-(by - ay) / length) * flip;
  const ny = ((bx - ax) / length) * flip;
  const w = r * screenScale(P);
  const at = (x: number, y: number, share: number): Flat => [
    x + nx * w * share,
    y + ny * w * share,
  ];
  return {
    body: pathOf([at(ax, ay, 1), at(bx, by, 1), at(bx, by, -1), at(ax, ay, -1)], true),
    shade: pathOf([at(ax, ay, 0.15), at(bx, by, 0.15), at(bx, by, 1), at(ax, ay, 1)], true),
    edges: pathOf([at(ax, ay, 1), at(bx, by, 1)]) + pathOf([at(ax, ay, -1), at(bx, by, -1)]),
  };
}
