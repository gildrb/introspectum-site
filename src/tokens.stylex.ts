import * as stylex from "@stylexjs/stylex";

const light = "@media (prefers-color-scheme: light)";

/**
 * The layout's one unit, in px. Every gap, margin, padding, control height and layout width is a
 * whole multiple of it; line heights are multiples of half a unit.
 */
const unit = 8;

/** The widest column, in px: 175 units. */
const page = 175 * unit;

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
 * at least Lc 60: `tertiary` (Lc 72 light, Lc 62 dark; on cards Lc 67, Lc 61), which therefore
 * never sets running text. In light, `tertiary` also meets WCAG 2's 4.5:1 (5.3:1, on cards 4.9:1),
 * which Lighthouse checks. Buttons are ink on parchment in light and parchment on umber in dark,
 * like the text. Emerald, the brand color, stays a trace: the form's checkbox.
 */
export const colors = stylex.defineVars({
  bg: { default: "oklch(18.5% 0.014 70)", [light]: "oklch(96% 0.02 85)" },
  /** Cards and the form: a shade further into the paper, or the ink. */
  surface: { default: "oklch(22.5% 0.016 70)", [light]: "oklch(93.5% 0.025 85)" },
  primary: { default: "oklch(96.74% 0.022 85)", [light]: "oklch(24.9% 0.02 65)" },
  secondary: { default: "oklch(86.06% 0.03 80)", [light]: "oklch(42.55% 0.03 65)" },
  tertiary: { default: "oklch(77.62% 0.035 75)", [light]: "oklch(50.5% 0.035 70)" },
  article: { default: "oklch(93.09% 0.02 85)", [light]: "oklch(33% 0.022 65)" },
  /** Emerald, the brand color, used sparingly: the form's checkbox. */
  accent: { default: "oklch(44% 0.1 160)", [light]: "oklch(40% 0.09 160)" },
  /**
   * The edge of what stands off the page: panels, code, images and the menus. Cards have none.
   * Translucent, so one edge sharpens every ground it lies on. Decoration only: each reads the
   * same without it, so it may stay below APCA's Lc 15 for meaningful non-text.
   */
  hairline: { default: "oklch(96.74% 0.022 85 / 0.16)", [light]: "oklch(24.9% 0.02 65 / 0.14)" },
  /**
   * The footer's emblem, the mark drawn in chalk: one solid color between the page and `tertiary`,
   * so it reads as a drawing behind the text, not as text. Decoration only, like `hairline`.
   */
  chalk: { default: "oklch(50% 0.03 75)", [light]: "oklch(66% 0.035 75)" },
  codeBg: { default: "oklch(24% 0.016 70)", [light]: "oklch(92% 0.025 85)" },
});

/**
 * The menus over the page, with `colors.hairline` as their edge: a close shadow under the edge &
 * a wide one under the menu, the page's ink at low strength, so the menu lifts off what it covers.
 */
export const shadows = stylex.defineVars({
  raised: {
    default: "0 1px 2px oklch(0% 0 0 / 0.32), 0 8px 24px oklch(0% 0 0 / 0.4)",
    [light]: "0 1px 2px oklch(24.9% 0.02 65 / 0.08), 0 8px 24px oklch(24.9% 0.02 65 / 0.1)",
  },
});

/**
 * Font weights. Light text on a dark ground looks heavier than the same weight of dark text on a
 * light ground, so the light scheme sets every weight 30 heavier: both schemes then look equally
 * bold. Dark is the reference. Every face is declared up to 630 (src/layout.tsx).
 */
export const weights = stylex.defineVars({
  regular: { default: 400, [light]: 430 },
  medium: { default: 500, [light]: 530 },
  semibold: { default: 600, [light]: 630 },
});

/** Multiples of the unit, named by their factor: `x3` is three units. */
export const space = stylex.defineConsts({
  half: `${unit / 2}px`,
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
  /** The least height a drawn machine is drawn at beside text: forty units. */
  band: `${40 * unit}px`,
  /** The height of an opening whose figure is its centre of interest: eighty units. */
  stage: `${80 * unit}px`,
  /** The widest column, twelve grid columns: header, sections and footer. */
  page: `${page}px`,
});

/** The grid's gutter: three units, between its twelve columns and between cards. */
const gutter = 3 * unit;

/** The container's side margin from tablets up: four units. */
const margin = 4 * unit;

/** The width of `n` of the twelve columns and the `n - 1` gutters between them, in `whole`. */
const span = (n: number, whole: string) =>
  `calc((${whole} - ${11 * gutter}px) * ${n} / 12 + ${(n - 1) * gutter}px)`;

/** The width of `n` of the twelve columns of the page at its widest, in px. */
const widest = (n: number) => `${((page - 11 * gutter) * n) / 12 + (n - 1) * gutter}px`;

/** The page grid (see `ui.titleWidth`): twelve columns, from tablets up. */
export const grid = stylex.defineConsts({
  gutter: `${gutter}px`,
  margin: `${margin}px`,
  columns: "repeat(12, minmax(0, 1fr))",
  span6: span(6, "100%"),
  span7: span(7, "100%"),
  span8: span(8, "100%"),
  span10: span(10, "100%"),
  /** Six columns of the page at its widest: the most that leads & forms take (`ui.textWidth`). */
  span6Widest: widest(6),
  /** Five columns of the page at its widest: about 70 characters of running text (`ui.prose`). */
  span5Widest: widest(5),
  /*
   * Widths in viewport units and px, for an image's `sizes`, which cannot take `%`: six columns
   * on a tablet, where the page fills the window inside its margins, and four of the page at its
   * widest.
   */
  span6Tablet: span(6, `100vw - ${2 * margin}px`),
  span4Widest: widest(4),
});

/** Font sizes in rem, so text follows the reader's own default size, named by role. */
export const type = stylex.defineConsts({
  /** Footer, notes, code blocks. */
  small: "0.875rem",
  /** Interface text and buttons. */
  text: "1rem",
  /** Running text. */
  prose: "1.125rem",
  /** The phone menu's links. */
  menu: "1.25rem",
  /** Card titles, the wordmark, an article's third-level headings. */
  title: "1.375rem",
  /** An article's second-level headings. */
  subheading: "1.75rem",
});

/** Line heights, in rem like the text, named by their factor of the unit: `x3_5` is 3.5 units. */
export const leading = stylex.defineConsts({
  x2_5: `${(2.5 * unit) / 16}rem`,
  x3: `${(3 * unit) / 16}rem`,
  x3_5: `${(3.5 * unit) / 16}rem`,
  x4: `${(4 * unit) / 16}rem`,
  x4_5: `${(4.5 * unit) / 16}rem`,
});

/** Letter spacing: the larger the text, the tighter. */
export const tracking = stylex.defineConsts({
  tight: "-0.01em",
  tighter: "-0.015em",
  tightest: "-0.02em",
});

/** Every rule on the page, borders, outlines and underlines, is one pixel wide. */
export const stroke = stylex.defineConsts({
  width: "1px",
  /** An underline's distance below the text. */
  underlineOffset: "0.2em",
});

/** The stacking order, bottom to top. */
export const layer = stylex.defineConsts({
  /** Behind its section's content: the footer's emblem. */
  behind: -1,
  /** The sticky header over the page. */
  header: 10,
  /** The skip link, once focused, over the header. */
  skip: 20,
});
