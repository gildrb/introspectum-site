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
  /** The light scheme; dark is the default (see `colors`). */
  light,
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
 * Every text color meets APCA's Bronze level on the page and on `surface`, the ground of cards.
 * Body text, a block of more than two lines, needs at least Lc 75: `primary` (Lc 95 light, Lc 100
 * dark), `article` (Lc 90, Lc 92) and `secondary` (Lc 81, Lc 78; on cards Lc 76, Lc 77), which
 * may run that long. Other content text, such as labels, navigation, notes and the footer, needs
 * at least Lc 60: `tertiary` (Lc 66, Lc 62; on cards Lc 61 in both), which therefore never sets
 * running text. Buttons are ink on parchment in light and parchment on umber in dark, like the
 * text. Emerald, the brand color, stays a trace: the form's checkbox and the favicon.
 */
export const colors = stylex.defineVars({
  bg: { default: "oklch(18.5% 0.014 70)", [light]: "oklch(96% 0.02 85)" },
  /** Cards and the form: a shade further into the paper, or the ink. */
  surface: { default: "oklch(22.5% 0.016 70)", [light]: "oklch(93.5% 0.025 85)" },
  primary: { default: "oklch(96.74% 0.022 85)", [light]: "oklch(24.9% 0.02 65)" },
  secondary: { default: "oklch(86.06% 0.03 80)", [light]: "oklch(42.55% 0.03 65)" },
  tertiary: { default: "oklch(77.62% 0.035 75)", [light]: "oklch(55.05% 0.035 70)" },
  article: { default: "oklch(93.09% 0.02 85)", [light]: "oklch(33% 0.022 65)" },
  /** Emerald, the brand color, used sparingly: the form's checkbox, the favicon. */
  accent: { default: "oklch(44% 0.1 160)", [light]: "oklch(40% 0.09 160)" },
  /**
   * The edge of the open phone menu over the page. Decoration only: the menu reads the same
   * without it, so it may stay below APCA's Lc 15 for meaningful non-text.
   */
  hairline: { default: "oklch(96.74% 0.022 85 / 0.16)", [light]: "oklch(24.9% 0.02 65 / 0.14)" },
  codeBg: { default: "oklch(24% 0.016 70)", [light]: "oklch(92% 0.025 85)" },
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
  x16: `${16 * unit}px`,
  x20: `${20 * unit}px`,
  /** The header's height. */
  bar: `${8 * unit}px`,
  /** The widest column, twelve grid columns: header, sections and footer. */
  page: `${150 * unit}px`,
});
