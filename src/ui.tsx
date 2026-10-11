import * as stylex from "@stylexjs/stylex";
import type { VNode } from "preact";
import { colors, fontFeatures, media, space } from "./tokens.stylex.ts";

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
    outline: { default: null, ":focus-visible": `1px solid ${colors.primary}` },
    outlineOffset: "4px",
  },
  /** The page's widest column, centred, with the side margin inside it. */
  container: {
    boxSizing: "content-box",
    maxWidth: space.page,
    marginInline: "auto",
    paddingInline: { default: space.x3, [media.desktop]: space.x4 },
  },
  /*
   * The page grid: twelve columns with a three-unit (24px) gutter inside the container, from
   * tablets up; one column on phones. Every block starts at the left column line and is as wide
   * as a whole number of columns, so text, cards and the footer share the same lines. Cards in two
   * or three equal columns with the same gutter fall on six- and four-column lines by themselves.
   */
  /** Titles: ten columns on tablets, eight on wide screens. */
  titleWidth: {
    maxWidth: {
      default: "100%",
      [media.desktop]: "calc((100% - 264px) * 10 / 12 + 216px)",
      [media.wide]: "calc((100% - 264px) * 8 / 12 + 168px)",
    },
  },
  /** Running text, leads and forms: eight columns on tablets, seven on wide screens. */
  textWidth: {
    maxWidth: {
      default: "100%",
      [media.desktop]: "calc((100% - 264px) * 8 / 12 + 168px)",
      [media.wide]: "calc((100% - 264px) * 7 / 12 + 144px)",
    },
  },
  /** Interface text: navigation, buttons, form fields. */
  text: {
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: "1.5rem",
  },
  /** Smaller interface text: badges, the footer, notes beside a heading. */
  small: {
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: "1.25rem",
  },
  /** A heading at text size: footer columns, the lists in a job card. */
  strong: { fontWeight: 500, color: colors.primary },
  /*
   * Titles and leads grow with the window, from their size on a 360px phone to their size where
   * the page stops growing (1264px, the container and its margins), so no width makes them jump.
   * Their line height follows, rounded to whole half units so lines keep to the 4px grid, with
   * ratios that round to the same heights as before at both ends. A browser without `round()`
   * takes the plain ratio.
   */
  /** A page's title: Newsreader at a medium weight, so the display cut keeps its body. 40-64px. */
  display: {
    fontFamily: serif,
    fontSize: "clamp(2.5rem, 1.9rem + 2.65vw, 4rem)",
    fontWeight: 500,
    lineHeight: stylex.firstThatWorks("round(nearest, 1.15em, 4px)", "1.15"),
    letterSpacing: "-0.02em",
    color: colors.primary,
    textWrap: "balance",
  },
  /** A section's title. 32-44px. */
  heading: {
    fontFamily: serif,
    fontSize: "clamp(2rem, 1.7rem + 1.33vw, 2.75rem)",
    fontWeight: 500,
    lineHeight: stylex.firstThatWorks("round(nearest, 1.2em, 4px)", "1.2"),
    letterSpacing: "-0.015em",
    color: colors.primary,
    textWrap: "balance",
  },
  /** A card's or a person's name: the interface face, semibold, against the serif text. */
  title: {
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: "1.375rem",
    fontWeight: 600,
    lineHeight: "1.75rem",
    letterSpacing: "-0.01em",
    color: colors.primary,
    textWrap: "balance",
  },
  /**
   * The paragraph under a title, in full ink. A few lines at most, set in even lengths like the
   * title above it, so none ends on a stray word or two. 20-24px.
   */
  lead: {
    fontFamily: serif,
    fontSize: "clamp(1.25rem, 1.15rem + 0.44vw, 1.5rem)",
    fontWeight: 400,
    lineHeight: stylex.firstThatWorks("round(nearest, 1.45em, 4px)", "1.45"),
    color: colors.primary,
    textWrap: "balance",
  },
  /** Running text. */
  prose: {
    fontFamily: serif,
    fontSize: "1.125rem",
    fontWeight: 400,
    lineHeight: "1.75rem",
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
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
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
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
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
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: space.x1,
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: "1.5rem",
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
