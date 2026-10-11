import { readFileSync } from "node:fs";
import * as stylex from "@stylexjs/stylex";
import type { Style } from "./ui.tsx";

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

const mark = readMark();

/** The mark in the color of the text around it, so it follows the light and dark schemes. */
export function Logo({ style }: { style: Style }) {
  return (
    <svg {...stylex.props(style)} viewBox={mark.viewBox} aria-hidden="true">
      <path d={mark.path} fill="currentColor" fill-rule="evenodd" />
    </svg>
  );
}

/**
 * The favicon: the mark centred in a square, in the ink of the text where the browser is light and
 * in its cream where it is dark (`colors.primary`, in sRGB).
 */
export function favicon(): string {
  const side = Math.max(mark.width, mark.height);
  const x = (mark.width - side) / 2;
  const y = (mark.height - side) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${side} ${side}"><style>path{fill:#282017}@media (prefers-color-scheme:dark){path{fill:#fbf4e4}}</style><path fill-rule="evenodd" d="${mark.path}"/></svg>\n`;
}
