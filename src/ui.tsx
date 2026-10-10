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
  /** A page's title. */
  display: {
    fontFamily: serif,
    fontSize: { default: "2.5rem", [media.desktop]: "4rem" },
    fontWeight: 400,
    lineHeight: { default: "3rem", [media.desktop]: "4.5rem" },
    letterSpacing: "-0.02em",
    color: colors.primary,
    textWrap: "balance",
  },
  /** A section's title. */
  heading: {
    fontFamily: serif,
    fontSize: { default: "2rem", [media.desktop]: "2.75rem" },
    fontWeight: 400,
    lineHeight: { default: "2.5rem", [media.desktop]: "3.25rem" },
    letterSpacing: "-0.015em",
    color: colors.primary,
    textWrap: "balance",
  },
  /** A card's or a person's name. */
  title: {
    fontFamily: serif,
    fontSize: "1.5rem",
    fontWeight: 500,
    lineHeight: "2rem",
    letterSpacing: "-0.01em",
    color: colors.primary,
  },
  /** The paragraph under a title. */
  lead: {
    fontFamily: serif,
    fontSize: { default: "1.25rem", [media.desktop]: "1.375rem" },
    fontWeight: colors.proseWeight,
    lineHeight: { default: "1.75rem", [media.desktop]: "2rem" },
    color: colors.secondary,
    textWrap: "pretty",
  },
  /** Running text. */
  prose: {
    fontFamily: serif,
    fontSize: "1.125rem",
    fontWeight: colors.proseWeight,
    lineHeight: "1.75rem",
    color: colors.article,
    textWrap: "pretty",
  },
  label: { color: colors.secondary },
  /** Quiet text beside a heading: dates, sources. Never running text (see `colors`). */
  note: { color: colors.tertiary },
  /** Navigation and footer links: secondary, full contrast on hover and keyboard focus. */
  quiet: {
    color: {
      default: colors.secondary,
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
    textDecoration: "none",
    touchAction: "manipulation",
  },
  /** A link in running text: underlined in tertiary, the underline taking the text color on hover. */
  link: {
    color: { default: "inherit", ":focus-visible": colors.primary },
    textDecorationLine: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
    textDecorationColor: {
      default: colors.tertiary,
      ":hover": { [media.hover]: "currentColor" },
    },
  },
  /** A card's title link: primary, underlined on hover. */
  entry: {
    color: colors.primary,
    textDecorationLine: { default: "none", ":hover": { [media.hover]: "underline" } },
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.15em",
  },
  /** A link or a control shaped as a button. Six units tall on phones, for a finger; five above. */
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: { default: space.x6, [media.desktop]: space.x5 },
    paddingInline: space.x3,
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "999px",
    fontFamily: sans,
    fontFeatureSettings: fontFeatures.interface,
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: "1.5rem",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    touchAction: "manipulation",
  },
  primary: {
    color: colors.bg,
    backgroundColor: { default: colors.primary, ":hover": { [media.hover]: colors.secondary } },
    borderColor: { default: colors.primary, ":hover": { [media.hover]: colors.secondary } },
  },
  secondary: {
    color: colors.primary,
    backgroundColor: "transparent",
    borderColor: { default: colors.tertiary, ":hover": { [media.hover]: colors.primary } },
  },
  /** On a panel in the text color, the closing call to action: the page's colors swapped. */
  inverse: {
    color: colors.primary,
    backgroundColor: colors.bg,
    borderColor: colors.bg,
  },
  inverseOutline: {
    color: colors.bg,
    backgroundColor: "transparent",
    borderColor: colors.bg,
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
