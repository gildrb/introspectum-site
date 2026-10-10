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
 * The colors of the Tabula Smaragdina, the "emerald tablet", as Heinrich Khunrath's 1609
 * engraving shows it: iron-gall ink on aged paper, sepia between them, and the emerald of its
 * name. Light is ink on parchment, dark is parchment on umber; both follow the system setting.
 *
 * Every text color meets APCA's Bronze level on what it sits on. Body text, a block of more than
 * two lines, needs at least Lc 75: `article` (Lc 90 light, Lc 92 dark) and `secondary` (Lc 78 in
 * both), which may run that long. Other content text, such as labels, navigation, notes and the
 * footer, needs at least Lc 60: `tertiary` (Lc 62 in both), which therefore never sets running
 * text. On `accent`, `onAccent` reaches Lc 85 light and Lc 83 dark, and `accent` itself stands
 * off the page at Lc 82 light and Lc 16 dark, above APCA's Lc 15 for a solid shape. Light prose
 * is heavier (`proseWeight`): dark on light reads fainter than light on dark at the same Lc.
 */
export const colors = stylex.defineVars({
  bg: { default: "oklch(18.5% 0.014 70)", [light]: "oklch(96% 0.02 85)" },
  primary: { default: "oklch(96.74% 0.022 85)", [light]: "oklch(24.9% 0.02 65)" },
  secondary: { default: "oklch(86.06% 0.03 80)", [light]: "oklch(45.09% 0.03 65)" },
  tertiary: { default: "oklch(77.62% 0.035 75)", [light]: "oklch(57.8% 0.035 70)" },
  article: { default: "oklch(93.09% 0.02 85)", [light]: "oklch(33% 0.022 65)" },
  /** Emerald: buttons and the closing panel. */
  accent: { default: "oklch(44% 0.1 160)", [light]: "oklch(40% 0.09 160)" },
  /** Emerald under a pointer: further from `onAccent` in light, still Lc 75 from it in dark. */
  accentHover: { default: "oklch(50% 0.1 160)", [light]: "oklch(34% 0.09 160)" },
  /** Text on `accent`: parchment in both settings. */
  onAccent: { default: "oklch(96.74% 0.022 85)", [light]: "oklch(96% 0.02 85)" },
  /**
   * Dividers and card edges. Decoration only: what they group reads the same without them, so
   * they may stay below APCA's Lc 15 for meaningful non-text. Form fields use `tertiary` instead.
   */
  hairline: { default: "oklch(96.74% 0.022 85 / 0.16)", [light]: "oklch(24.9% 0.02 65 / 0.14)" },
  codeBg: { default: "oklch(24% 0.016 70)", [light]: "oklch(92% 0.025 85)" },
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
