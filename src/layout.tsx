import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { shareFrame } from "./og.tsx";
import { company, email, nav, origin } from "./site.ts";
import { colors, fontFeatures, media, space } from "./tokens.stylex.ts";
import { type Style, ui, untranslated } from "./ui.tsx";
import { versioned } from "./versioned.ts";

/** What the build hands every page: the island script and the stylesheet StyleX collected. */
export type Assets = { script: string; css: string };

/** What a page tells the document head. */
export type Meta = {
  path: `/${string}`;
  title: string;
  description: string;
  /** The page's link-preview image, a stamped site path. */
  shareImage: string;
  type: "website" | "article";
  /** False keeps the page out of search results (the waiting-list confirmation). */
  index: boolean;
  /** Loads the island script; only pages with a form have islands. */
  script: boolean;
  /** Preloads the monospace face, for pages that show code. */
  mono: boolean;
  jsonLd?: unknown;
  /** More head elements, such as an article's dates. */
  head?: ComponentChildren;
};

// Each face is subset to exactly these ranges, so declare them to the browser. Inter also carries
// Latin Extended-A (Slovenian, Czech, Polish names); the monospace face does not need it.
const monoRanges =
  "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2010-205E,U+20AC,U+2122,U+2190-21FF,U+2212,U+2500-257F";
const interRanges = `${monoRanges},U+0100-017F`;

// One URL per face, shared by its @font-face and its preload so the browser fetches it once.
const interUrl = versioned("/fonts/inter.woff2");
const monoUrl = versioned("/fonts/ioskeley-mono.woff2");

/** The few rules StyleX cannot attach to an element, layered beneath StyleX's own layers. */
const globalCss = [
  "@layer reset;",
  `@font-face{font-family:"Inter";font-weight:380 600;font-display:swap;src:url("${interUrl}") format("woff2");unicode-range:${interRanges}}`,
  `@font-face{font-family:"Ioskeley Mono";font-weight:400;font-display:optional;src:url("${monoUrl}") format("woff2");unicode-range:${monoRanges}}`,
  // Arial (or metric-identical Liberation Sans) scaled to Inter's metrics, so text laid out
  // before the web font arrives does not move when it does.
  '@font-face{font-family:"Inter Fallback";src:local("Arial"),local("Liberation Sans");size-adjust:107.35%;ascent-override:90.24%;descent-override:22.47%;line-gap-override:0%}',
  "@layer reset{*{margin:0;padding:0;box-sizing:border-box}}",
  `::selection{color:${colors.bg};background:${colors.primary}}`,
  // A touch shows nothing: no grey tap flash, and no press state takes its place.
  "a,button,input{-webkit-tap-highlight-color:transparent}",
  "@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}",
].join("\n");

/**
 * Runs in `<head>` right after the stylesheet: until Inter has loaded, the page stays hidden, so
 * the first frame is the intended one (browsers keep the previous page on screen meanwhile).
 * Capped at one second; the metric-matched fallback then shows and swaps to Inter on arrival.
 * Without JavaScript nothing is held.
 */
const fontGate = `const r=document.documentElement;const inter=[...document.fonts].find(f=>f.family.replace(/"/g,"")==="Inter");if(inter&&inter.status!=="loaded"){r.style.setProperty("--first-paint","hidden");const go=()=>r.style.removeProperty("--first-paint");inter.load().then(go,go);setTimeout(go,1000)}`;

function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(value, null, 2).replaceAll("<", "\\u003c"),
      }}
    />
  );
}

/**
 * The whole document: head, a sticky sidebar with the name and navigation on desktop (a header on
 * phones), and the page's content.
 */
export function Page({
  assets,
  meta,
  children,
}: {
  assets: Assets;
  meta: Meta;
  children: ComponentChildren;
}) {
  const url = `${origin}${meta.path === "/" ? "/" : meta.path}`;
  const home = meta.path === "/";
  return (
    <html lang="en" {...stylex.props(styles.html)}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content={meta.index ? "index, follow" : "noindex, follow"} />
        <link rel="canonical" href={url} />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content={company.name} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={`${origin}${meta.shareImage}`} />
        <meta property="og:image:width" content={String(shareFrame.width)} />
        <meta property="og:image:height" content={String(shareFrame.height)} />
        <meta property="og:image:alt" content={meta.title} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="alternate"
          type="application/rss+xml"
          href={`${origin}/feed.xml`}
          title={`${company.name} blog`}
        />
        <link rel="preload" href={interUrl} as="font" type="font/woff2" crossorigin="anonymous" />
        {meta.mono && (
          <link rel="preload" href={monoUrl} as="font" type="font/woff2" crossorigin="anonymous" />
        )}
        <style dangerouslySetInnerHTML={{ __html: `${globalCss}\n${assets.css}` }} />
        {/* After the stylesheet, so the Inter @font-face exists when the gate asks for it. */}
        <script data-cfasync="false" dangerouslySetInnerHTML={{ __html: fontGate }} />
        {meta.script && (
          // Preact's typings lack `fetchpriority` on <script>, hence the spread.
          <script
            data-cfasync="false"
            type="module"
            src={assets.script}
            {...{ fetchpriority: "low" }}
          />
        )}
        {meta.jsonLd !== undefined && <JsonLd value={meta.jsonLd} />}
        {meta.head}
      </head>
      <body {...stylex.props(ui.sans, styles.body)}>
        <a {...stylex.props(ui.text, ui.focusRing, styles.skip)} href="#content">
          Skip to content
        </a>
        <div {...stylex.props(styles.layout)}>
          <header {...stylex.props(styles.sidebar)}>
            {home ? (
              <h1 {...stylex.props(ui.heading, styles.name)} {...untranslated}>
                {company.name}
              </h1>
            ) : (
              <p {...stylex.props(ui.heading, styles.name)}>
                <a {...stylex.props(styles.home, ui.focusRing)} href="/" {...untranslated}>
                  {company.name}
                </a>
              </p>
            )}
            <nav {...stylex.props(ui.text, styles.nav)} aria-label="Main">
              {nav.map(({ label, href }) => {
                const current =
                  meta.path === href ? "page" : meta.path.startsWith(`${href}/`) ? "true" : null;
                return (
                  <a
                    {...stylex.props(
                      ui.quiet,
                      ui.focusRing,
                      styles.navLink,
                      current !== null && styles.current,
                    )}
                    href={href}
                    aria-current={current ?? undefined}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
            <Contact style={styles.desktopOnly} path={meta.path} />
          </header>
          <main {...stylex.props(styles.content)} id="content" tabIndex={-1}>
            {children}
          </main>
          <Contact style={styles.phoneOnly} path={meta.path} />
        </div>
      </body>
    </html>
  );
}

/** The address and the privacy policy: at the foot of the sidebar on desktop, of the page on phones. */
function Contact({ style, path }: { style: Style; path: string }) {
  const privacy = path === "/privacy";
  return (
    <footer {...stylex.props(ui.text, styles.contact, style)}>
      <a
        {...stylex.props(ui.quiet, ui.focusRing, styles.email)}
        href={`mailto:${email}`}
        {...untranslated}
      >
        {email}
      </a>
      <a
        {...stylex.props(ui.quiet, ui.focusRing, privacy && styles.current)}
        href="/privacy"
        aria-current={privacy ? "page" : undefined}
      >
        Privacy
      </a>
    </footer>
  );
}

/**
 * A page's title in the heading style, where the homepage's opening line sits. `note` is a quiet
 * line under it: a product's status, a post's date and author.
 */
export function Title({
  note,
  children,
}: {
  note?: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <header {...stylex.props(blocks.title)}>
      <h1 {...stylex.props(ui.heading)}>{children}</h1>
      {note !== undefined && <p {...stylex.props(ui.text, ui.note)}>{note}</p>}
    </header>
  );
}

/** A labelled part of a page; the label is its heading, set at body size in secondary gray. */
export function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ComponentChildren;
}) {
  return (
    <section {...stylex.props(blocks.section)} aria-labelledby={id}>
      <h2 {...stylex.props(ui.text, ui.label, blocks.label)} id={id}>
        {label}
      </h2>
      <Stack>{children}</Stack>
    </section>
  );
}

/** Blocks of text one after another, two units apart. */
export function Stack({ children }: { children: ComponentChildren }) {
  return <div {...stylex.props(blocks.stack)}>{children}</div>;
}

/** Running text. `lead` sets it in primary, for the line a page opens with. */
export function Text({
  lead = false,
  note = false,
  children,
}: {
  lead?: boolean;
  note?: boolean;
  children: ComponentChildren;
}) {
  return (
    <p {...stylex.props(ui.text, ui.prose, lead && blocks.lead, note && ui.note)}>{children}</p>
  );
}

/** The page's side margin on phones. */
const phoneGutter = space.x2;

const styles = stylex.create({
  html: {
    backgroundColor: colors.bg,
    colorScheme: "light dark",
    scrollbarGutter: { default: null, [media.desktop]: "stable" },
  },
  body: {
    // Held hidden by the font gate until Inter is ready; see `fontGate`.
    visibility: "var(--first-paint, visible)",
    minHeight: "100dvh",
    backgroundColor: colors.bg,
    color: colors.primary,
    fontFeatureSettings: fontFeatures.interface,
    fontWeight: 400,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    WebkitTextSizeAdjust: "100%",
    textRendering: "optimizeLegibility",
  },
  /** Hidden until focused, then set over the name in its place. */
  skip: {
    position: "absolute",
    zIndex: 2,
    top: { default: space.x6, [media.mobile]: space.x3 },
    left: { default: space.x4, [media.mobile]: phoneGutter },
    color: colors.primary,
    backgroundColor: colors.bg,
    textDecoration: "none",
    clipPath: { default: "inset(50%)", ":focus-visible": "none" },
  },
  /** Desktop: sidebar and content columns, centered. Phones: one column. */
  layout: {
    display: "grid",
    gridTemplateColumns: {
      default: `${space.sidebar} minmax(0, ${space.content})`,
      [media.mobile]: "minmax(0, 1fr)",
    },
    columnGap: space.x6,
    maxWidth: space.layout,
    marginInline: "auto",
    boxSizing: "content-box",
    paddingInline: { default: space.x4, [media.mobile]: phoneGutter },
  },
  sidebar: {
    position: { default: "sticky", [media.mobile]: "static" },
    top: 0,
    height: { default: "100dvh", [media.mobile]: "auto" },
    display: "flex",
    flexDirection: "column",
    paddingBlock: { default: space.x6, [media.mobile]: `${space.x3} 0` },
  },
  name: { width: "fit-content" },
  home: {
    color: "inherit",
    textDecoration: "none",
  },
  nav: {
    display: "flex",
    flexDirection: { default: "column", [media.mobile]: "row" },
    flexWrap: "wrap",
    alignItems: "flex-start",
    rowGap: { default: space.x1, [media.mobile]: 0 },
    columnGap: space.x3,
    marginTop: { default: space.x4, [media.mobile]: space.x2 },
  },
  /** Phones: each link pads out to a 40px target, into the gaps around it. */
  navLink: {
    paddingBlock: { default: null, [media.mobile]: space.x1 },
    marginBlock: { default: null, [media.mobile]: `calc(${space.x1} * -1)` },
  },
  current: { color: colors.primary },
  content: {
    minWidth: 0,
    minHeight: { default: "100dvh", [media.mobile]: 0 },
    paddingBlock: { default: space.x6, [media.mobile]: `${space.x4} ${space.x6}` },
    outline: "none",
  },
  contact: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x1,
    marginTop: { default: "auto", [media.mobile]: 0 },
    paddingBottom: { default: null, [media.mobile]: space.x6 },
  },
  // An address is lowercase: its @ keeps the default form, not the capitals' one.
  email: { fontFeatureSettings: fontFeatures.prose },
  desktopOnly: { display: { default: "flex", [media.mobile]: "none" } },
  phoneOnly: { display: { default: "none", [media.mobile]: "flex" } },
});

const blocks = stylex.create({
  title: { marginBottom: space.x4 },
  section: { marginTop: space.x6 },
  label: { marginBottom: space.x1 },
  lead: { color: colors.primary },
  stack: { display: "flex", flexDirection: "column", rowGap: space.x2 },
});
