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
 * The favicon: the mark filling the square on a transparent ground, in the ink of the text where
 * the browser is light and in its paper where it is dark: `colors.primary`, read from the built
 * CSS `css`.
 */
export function favicon(css: string): string {
  const ink = schemeToken(css, colors.primary);
  const side = Math.max(mark.width, mark.height);
  const x = (mark.width - side) / 2;
  const y = (mark.height - side) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${side} ${side}"><style>path{fill:${ink.light}}@media (prefers-color-scheme:dark){path{fill:${ink.dark}}}</style><path fill-rule="evenodd" d="${mark.path}"/></svg>\n`;
}
