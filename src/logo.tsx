import { readFileSync } from "node:fs";
import { schemeToken } from "./color.ts";
import { colors } from "./tokens.stylex.ts";

/**
 * Introspectum's mark: an eye, the O with its pupil, between two chevrons. `logo.svg` is the
 * designer's file, kept as delivered; the header and the favicon both take its one path, filled
 * even-odd, so replacing the file replaces the mark everywhere. Build-time only.
 */
function readMark(): { viewBox: string; width: number; height: number; path: string } {
  const svg = readFileSync("src/logo.svg", "utf8");
  const box = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const path = svg.match(/<path d="([^"]+)"/);
  const paths = svg.match(/<path\b/g) ?? [];
  if (box === null || path === null || paths.length !== 1)
    throw new Error("src/logo.svg must hold one <path> in a viewBox from 0 0.");
  const [, width = "", height = ""] = box;
  const [, d = ""] = path;
  return {
    viewBox: `0 0 ${width} ${height}`,
    width: Number(width),
    height: Number(height),
    path: d,
  };
}

/** The mark's drawing, for the header logo (`islands/logo.tsx`) and the footer's. */
export const mark = readMark();

/**
 * The favicon: the mark almost as large as the square, a twentieth of it free on each side, on a
 * ground of the other scheme than the browser's, so it stands out from the tab around it: paper on
 * umber where the browser is light, ink on paper where it is dark (`colors.bg` & `colors.primary`,
 * read from the built CSS `css`). The light browser's pair is also set on the shapes themselves, so
 * a browser that ignores the icon's stylesheet or its media query still shows the mark on its own
 * ground.
 */
export function favicon(css: string): string {
  const ground = schemeToken(css, colors.bg);
  const ink = schemeToken(css, colors.primary);
  const side = (Math.max(mark.width, mark.height) * 10) / 9;
  const x = (mark.width - side) / 2;
  const y = (mark.height - side) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${side} ${side}"><style>@media (prefers-color-scheme:dark){rect{fill:${ground.light}}path{fill:${ink.light}}}</style><rect x="${x}" y="${y}" width="${side}" height="${side}" fill="${ground.dark}"/><path fill="${ink.dark}" fill-rule="evenodd" d="${mark.path}"/></svg>\n`;
}
