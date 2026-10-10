import * as stylex from "@stylexjs/stylex";

const light = "@media (prefers-color-scheme: light)";

/**
 * The layout's one unit, in px. Every gap, margin, padding, control height and layout width is a
 * whole multiple of it, and a line of text (24px) is three.
 */
const unit = 8;

export const media = stylex.defineConsts({
  mobile: "@media (max-width: 767px)",
  desktop: "@media (min-width: 768px)",
  hover: "@media (hover: hover)",
});

/**
 * How dates are spaced, in Inter's font units (see `ui.figures`): tabular digits, tracked to the
 * mean ink-to-ink gap between the letters around them, measured from Inter's outlines at weight
 * 400 across every date from 2000 to 2099.
 */
export const figureUnits = stylex.defineConsts({
  unitsPerEm: "2048",
  /** Digit to digit. */
  digit: "-95.1",
  /** Digit to hyphen, after the digit's own tracking. */
  beforeHyphen: "17",
  /** Hyphen to digit. */
  afterHyphen: "-88.2",
});

/**
 * Inter's OpenType features. Interface text takes case forms (`case`): arrows, hyphens and @
 * centred on capitals and figures. Running prose and email addresses keep the default forms,
 * which sit among lowercase letters. The grotesque G (cv10) is built into the font file itself.
 */
export const fontFeatures = stylex.defineConsts({
  interface: '"liga" 1, "calt" 1, "case" 1',
  prose: '"liga" 1, "calt" 1',
});

/**
 * The page follows the system's light or dark setting. Light is not a mirror of dark: gray on
 * white reads fainter than on black, so light prose is heavier (`proseWeight`) and its tertiary
 * gray sits at APCA Lc 61 on white (article Lc 102), where dark's sits at Lc 42 on black.
 */
export const colors = stylex.defineVars({
  bg: { default: "oklch(0% 0 0)", [light]: "oklch(100% 0 0)" },
  primary: { default: "oklch(100% 0 0)", [light]: "oklch(0% 0 0)" },
  secondary: { default: "oklch(76.68% 0 0)", [light]: "oklch(42.02% 0 0)" },
  tertiary: { default: "oklch(64.83% 0 0)", [light]: "oklch(64% 0 0)" },
  article: { default: "oklch(88.53% 0 0)", [light]: "oklch(27.07% 0 0)" },
  hairline: { default: "oklch(100% 0 0 / 0.12)", [light]: "oklch(0% 0 0 / 0.12)" },
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
  /** Desktop: the name and navigation. */
  sidebar: `${30 * unit}px`,
  /** Desktop: the page's text column. */
  content: `${68 * unit}px`,
  /** Desktop: the whole layout, sidebar and content with the six-unit gap between them. */
  layout: `${104 * unit}px`,
});
