import * as stylex from "@stylexjs/stylex";

const light = "@media (prefers-color-scheme: light)";

/**
 * The layout's one unit, in px. Every gap, margin, padding and layout width is a whole multiple of
 * it; line heights are multiples of half a unit. Boxes that hold text take their height from the
 * text instead (`caps`), rounded to half a unit.
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

/** Each color as the dark scheme (the default) & the light one set it; see `colors`. */
const tabula = {
  bg: { dark: "oklch(18.5% 0.008 85)", light: "oklch(98.8% 0.004 85)" },
  surface: { dark: "oklch(26% 0.009 85)", light: "oklch(96.2% 0.006 85)" },
  primary: { dark: "oklch(96.74% 0.006 85)", light: "oklch(24.9% 0.01 85)" },
  secondary: { dark: "oklch(86.06% 0.01 85)", light: "oklch(42.55% 0.012 85)" },
  tertiary: { dark: "oklch(77.62% 0.012 85)", light: "oklch(50.5% 0.014 85)" },
  article: { dark: "oklch(93.09% 0.007 85)", light: "oklch(33% 0.01 85)" },
  accent: { dark: "oklch(44% 0.1 160)", light: "oklch(40% 0.09 160)" },
  hairline: { dark: "oklch(96.74% 0.006 85 / 0.16)", light: "oklch(24.9% 0.01 85 / 0.14)" },
  codeBg: { dark: "oklch(24% 0.009 85)", light: "oklch(95.4% 0.006 85)" },
} as const;

/**
 * The colors of the Tabula Smaragdina, the "emerald tablet", as Heinrich Khunrath's 1609
 * engraving shows it: iron-gall ink on paper, and the emerald of its name. Every neutral, grounds,
 * text, edges & shadows, shares one warm hue (85) at low chroma, 0.004 to 0.014, so no part of the
 * page reads as dyed beside another, in either scheme or the footer's other one: light is ink on
 * paper all but white, dark is that paper on umber; both follow the system setting.
 *
 * Every text color meets APCA's Bronze level on the page and on `surface`, the ground of cards.
 * Body text, a block of more than two lines, needs at least Lc 75: `primary` (Lc 100 light, Lc 100
 * dark), `article` (Lc 96, Lc 92) and `secondary` (Lc 86, Lc 78; on cards Lc 81, Lc 75.7), which
 * may run that long. Other content text, such as labels, navigation, notes and the footer, needs
 * at least Lc 60: `tertiary` (Lc 77 light, Lc 62 dark; on cards Lc 72, Lc 60.2), which therefore
 * never sets running text. In light, `tertiary` also meets WCAG 2's 4.5:1 (5.7:1, on cards 5.3:1),
 * which Lighthouse checks. Buttons are ink on paper in light and paper on umber in dark, like the
 * text. Emerald, the brand color, stays a trace: the form's checkbox.
 */
export const colors = stylex.defineVars({
  bg: { default: tabula.bg.dark, [light]: tabula.bg.light },
  /**
   * Cards and the form: a shade further into the paper, or out of the umber. Dark is as light as
   * `secondary` & `tertiary` allow on it (Lc 75 & Lc 60).
   */
  surface: { default: tabula.surface.dark, [light]: tabula.surface.light },
  primary: { default: tabula.primary.dark, [light]: tabula.primary.light },
  secondary: { default: tabula.secondary.dark, [light]: tabula.secondary.light },
  tertiary: { default: tabula.tertiary.dark, [light]: tabula.tertiary.light },
  article: { default: tabula.article.dark, [light]: tabula.article.light },
  /** Emerald, the brand color, used sparingly: the form's checkbox. */
  accent: { default: tabula.accent.dark, [light]: tabula.accent.light },
  /**
   * The edge of an image, so a white scan does not melt into the page. Only inputs and buttons
   * have edges besides; cards, panels, the form, code and the menus have none.
   * Translucent, so one edge sharpens every ground it lies on. Decoration only: each reads the
   * same without it, so it may stay below APCA's Lc 15 for meaningful non-text.
   */
  hairline: { default: tabula.hairline.dark, [light]: tabula.hairline.light },
  codeBg: { default: tabula.codeBg.dark, [light]: tabula.codeBg.light },
});

/**
 * The other scheme's colors, for a part of the page set apart from it: the footer, a card in the
 * light scheme's colors on the dark page, and in the dark scheme's on the light page. Each pair
 * keeps the contrast `colors` promises, as it is the same pair.
 */
export const otherColors = stylex.createTheme(colors, {
  bg: { default: tabula.bg.light, [light]: tabula.bg.dark },
  surface: { default: tabula.surface.light, [light]: tabula.surface.dark },
  primary: { default: tabula.primary.light, [light]: tabula.primary.dark },
  secondary: { default: tabula.secondary.light, [light]: tabula.secondary.dark },
  tertiary: { default: tabula.tertiary.light, [light]: tabula.tertiary.dark },
  article: { default: tabula.article.light, [light]: tabula.article.dark },
  accent: { default: tabula.accent.light, [light]: tabula.accent.dark },
  hairline: { default: tabula.hairline.light, [light]: tabula.hairline.dark },
  codeBg: { default: tabula.codeBg.light, [light]: tabula.codeBg.dark },
});

/**
 * The menus over the page, without an edge: a close shadow & a wide one under the menu, the page's
 * ink at low strength, so the menu lifts off what it covers.
 */
export const shadows = stylex.defineVars({
  raised: {
    default: "0 1px 2px oklch(8% 0.006 85 / 0.32), 0 8px 24px oklch(8% 0.006 85 / 0.4)",
    [light]: "0 1px 2px oklch(24.9% 0.01 85 / 0.08), 0 8px 24px oklch(24.9% 0.01 85 / 0.1)",
  },
});

/**
 * The main button's lens (`ui.primary`): shown & turning only while the pointer rests on the
 * button or the keyboard is on it, so the button sets both on itself & its lens reads them.
 */
export const lens = stylex.defineVars({ play: "paused", show: "0" });

/**
 * Rings seen down a bore, as a mask: radius 100 & each next one 0.85 of the last, every stroke an
 * 80th of its radius, so the set is its own image at 0.85 its size & a lens drawn from it turns
 * without a seam (`ui.primary`).
 */
export const rings = stylex.defineConsts({
  image: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-100 -100 200 200' fill='none' stroke='black'><circle r='100' stroke-width='1.25'/><circle r='85' stroke-width='1.0625'/><circle r='72.25' stroke-width='0.9031'/><circle r='61.4125' stroke-width='0.7677'/><circle r='52.2006' stroke-width='0.6525'/><circle r='44.3705' stroke-width='0.5546'/><circle r='37.715' stroke-width='0.4714'/><circle r='32.0577' stroke-width='0.4007'/><circle r='27.2491' stroke-width='0.3406'/><circle r='23.1617' stroke-width='0.2895'/><circle r='19.6874' stroke-width='0.2461'/><circle r='16.7343' stroke-width='0.2092'/><circle r='14.2242' stroke-width='0.1778'/><circle r='12.0906' stroke-width='0.1511'/><circle r='10.277' stroke-width='0.1285'/><circle r='8.7354' stroke-width='0.1092'/><circle r='7.4251' stroke-width='0.0928'/><circle r='6.3114' stroke-width='0.0789'/><circle r='5.3647' stroke-width='0.0671'/><circle r='4.56' stroke-width='0.057'/><circle r='3.876' stroke-width='0.0485'/><circle r='3.2946' stroke-width='0.0412'/><circle r='2.8004' stroke-width='0.035'/><circle r='2.3803' stroke-width='0.0298'/><circle r='2.0233' stroke-width='0.0253'/><circle r='1.7198' stroke-width='0.0215'/></svg>")`,
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

/** The other scheme's weights, for the parts in `otherColors`. */
export const otherWeights = stylex.createTheme(weights, {
  regular: { default: 430, [light]: 400 },
  medium: { default: 530, [light]: 500 },
  semibold: { default: 630, [light]: 600 },
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
  /** The least height a drawn machine is drawn at beside text: forty units. */
  band: `${40 * unit}px`,
  /** The height of an opening whose figure is its centre of interest: eighty units. */
  stage: `${80 * unit}px`,
  /** The widest column, twelve grid columns: header, sections and footer. */
  page: `${page}px`,
});

/**
 * Heights of boxes that hold text or sit in a line of it (controls, rows, icons, the header), in
 * the cap height of their own text (`cap`): they grow with the text and the reader's default size.
 * Each rounds to the nearest half unit, so it stays on the grid. Named by their factor: `x3_5` is
 * 3.5 caps. Inter's capitals are 0.7275 em: at 1rem `x3_5` is 40px, at 0.875rem `x3` is 32px. A
 * box takes the cap of its own font, so set the font on it or above it, not only on its children.
 */
export const caps = stylex.defineConsts({
  x1_5: `round(nearest, 1.5cap, ${unit / 2}px)`,
  x2_5: `round(nearest, 2.5cap, ${unit / 2}px)`,
  x2_75: `round(nearest, 2.75cap, ${unit / 2}px)`,
  x3: `round(nearest, 3cap, ${unit / 2}px)`,
  x3_25: `round(nearest, 3.25cap, ${unit / 2}px)`,
  x3_5: `round(nearest, 3.5cap, ${unit / 2}px)`,
  x4: `round(nearest, 4cap, ${unit / 2}px)`,
  x4_75: `round(nearest, 4.75cap, ${unit / 2}px)`,
  /** The header's height: 5.5 caps of interface text, 64px at 1rem. */
  bar: `round(nearest, 5.5cap, ${unit / 2}px)`,
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

/**
 * Letter spacing: the larger the text, the tighter. Newsreader's text cut sets loosely for a
 * title's size, so the serif titles & leads close up enough to read as one firm line.
 */
export const tracking = stylex.defineConsts({
  tight: "-0.01em",
  tighter: "-0.025em",
  tightest: "-0.03em",
});

/** Every rule on the page, borders, outlines and underlines, is one pixel wide. */
export const stroke = stylex.defineConsts({
  width: "1px",
  /** An underline's distance below the text. */
  underlineOffset: "0.2em",
});

/** The stacking order, bottom to top. */
export const layer = stylex.defineConsts({
  /** The sticky header over the page. */
  header: 10,
  /** The skip link, once focused, over the header. */
  skip: 20,
  /** Menus & a list's choices, opened over everything, the header & the skip link included. */
  popover: 30,
});
