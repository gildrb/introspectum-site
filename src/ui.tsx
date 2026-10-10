import * as stylex from "@stylexjs/stylex";
import type { VNode } from "preact";
import { arrows, colors, fontFeatures, media, space } from "./tokens.stylex.ts";

/** Anything `stylex.props` accepts: a style, `false`, `null`, or a nested array of them. */
export type Style = stylex.StyleXArray<stylex.CompiledStyles | boolean | null | undefined>;

/**
 * Keeps names out of browser translation. Preact types `translate` as a boolean and drops `false`
 * from the server HTML; the HTML attribute is the string "no", so it is spread as a plain attribute.
 */
export const untranslated: Readonly<Record<string, string>> = { translate: "no" };

const sans = 'Inter, "Inter Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const ui = stylex.create({
  sans: { fontFamily: sans },
  mono: { fontFamily: '"Ioskeley Mono", "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace' },
  focusRing: {
    outline: { default: null, ":focus-visible": `1px solid ${colors.primary}` },
    outlineOffset: space.x1,
  },
  /** Interface text: pixel-fixed on phones, `rem`-scaled from tablets up. */
  text: {
    fontSize: { default: "16px", [media.desktop]: "1rem" },
    fontWeight: 400,
    lineHeight: { default: space.x3, [media.desktop]: "1.5rem" },
  },
  /** The one larger style: the site name, page titles and the homepage's opening line. */
  heading: {
    fontSize: { default: "19px", [media.desktop]: "1.1875rem" },
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: { default: space.x3, [media.desktop]: "1.5rem" },
    color: colors.primary,
    textWrap: "balance",
  },
  /** Running text: no line ends on a lone word, and hyphens sit among lowercase letters. */
  prose: {
    color: colors.article,
    fontWeight: colors.proseWeight,
    fontFeatureSettings: fontFeatures.prose,
    textWrap: "pretty",
  },
  /** Names a section: body size, one step down the gray ladder. */
  label: { color: colors.secondary },
  /** Quiet text beside prose: dates, statuses, sources. */
  note: { color: colors.tertiary },
  /**
   * Secondary links. Hover (where there is hover) and keyboard focus raise them to full contrast;
   * a finger's press shows nothing.
   */
  quiet: {
    color: {
      default: colors.tertiary,
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
  /** The name of an item in a list (a product, a post): primary, underlined on hover. */
  entry: {
    color: colors.primary,
    textDecorationLine: { default: "none", ":hover": { [media.hover]: "underline" } },
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
    textDecorationColor: colors.tertiary,
  },
  /** A link that leads on within the site. */
  onward: { "::after": { content: arrows.onward, fontFamily: sans } },
  /** A link that leaves the site. */
  outbound: { "::after": { content: arrows.outbound, fontFamily: sans } },
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
