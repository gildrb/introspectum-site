// What every figure script shares: the camera fit, the kit's drawing calls bound to it with the
// site's hatches, and writing the drawing to `src/figures/<name>.svg` (plus, with --preview, the
// figure alone in both schemes at /tmp/introspectum-<name>.html and -light.html).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import { engravingCss, hatches } from "../../src/figures/engraving.ts";
import { offsetOf, translate } from "../../src/figures/projection.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * One rule sizes every figure on the page: the same area, as much paper as a figure six columns
 * (712 px) wide and 480 px high covers. A tall, narrow machine is then drawn larger than a low,
 * wide one, so both carry the same weight beside their text. Never wider than six columns.
 */
const area = 712 * 480;
const widest = 712;

/**
 * A figure named `name`, its camera fitted into a `width` by `height` box around `points` (world
 * points that must show, the extremes of moving parts included). The drawing is then cropped to
 * those points on both axes, so no band of empty paper surrounds it, and the `<svg>` gets its
 * size in px, which a narrow column may shrink. `FIGURE_POSE=<t>` in the environment draws
 * another moment than `rest` and writes only the previews, so the page keeps its rest pose.
 */
export function engraver(name, { width, height, azimuth, elevation, points, pad = 12, rest }) {
  const P = k.fitProjection(points, width, height, { pad, azimuth, elevation });
  const flat = points.map((point) => k.iso(point, P));
  const left = Math.floor(Math.min(...flat.map(([x]) => x)) - pad);
  const top = Math.floor(Math.min(...flat.map(([, y]) => y)) - pad);
  const across = Math.ceil(Math.max(...flat.map(([x]) => x)) + pad) - left;
  const down = Math.ceil(Math.max(...flat.map(([, y]) => y)) + pad) - top;
  const pixelWidth = Math.min(widest, Math.round(Math.sqrt((area * across) / down)));
  const pixelHeight = Math.round((pixelWidth * down) / across);
  const at = (point) => k.iso(point, P);
  const shadow = (d) => `<path fill="url(#${name}-shadow)" d="${d}"/>`;
  return {
    P,
    at,
    S: k.solidSvg,
    L: k.lineSvg,
    D: k.dotsSvg,
    shadow,
    /** A cast shadow on the floor under a plan, pushed away from the light and hatched. */
    shadowOf: (plan, z, grow = 3) =>
      shadow(
        k.slabOf(
          { ...plan, x: plan.x + grow, y: plan.y - grow * 0.4, w: plan.w + grow, d: plan.d },
          z,
          0.01,
          P,
        ).fill,
      ),
    /** A frame standing up at a point, angle 0 along +x: turned parts on the floor. */
    up: (x, y, z) => G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]),
    /** Floor points far to near, for painting. */
    byDepth: (list) =>
      list.toSorted((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)),
    /** The `transform` that moves a part built at the world origin to a world point. */
    place: (point) => translate(offsetOf(point, P)),
    moment: process.env.FIGURE_POSE === undefined ? rest : Number(process.env.FIGURE_POSE),
    /** Writes the drawing: the hatches, then `parts` in painting order. */
    write(parts, moment) {
      // Shaded faces take their hatch from one rule per shade instead of an attribute each.
      const shades = [0, 1, 2, 3]
        .map((n) => `[data-figure="${name}"] [data-shade="${n}"]{fill:url(#${name}-h${n})}`)
        .join("");
      const body = [`<style>${shades}</style>`, hatches(name), ...parts]
        .join("")
        .replace(/(data-shade="\d") fill="url\(#[\w-]+-h\d\)"/g, "$1")
        .replace(/ d="([^"]*)"/g, (_, d) => ` d="${compact(d)}"`);
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="${left} ${top} ${across} ${down}"` +
        ` width="${pixelWidth}" height="${pixelHeight}"` +
        ` style="aspect-ratio:${across}/${down};max-width:${pixelWidth}px"` +
        ` data-figure="${name}" data-origin-x="${P.origin[0]}" data-origin-y="${P.origin[1]}"` +
        ` data-scale="${P.scale}" data-azimuth="${P.azimuth}" data-elevation="${P.elevation}"` +
        ` aria-hidden="true">${body}</svg>`;
      if (moment === rest) {
        writeFileSync(join(HERE, `../../src/figures/${name}.svg`), `${svg}\n`);
        console.log(`wrote src/figures/${name}.svg (${Math.round(svg.length / 1024)} KB)`);
      }
      if (process.argv.includes("--preview")) {
        const schemes = {
          dark: { ink: "oklch(96.74% 0.022 85)", paper: "oklch(18.5% 0.014 70)" },
          light: { ink: "oklch(24.9% 0.02 65)", paper: "oklch(96% 0.02 85)" },
        };
        for (const [scheme, { ink, paper }] of Object.entries(schemes)) {
          const file = `/tmp/introspectum-${name}${scheme === "light" ? "-light" : ""}.html`;
          writeFileSync(
            file,
            `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:${paper}}main{width:712px;margin:40px auto}${engravingCss(ink, paper)}</style><main>${svg}</main>`,
          );
          console.log("wrote", file);
        }
      }
    },
  };
}

/** Path data in relative steps with the shortest numbers: the same shapes in half the bytes. */
export function compact(d) {
  if (/[^MLZ\d\s.,-]/.test(d)) return d;
  let out = "";
  let previous = "";
  const put = (value) => {
    const text = String(value).replace(/^(-?)0\./, "$1.");
    const glued =
      previous === "" || text.startsWith("-") || (text.startsWith(".") && previous.includes("."));
    out += glued ? text : ` ${text}`;
    previous = text;
  };
  const letter = (text) => {
    out += text;
    previous = "";
  };
  let x = 0;
  let y = 0;
  let start = [0, 0];
  // After `m`, further pairs are relative lines; `l` only needs writing after a `z`.
  let implicit = "";
  for (const [, command, args] of d.matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (command === "Z") {
      letter("z");
      [x, y] = start;
      implicit = "";
      continue;
    }
    const values = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    for (let index = 0; index + 1 < values.length; index += 2) {
      // Steps from the rounded position, so rounding never drifts along a long path.
      const dx = Math.round((values[index] - x) * 10) / 10;
      const dy = Math.round((values[index + 1] - y) * 10) / 10;
      if (command === "M" && index === 0) {
        letter("m");
        implicit = "l";
      } else if (implicit !== "l") {
        letter("l");
        implicit = "l";
      }
      put(dx);
      put(dy);
      x = Math.round((x + dx) * 10) / 10;
      y = Math.round((y + dy) * 10) / 10;
      if (command === "M" && index === 0) start = [x, y];
    }
  }
  return out;
}
