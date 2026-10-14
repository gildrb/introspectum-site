import * as stylex from "@stylexjs/stylex";
import type { VNode } from "preact";
import {
  colors,
  fontFeatures,
  grid,
  leading,
  media,
  space,
  stroke,
  tracking,
  type,
  weights,
} from "./tokens.stylex.ts";

/** Anything `stylex.props` accepts: a style, `false`, `null`, or a nested array of them. */
export type Style = stylex.StyleXArray<stylex.CompiledStyles | boolean | null | undefined>;

/**
 * Keeps names out of browser translation. Preact types `translate` as a boolean and drops `false`
 * from the server HTML; the HTML attribute is the string "no", so it is spread as a plain attribute.
 */
export const untranslated: Readonly<Record<string, string>> = { translate: "no" };

/** Interface: navigation, buttons, labels, forms and the footer. */
const sans = 'Inter, "Inter Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
/** Headings and running text. Both fallbacks are scaled to Newsreader's metrics (`layout.tsx`). */
const serif = 'Newsreader, "Newsreader Fallback", "Newsreader Fallback Serif", Georgia, serif';

export const ui = stylex.create({
  sans: { fontFamily: sans, fontFeatureSettings: fontFeatures.interface },
  mono: { fontFamily: '"JetBrains Mono", "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace' },
  serif: { fontFamily: serif },
  focusRing: {
    outline: { default: null, ":focus-visible": `${stroke.width} solid ${colors.primary}` },
    outlineOffset: space.half,
  },
  /** The edge of a filled block, a panel or code: a hairline inside it, taking no room. */
  edge: { boxShadow: `inset 0 0 0 ${stroke.width} ${colors.hairline}` },
  /** An image's edge, drawn over its outer pixels, so it shows on light & dark pictures alike. */
  imageEdge: {
    outline: `${stroke.width} solid ${colors.hairline}`,
    outlineOffset: `-${stroke.width}`,
  },
  /** The page's widest column, centred, with the side margin inside it. */
  container: {
    boxSizing: "content-box",
    maxWidth: space.page,
    marginInline: "auto",
    paddingInline: { default: space.x3, [media.desktop]: grid.margin },
  },
  /*
   * The page grid (`grid`): twelve columns with a three-unit (24px) gutter in the container, from
   * tablets up; one column on phones. Every block starts at the left column line and is as wide
   * as a whole number of columns, so text, cards and the footer share the same lines. Cards in two
   * or three equal columns with the same gutter fall on six- and four-column lines by themselves.
   */
  /** Titles: ten columns on tablets, eight on wide screens. */
  titleWidth: {
    maxWidth: {
      default: "100%",
      [media.desktop]: grid.span10,
      [media.wide]: grid.span8,
    },
  },
  /**
   * Leads and forms: eight columns on tablets, seven on wide screens, but never more than six of
   * the page at its widest. Running text inside keeps its own, narrower measure (`prose`).
   */
  textWidth: {
    maxWidth: {
      default: "100%",
      [media.desktop]: grid.span8,
      [media.wide]: `min(${grid.span7}, ${grid.span6Widest})`,
    },
  },
  /** Interface text: navigation, buttons, form fields. */
  text: {
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: type.text,
    fontWeight: weights.regular,
    lineHeight: leading.x3,
  },
  /** Smaller interface text: badges, the footer, notes beside a heading. */
  small: {
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: type.small,
    fontWeight: weights.regular,
    lineHeight: leading.x2_5,
  },
  /** A heading at text size: footer columns, the lists in a job card. */
  strong: { fontWeight: weights.medium, color: colors.primary },
  /*
   * Titles and leads grow with the window, from their size on a 360px phone to their size where
   * the page stops growing (1464px, the container and its margins), so no width makes them jump.
   * Their line height follows, rounded to whole half units so lines keep to the 4px grid, with
   * ratios that round to the same heights as before at both ends. A browser without `round()`
   * takes the plain ratio.
   */
  /** A page's title: Newsreader at a medium weight, so the display cut keeps its body. 40-64px. */
  display: {
    fontFamily: serif,
    fontSize: "clamp(2.5rem, 2.01rem + 2.17vw, 4rem)",
    fontWeight: weights.medium,
    lineHeight: stylex.firstThatWorks(`round(nearest, 1.15em, ${space.half})`, "1.15"),
    letterSpacing: tracking.tightest,
    color: colors.primary,
    textWrap: "balance",
  },
  /** A section's title. 32-44px. */
  heading: {
    fontFamily: serif,
    fontSize: "clamp(2rem, 1.76rem + 1.09vw, 2.75rem)",
    fontWeight: weights.medium,
    lineHeight: stylex.firstThatWorks(`round(nearest, 1.2em, ${space.half})`, "1.2"),
    letterSpacing: tracking.tighter,
    color: colors.primary,
    textWrap: "balance",
  },
  /** A card's or a person's name: the interface face, semibold, against the serif text. */
  title: {
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: type.title,
    fontWeight: weights.semibold,
    lineHeight: leading.x3_5,
    letterSpacing: tracking.tight,
    color: colors.primary,
    textWrap: "balance",
  },
  /**
   * The paragraph under a title, in full ink. A few lines at most, set in even lengths like the
   * title above it, so none ends on a stray word or two. 20-24px.
   */
  lead: {
    fontFamily: serif,
    fontSize: "clamp(1.25rem, 1.17rem + 0.36vw, 1.5rem)",
    fontWeight: weights.regular,
    lineHeight: stylex.firstThatWorks(`round(nearest, 1.45em, ${space.half})`, "1.45"),
    color: colors.primary,
    textWrap: "balance",
  },
  /** Running text, never wider than about 70 characters a line, even in a wide card. */
  prose: {
    maxWidth: grid.span5Widest,
    fontFamily: serif,
    fontSize: type.prose,
    fontWeight: weights.regular,
    lineHeight: leading.x3_5,
    color: colors.article,
  },
  label: { color: colors.secondary },
  /** Quiet text beside a heading: dates, sources. Never running text (see `colors`). */
  note: { color: colors.tertiary },
  /*
   * Links. Every link reads in full ink under the pointer and on keyboard focus, its text and a
   * 1px underline alike, so pointing at one always raises its contrast. At rest, a link in running
   * text keeps a tertiary underline to show what it is (`link`); a link that stands on its own,
   * in navigation, a card's title or a source's number, has none (`entry`, `quiet`). The page a
   * link leads to, when it is the current one, is in full ink and underlined (`current`).
   */
  /** A link standing on its own in a quieter gray: navigation lists, the footer. */
  quiet: {
    color: {
      default: colors.secondary,
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
    textDecorationLine: {
      default: "none",
      ":hover": { [media.hover]: "underline" },
      ":focus-visible": "underline",
    },
    textDecorationThickness: stroke.width,
    textUnderlineOffset: stroke.underlineOffset,
    touchAction: "manipulation",
  },
  /** A link in running text: underlined in tertiary at rest. */
  link: {
    color: {
      default: "inherit",
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
    textDecorationLine: "underline",
    textDecorationThickness: stroke.width,
    textUnderlineOffset: stroke.underlineOffset,
    textDecorationColor: {
      default: colors.tertiary,
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
  },
  /** A link standing on its own in full ink: the header, a card's title, a source's number. */
  entry: {
    color: colors.primary,
    textDecorationLine: {
      default: "none",
      ":hover": { [media.hover]: "underline" },
      ":focus-visible": "underline",
    },
    textDecorationThickness: stroke.width,
    textUnderlineOffset: stroke.underlineOffset,
    touchAction: "manipulation",
  },
  /** The link to the page it is on. */
  current: { color: colors.primary, textDecorationLine: "underline" },
  /**
   * A link that works as a control, in a menu or a list of links: a stray double-click or long
   * press selects nothing. Links in running text stay selectable, to be copied with it.
   */
  control: { userSelect: "none", WebkitUserSelect: "none" },
  /** A link or a control shaped as a button. Six units tall on phones, for a finger; five above. */
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: { default: space.x6, [media.desktop]: space.x5 },
    paddingInline: space.x3,
    borderWidth: stroke.width,
    borderStyle: "solid",
    borderRadius: space.x1,
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: type.text,
    fontWeight: weights.medium,
    lineHeight: leading.x3,
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    touchAction: "manipulation",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  /** The main action: a button in the text color, like the text it sits among. */
  primary: {
    color: colors.bg,
    backgroundColor: { default: colors.primary, ":hover": { [media.hover]: colors.secondary } },
    borderColor: { default: colors.primary, ":hover": { [media.hover]: colors.secondary } },
  },
  /** The other action beside it: the same edge, without the fill. */
  secondary: {
    color: colors.primary,
    backgroundColor: { default: "transparent", ":hover": { [media.hover]: colors.surface } },
    borderColor: colors.primary,
  },
  reset: {
    appearance: "none",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    lineHeight: "inherit",
    // Browsers reset a control's font features; controls take the page's, case forms included.
    fontFeatureSettings: "inherit",
    textAlign: "start",
    cursor: "pointer",
    touchAction: "manipulation",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});

/** For `Translator.rich`: renders a message's `<link>…</link>` part as a link to `target`. */
export function richLink(target: string) {
  return (chunks: Array<string | VNode>) => (
    <a {...stylex.props(ui.link, ui.focusRing)} href={target}>
      {chunks}
    </a>
  );
}
