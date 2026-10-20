/**
 * The look of the drawn figures (`scripts/figures/`): an engraving in the page's two colors. Every
 * part is filled with paper, so what stands in front hides what is behind; a face turned from the
 * light is hatched with vertical lines in ink, closer the darker it is (the hatch patterns live in
 * each figure, see `hatches`); every line is ink, its weight saying how much it matters. No
 * opacity: like the illustrations, a figure is ink on paper or paper on umber.
 */
export function engravingCss(ink: string, paper: string): string {
  return [
    // Each figure as wide as its column up to its own size (`max-width` and `aspect-ratio` on the
    // `<svg>`), centred; in a column of fixed height it shrinks to fit, keeping its proportions.
    ".iso-svg{display:block;width:100%;height:auto;flex:0 1 auto;min-height:0;margin-inline:auto;overflow:visible}",
    // Held down, a machine eases to a stop (`live.ts`): no text selection or callout meanwhile.
    "[data-machine] .iso-svg{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}",
    ".iso-svg path,.iso-svg circle{vector-effect:non-scaling-stroke}",
    `.iso-fill,.iso-top{fill:${paper};stroke:none}`,
    ".iso-shade{stroke:none}",
    `.iso-line{fill:none;stroke:${ink};stroke-width:.55px;stroke-linecap:round;stroke-linejoin:round}`,
    '.iso-line[data-tone="hi"]{stroke-width:.95px}',
    '.iso-line[data-tone="mid"]{stroke-width:.7px}',
    '.iso-line[data-tone="faint"]{stroke-width:.4px}',
    '.iso-line[data-tone="lit"]{stroke-width:1.5px}',
    // A judgement stroke, as heavy as Frege's (the trace's, `trace-model.ts`).
    '.iso-line[data-tone="bar"]{stroke-width:3px;stroke-linecap:butt}',
    ".iso-solid[data-lit]>.iso-edge{stroke-width:1.5px}",
    `.iso-dots circle{fill:${ink};stroke:none}`,
    `.iso-face-text{fill:${ink};font-family:Inter,sans-serif;font-weight:500;font-variant-numeric:tabular-nums}`,
    // Names set as code (the trace's), in the site's monospace face.
    `.iso-code{fill:${ink};font-family:"JetBrains Mono","SFMono-Regular","SF Mono",Menlo,Consolas,monospace;font-weight:500}`,
    `.iso-hatch{fill:none;stroke:${ink}}`,
    `.iso-paper{fill:${paper}}`,
  ].join("");
}

/** One vertical hatch line through a pattern tile of `size`. */
const vertical = (size: number) => `M${size / 2} 0V${size}`;

/**
 * The hatch patterns of one figure, ids prefixed with its name: shades 0 (darkest, crossed) to 3
 * (lightest), and the cast shadow, in diagonal lines. Sizes are in the figure's own units.
 */
export function hatches(name: string): string {
  const pattern = (id: string, size: number, lines: string, width: number) =>
    `<pattern id="${name}-${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">` +
    `<rect class="iso-paper" width="${size}" height="${size}"/>` +
    `<path class="iso-hatch" stroke-width="${width}" d="${lines}"/></pattern>`;
  return (
    "<defs>" +
    pattern("h3", 3.2, vertical(3.2), 0.3) +
    pattern("h2", 2.3, vertical(2.3), 0.36) +
    pattern("h1", 1.6, vertical(1.6), 0.4) +
    pattern("h0", 1.6, `${vertical(1.6)}M0 1.6L1.6 0M-.4 .4L.4 -.4M1.2 2L2 1.2`, 0.36) +
    pattern("shadow", 1.8, "M0 1.8L1.8 0M-.45 .45L.45 -.45M1.35 2.25L2.25 1.35", 0.34) +
    "</defs>"
  );
}
