import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { translators } from "./i18n.ts";
import { href, type Locale, localeInfo, locales, type Route, sourceLocale } from "./locale.ts";
import { shareFrame } from "./og.tsx";
import { company, email, origin } from "./site.ts";
import { colors, fontFeatures, media, rightToLeft, space } from "./tokens.stylex.ts";
import { type Style, ui, untranslated } from "./ui.tsx";
import { versioned } from "./versioned.ts";

/** What the build hands every page: the island script and the stylesheet StyleX collected. */
export type Assets = { script: string; css: string };

/** What a page tells the document head. */
export type Meta = {
  locale: Locale;
  path: `/${string}`;
  /**
   * The same page in every locale, for `hreflang` and the language switch. Absent on error
   * pages, which have no address of their own.
   */
  alternates?: Readonly<Record<Locale, `/${string}`>>;
  title: string;
  description: string;
  /** The page's link-preview image, a stamped site path. */
  shareImage: string;
  type: "website" | "article";
  /** False keeps the page out of search results. */
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

/** Open Graph writes locales with an underscore: `de_DE`. */
const ogLocale = (locale: Locale) => localeInfo[locale].tag.replace("-", "_");

const nav: readonly {
  route: Route;
  label: "nav_products" | "nav_join" | "nav_blog" | "nav_about";
}[] = [
  { route: "products", label: "nav_products" },
  { route: "join", label: "nav_join" },
  { route: "blog", label: "nav_blog" },
  { route: "about", label: "nav_about" },
];

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
  const { locale, path, alternates } = meta;
  const t = translators[locale];
  const home = href(locale, "home");
  const others = locales.filter((other) => other !== locale);
  return (
    <html
      lang={locale}
      dir={localeInfo[locale].dir}
      {...stylex.props(styles.html, localeInfo[locale].dir === "rtl" && rightToLeft)}
    >
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content={meta.index ? "index, follow" : "noindex, follow"} />
        {alternates && (
          <>
            <link rel="canonical" href={`${origin}${path}`} />
            {locales.map((other) => (
              <link rel="alternate" hreflang={other} href={`${origin}${alternates[other]}`} />
            ))}
            <link
              rel="alternate"
              hreflang="x-default"
              href={`${origin}${alternates[sourceLocale]}`}
            />
          </>
        )}
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content={company.name} />
        <meta property="og:locale" content={ogLocale(locale)} />
        {others.map((other) => (
          <meta property="og:locale:alternate" content={ogLocale(other)} />
        ))}
        <meta property="og:url" content={`${origin}${path}`} />
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
          href={`${origin}${localeInfo[locale].prefix}/feed.xml`}
          title={t.text("feed_title", { brand: company.name })}
        />
        <link rel="preload" href={interUrl} as="font" type="font/woff2" crossorigin="anonymous" />
        {meta.mono && (
          <link rel="preload" href={monoUrl} as="font" type="font/woff2" crossorigin="anonymous" />
        )}
        <style dangerouslySetInnerHTML={{ __html: `${globalCss}\n${assets.css}` }} />
        {meta.script && (
          // Preact's typings lack `fetchpriority` on <script>, hence the spread.
          <script type="module" src={assets.script} {...{ fetchpriority: "low" }} />
        )}
        {meta.jsonLd !== undefined && <JsonLd value={meta.jsonLd} />}
        {meta.head}
      </head>
      <body {...stylex.props(ui.sans, styles.body)}>
        <a {...stylex.props(ui.text, ui.focusRing, styles.skip)} href="#content">
          {t.text("skip_to_content")}
        </a>
        <div {...stylex.props(styles.layout)}>
          <header {...stylex.props(styles.sidebar)}>
            {path === home ? (
              <h1 {...stylex.props(ui.heading, styles.name)} {...untranslated}>
                {company.name}
              </h1>
            ) : (
              <p {...stylex.props(ui.heading, styles.name)}>
                <a {...stylex.props(styles.home, ui.focusRing)} href={home} {...untranslated}>
                  {company.name}
                </a>
              </p>
            )}
            <nav {...stylex.props(ui.text, styles.nav)} aria-label={t.text("nav_label")}>
              {nav.map(({ route, label }) => {
                const target = href(locale, route);
                const current =
                  path === target ? "page" : path.startsWith(`${target}/`) ? "true" : null;
                return (
                  <a
                    {...stylex.props(
                      ui.quiet,
                      ui.focusRing,
                      styles.tapTarget,
                      current !== null && styles.current,
                    )}
                    href={target}
                    aria-current={current ?? undefined}
                  >
                    {t.text(label)}
                  </a>
                );
              })}
            </nav>
            <p {...stylex.props(ui.text, styles.languages)}>
              {others.map((other) => (
                <a
                  {...stylex.props(ui.quiet, ui.focusRing, styles.tapTarget)}
                  href={alternates?.[other] ?? href(other, "home")}
                  hreflang={other}
                  lang={other}
                  aria-label={t.text("language_switch", { language: t.language(other) })}
                >
                  {translators[other].language(other)}
                </a>
              ))}
            </p>
            <Contact style={styles.desktopOnly} locale={locale} path={path} />
          </header>
          <main {...stylex.props(styles.content)} id="content" tabIndex={-1}>
            {children}
          </main>
          <Contact style={styles.phoneOnly} locale={locale} path={path} />
        </div>
      </body>
    </html>
  );
}

/** The address and the legal pages: at the foot of the sidebar on desktop, of the page on phones. */
function Contact({ style, locale, path }: { style: Style; locale: Locale; path: string }) {
  const t = translators[locale];
  const legal: readonly { route: Route; label: "footer_privacy" | "footer_imprint" }[] = [
    { route: "privacy", label: "footer_privacy" },
    { route: "imprint", label: "footer_imprint" },
  ];
  return (
    <footer {...stylex.props(ui.text, styles.contact, style)} aria-label={t.text("footer_label")}>
      <a
        {...stylex.props(ui.quiet, ui.focusRing, styles.email)}
        href={`mailto:${email}`}
        {...untranslated}
      >
        {email}
      </a>
      {legal.map(({ route, label }) => {
        const target = href(locale, route);
        return (
          <a
            {...stylex.props(ui.quiet, ui.focusRing, path === target && styles.current)}
            href={target}
            aria-current={path === target ? "page" : undefined}
          >
            {t.text(label)}
          </a>
        );
      })}
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

/**
 * Running text. `lead` sets it in primary, for the line a page opens with; `quiet` one step down,
 * in secondary. Never tertiary: running text can wrap past two lines, where APCA asks Lc 75.
 */
export function Text({
  lead = false,
  quiet = false,
  children,
}: {
  lead?: boolean;
  quiet?: boolean;
  children: ComponentChildren;
}) {
  return (
    <p {...stylex.props(ui.text, ui.prose, lead && blocks.lead, quiet && blocks.quiet)}>
      {children}
    </p>
  );
}

/** Items one per line, without bullets: methods, principles. */
export function Lines({ items }: { items: readonly ComponentChildren[] }) {
  return (
    <ul {...stylex.props(ui.text, ui.prose, blocks.lines)}>
      {items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
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
    insetInlineStart: { default: space.x4, [media.mobile]: phoneGutter },
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
  /** Desktop: a sticky column. Phones: the name and the language in one row, the links below. */
  sidebar: {
    position: { default: "sticky", [media.mobile]: "static" },
    top: 0,
    height: { default: "100dvh", [media.mobile]: "auto" },
    display: { default: "flex", [media.mobile]: "grid" },
    flexDirection: "column",
    gridTemplateColumns: { default: null, [media.mobile]: "minmax(0, 1fr) auto" },
    alignItems: { default: null, [media.mobile]: "baseline" },
    paddingBlock: { default: space.x6, [media.mobile]: `${space.x3} 0` },
  },
  name: {
    width: "fit-content",
    gridRow: { default: null, [media.mobile]: 1 },
    gridColumn: { default: null, [media.mobile]: 1 },
  },
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
    gridRow: { default: null, [media.mobile]: 2 },
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
  },
  languages: {
    display: "flex",
    columnGap: space.x3,
    marginTop: { default: space.x4, [media.mobile]: 0 },
    gridRow: { default: null, [media.mobile]: 1 },
    gridColumn: { default: null, [media.mobile]: 2 },
  },
  /** Phones: each link pads out to a 40px target, into the gaps around it. */
  tapTarget: {
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
  quiet: { color: colors.secondary },
  stack: { display: "flex", flexDirection: "column", rowGap: space.x2 },
  lines: { listStyle: "none" },
});
