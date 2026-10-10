import * as stylex from "@stylexjs/stylex";

const light = "@media (prefers-color-scheme: light)";

/**
 * The layout's one unit, in px. Every gap, margin, padding, control height and layout width is a
 * whole multiple of it; line heights are multiples of half a unit.
 */
const unit = 8;

export const media = stylex.defineConsts({
  mobile: "@media (max-width: 767px)",
  desktop: "@media (min-width: 768px)",
  /** Three cards fit side by side from here; narrower, they stack. */
  wide: "@media (min-width: 1024px)",
  hover: "@media (hover: hover)",
});

/**
 * Inter's OpenType features. Interface text takes case forms (`case`): hyphens and @ centred on
 * capitals and figures. Email addresses keep the default forms, which sit among lowercase letters.
 */
export const fontFeatures = stylex.defineConsts({
  interface: '"liga" 1, "calt" 1, "case" 1',
  prose: '"liga" 1, "calt" 1',
});

/**
 * The page follows the system's light or dark setting. Every gray meets APCA's Bronze level on
 * the page background for the text it sets. Body text, a block of more than two lines, needs at
 * least Lc 75: `article` (Lc 102 light, Lc 90 dark), and `secondary` (Lc 89, Lc 77), which may
 * run that long. Other content text, such as labels, navigation, notes and the footer, needs at
 * least Lc 60: `tertiary` (Lc 61 in both), which therefore never sets running text. Light prose
 * is heavier (`proseWeight`): gray on white reads fainter than on black at the same Lc.
 */
export const colors = stylex.defineVars({
  bg: { default: "oklch(0% 0 0)", [light]: "oklch(100% 0 0)" },
  primary: { default: "oklch(100% 0 0)", [light]: "oklch(0% 0 0)" },
  secondary: { default: "oklch(85.3% 0 0)", [light]: "oklch(42.02% 0 0)" },
  tertiary: { default: "oklch(76.68% 0 0)", [light]: "oklch(64% 0 0)" },
  article: { default: "oklch(91.74% 0 0)", [light]: "oklch(27.07% 0 0)" },
  /**
   * Dividers and card edges. Decoration only: what they group reads the same without them, so
   * they may stay below APCA's Lc 15 for meaningful non-text. Form fields use `tertiary` instead.
   */
  hairline: { default: "oklch(100% 0 0 / 0.16)", [light]: "oklch(0% 0 0 / 0.12)" },
  codeBg: { default: "oklch(20.44% 0 0)", [light]: "oklch(93.12% 0 0)" },
  proseWeight: { default: "380", [light]: "400" },
});

/** Multiples of the unit, named by their factor: `x3` is three units. */
export const space = stylex.defineConsts({
  x1: `${unit}px`,
  x2: `${2 * unit}px`,
  x3: `${3 * unit}px`,
  x4: `${4 * unit}px`,
  x5: `${5 * unit}px`,
  x6: `${6 * unit}px`,
  x8: `${8 * unit}px`,
  x12: `${12 * unit}px`,
  /** The header's height. */
  bar: `${8 * unit}px`,
  /** The widest column: header, sections and footer. */
  page: `${150 * unit}px`,
  /** A column of running text: articles, legal pages, section intros. */
  measure: `${90 * unit}px`,
});
