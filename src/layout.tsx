import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { translators } from "./i18n.ts";
import { href, type Locale, localeInfo, locales, type Route, sourceLocale } from "./locale.ts";
import { shareFrame } from "./og.tsx";
import { company, email, mailto, origin, products } from "./site.ts";
import { colors, fontFeatures, media, space } from "./tokens.stylex.ts";
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

// Newsreader and JetBrains Mono come as Google Fonts subsets them: Latin, and Latin Extended for
// names such as Slovenian, Czech or Polish ones. The browser fetches a subset only for text that
// needs it.
const latin =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const latinExtended =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF";
// Inter is subset to exactly these ranges: Latin-1, Latin Extended-A and punctuation.
const interRanges =
  "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2010-205E,U+20AC,U+2122,U+2190-21FF,U+2212,U+2500-257F,U+0100-017F";

// One URL per face, shared by its @font-face and its preload so the browser fetches it once.
const serifUrl = versioned("/fonts/newsreader-latin.woff2");
const interUrl = versioned("/fonts/inter.woff2");
const monoUrl = versioned("/fonts/jetbrains-mono-latin.woff2");

/** Newsreader's four files: upright and italic, each in Latin and Latin Extended. */
const serifFaces = (
  [
    ["normal", serifUrl, latin],
    ["normal", versioned("/fonts/newsreader-latin-ext.woff2"), latinExtended],
    ["italic", versioned("/fonts/newsreader-italic-latin.woff2"), latin],
    ["italic", versioned("/fonts/newsreader-italic-latin-ext.woff2"), latinExtended],
  ] as const
).map(
  ([style, url, ranges]) =>
    `@font-face{font-family:"Newsreader";font-style:${style};font-weight:200 800;font-display:swap;src:url("${url}") format("woff2");unicode-range:${ranges}}`,
);

/** JetBrains Mono, upright only, for code. Shown only if it arrives in time: code never reflows. */
const monoFaces = (
  [
    [monoUrl, latin],
    [versioned("/fonts/jetbrains-mono-latin-ext.woff2"), latinExtended],
  ] as const
).map(
  ([url, ranges]) =>
    `@font-face{font-family:"JetBrains Mono";font-weight:100 800;font-display:optional;src:url("${url}") format("woff2");unicode-range:${ranges}}`,
);

/** The few rules StyleX cannot attach to an element, layered beneath StyleX's own layers. */
const globalCss = [
  "@layer reset;",
  ...serifFaces,
  `@font-face{font-family:"Inter";font-weight:380 600;font-display:swap;src:url("${interUrl}") format("woff2");unicode-range:${interRanges}}`,
  ...monoFaces,
  // Local faces scaled to the web fonts' metrics, so text laid out before a web font arrives does
  // not move when it does: Arial (or metric-identical Liberation Sans) for Inter; Georgia, else
  // Times New Roman (or Liberation Serif), for Newsreader at its default optical size.
  '@font-face{font-family:"Inter Fallback";src:local("Arial"),local("Liberation Sans");size-adjust:107.35%;ascent-override:90.24%;descent-override:22.47%;line-gap-override:0%}',
  '@font-face{font-family:"Newsreader Fallback";src:local("Georgia");size-adjust:91.75%;ascent-override:80.11%;descent-override:28.88%;line-gap-override:0%}',
  '@font-face{font-family:"Newsreader Fallback Serif";src:local("Times New Roman"),local("Liberation Serif");size-adjust:100.68%;ascent-override:73.01%;descent-override:26.32%;line-gap-override:0%}',
  "@layer reset{*{margin:0;padding:0;box-sizing:border-box}}",
  `::selection{color:${colors.bg};background:${colors.primary}}`,
  // A touch shows nothing: no grey tap flash, and no press state takes its place.
  "a,button,input,summary{-webkit-tap-highlight-color:transparent}",
  // The phone menu's toggle is a button, without the disclosure triangle.
  "summary{list-style:none}summary::-webkit-details-marker{display:none}",
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

/** `aria-current` for a link to `target` from `path`: the page itself, or a page below it. */
function currentness(path: string, target: string): "page" | "true" | undefined {
  if (path === target) return "page";
  if (target !== "/" && path.startsWith(`${target}/`)) return "true";
  return undefined;
}

/**
 * The whole document: head, a sticky header with the name, the navigation, the other language and
 * the contact button (behind a menu button on phones), the page's content, and the footer.
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
  const others = locales.filter((other) => other !== locale);
  const contact = mailto(t.text("consulting_subject"));
  const links = nav.map(({ route, label }) => {
    const target = href(locale, route);
    return { target, current: currentness(path, target), label: t.text(label) };
  });
  return (
    <html lang={locale} dir={localeInfo[locale].dir} {...stylex.props(styles.html)}>
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
        {/* The page backgrounds, `colors.bg`, in sRGB. */}
        <meta name="theme-color" content="#17120c" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f8f1e3" media="(prefers-color-scheme: light)" />
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
        <link rel="preload" href={serifUrl} as="font" type="font/woff2" crossorigin="anonymous" />
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
        <header {...stylex.props(styles.header)}>
          <div {...stylex.props(ui.container, styles.bar)}>
            <a
              {...stylex.props(ui.serif, ui.focusRing, styles.wordmark)}
              href={href(locale, "home")}
              aria-current={currentness(path, href(locale, "home")) === "page" ? "page" : undefined}
              {...untranslated}
            >
              {company.name}
            </a>
            <nav {...stylex.props(styles.nav)} aria-label={t.text("nav_label")}>
              {links.map(({ target, current, label }) => (
                <a
                  {...stylex.props(
                    ui.text,
                    ui.entry,
                    ui.focusRing,
                    current !== undefined && ui.current,
                  )}
                  href={target}
                  aria-current={current}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div {...stylex.props(styles.actions)}>
              <a {...stylex.props(ui.button, ui.primary, ui.focusRing)} href={contact}>
                {t.text("nav_contact")}
              </a>
            </div>
            <details {...stylex.props(styles.menu)}>
              <summary {...stylex.props(ui.button, ui.secondary, ui.focusRing, styles.toggle)}>
                {t.text("nav_menu")}
              </summary>
              <div {...stylex.props(styles.panel)}>
                <nav {...stylex.props(styles.panelNav)} aria-label={t.text("nav_label")}>
                  {links.map(({ target, current, label }) => (
                    <a
                      {...stylex.props(
                        ui.entry,
                        ui.focusRing,
                        styles.panelLink,
                        current !== undefined && ui.current,
                      )}
                      href={target}
                      aria-current={current}
                    >
                      {label}
                    </a>
                  ))}
                </nav>
                <div {...stylex.props(styles.panelFoot)}>
                  <a {...stylex.props(ui.button, ui.primary, ui.focusRing)} href={contact}>
                    {t.text("nav_contact")}
                  </a>
                </div>
              </div>
            </details>
          </div>
        </header>
        <main {...stylex.props(styles.main)} id="content" tabIndex={-1}>
          {children}
        </main>
        <Footer meta={meta} />
      </body>
    </html>
  );
}

/** Links to this page in the other languages, each named in its own language. */
function Languages({ meta, style }: { meta: Meta; style: Style }) {
  const t = translators[meta.locale];
  return (
    <>
      {locales
        .filter((other) => other !== meta.locale)
        .map((other) => (
          <a
            {...stylex.props(ui.quiet, ui.focusRing, style)}
            href={meta.alternates?.[other] ?? href(other, "home")}
            hreflang={other}
            lang={other}
            aria-label={t.text("language_switch", { language: t.language(other) })}
          >
            {translators[other].language(other)}
          </a>
        ))}
    </>
  );
}

/** The name and address, every page by group, the legal pages, and the other languages. */
function Footer({ meta }: { meta: Meta }) {
  const { locale, path } = meta;
  const t = translators[locale];
  const page = (route: Route, label: string) => ({ target: href(locale, route), label });
  const groups = [
    {
      title: t.text("nav_products"),
      place: styles.groupFirst,
      links: products.map((product) => ({
        target: href(locale, "products", product.slug),
        label: t.text(product.name),
      })),
    },
    {
      title: t.text("footer_company"),
      place: styles.groupSecond,
      links: [
        page("about", t.text("nav_about")),
        page("join", t.text("nav_join")),
        page("blog", t.text("nav_blog")),
      ],
    },
    {
      title: t.text("footer_legal"),
      place: styles.groupThird,
      links: [page("privacy", t.text("footer_privacy")), page("imprint", t.text("footer_imprint"))],
    },
  ];
  return (
    <footer>
      <div {...stylex.props(ui.container, styles.footerColumns, styles.footerGrid)}>
        <div {...stylex.props(styles.footerBrand)}>
          <p {...stylex.props(ui.serif, styles.wordmark)} {...untranslated}>
            {company.name}
          </p>
          <p {...stylex.props(ui.small, ui.label)}>{t.text("tagline")}</p>
          <a
            {...stylex.props(ui.small, ui.quiet, ui.focusRing, styles.email)}
            href={`mailto:${email}`}
            {...untranslated}
          >
            {email}
          </a>
        </div>
        {groups.map(({ title, place, links }) => (
          <div {...stylex.props(place)}>
            <h2 {...stylex.props(ui.small, ui.strong)}>{title}</h2>
            <ul {...stylex.props(styles.footerList)}>
              {links.map(({ target, label }) => (
                <li>
                  <a
                    {...stylex.props(
                      ui.small,
                      ui.quiet,
                      ui.focusRing,
                      path === target && ui.current,
                    )}
                    href={target}
                    aria-current={path === target ? "page" : undefined}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {/* The other language sits on the column line of the first group of links, Products. */}
      <div {...stylex.props(ui.container, styles.footerColumns, styles.footerBase)}>
        <p {...stylex.props(ui.small, ui.note, styles.copyright)}>
          {t.text("footer_copyright", {
            year: String(new Date().getUTCFullYear()),
            company: company.legalName,
          })}
        </p>
        <p {...stylex.props(styles.otherLanguage)}>
          <Languages meta={meta} style={ui.small} />
        </p>
      </div>
    </footer>
  );
}

const styles = stylex.create({
  html: {
    backgroundColor: colors.bg,
    colorScheme: "light dark",
    // Anchored sections stop below the sticky header, not under it.
    scrollPaddingTop: space.bar,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    backgroundColor: colors.bg,
    color: colors.primary,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    WebkitTextSizeAdjust: "100%",
    textRendering: "optimizeLegibility",
    // No paragraph ends on a word alone; titles balance their lines instead (`ui.display`).
    textWrap: "pretty",
  },
  /** Hidden until focused, then set over the header. */
  skip: {
    position: "absolute",
    zIndex: 20,
    top: space.x2,
    insetInlineStart: space.x2,
    paddingInline: space.x2,
    paddingBlock: space.x1,
    color: colors.primary,
    backgroundColor: colors.bg,
    clipPath: { default: "inset(50%)", ":focus-visible": "none" },
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: colors.bg,
  },
  bar: {
    display: "flex",
    alignItems: "center",
    columnGap: space.x4,
    height: space.bar,
  },
  wordmark: {
    flexShrink: 0,
    fontSize: "1.375rem",
    fontWeight: 600,
    lineHeight: "2rem",
    letterSpacing: "-0.01em",
    color: colors.primary,
    textDecoration: "none",
  },
  /** Desktop: the links sit on the right, next to the contact button. */
  nav: {
    display: { default: "none", [media.desktop]: "flex" },
    columnGap: space.x4,
    marginInlineStart: "auto",
  },
  actions: {
    display: { default: "none", [media.desktop]: "flex" },
    alignItems: "center",
    columnGap: space.x3,
  },
  /** Phones: the menu button; open, its panel lies under the header, the full width of the page. */
  menu: {
    display: { default: "block", [media.desktop]: "none" },
    marginInlineStart: "auto",
  },
  toggle: { height: space.x5 },
  panel: {
    position: "absolute",
    top: "100%",
    insetInline: 0,
    maxHeight: `calc(100dvh - ${space.bar})`,
    overflowY: "auto",
    paddingBlock: space.x2,
    paddingInline: space.x3,
    backgroundColor: colors.bg,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  panelNav: { display: "flex", flexDirection: "column" },
  panelLink: {
    display: "flex",
    alignItems: "center",
    height: space.x6,
    fontSize: "1.25rem",
    lineHeight: "1.75rem",
  },
  panelFoot: {
    display: "flex",
    flexDirection: "column",
    marginTop: space.x2,
  },
  main: {
    flexGrow: 1,
    paddingBottom: { default: space.x12, [media.desktop]: space.x20 },
    outline: "none",
  },
  /**
   * The footer on the page grid: on wide screens the name over six columns and each group of
   * links over two, from the seventh column line on; on tablets the name on its own row and the
   * groups over four columns each; on phones two groups to a row.
   */
  footerColumns: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [media.desktop]: "repeat(12, minmax(0, 1fr))",
    },
    columnGap: space.x3,
  },
  footerGrid: {
    rowGap: space.x5,
    paddingBlock: { default: space.x6, [media.desktop]: space.x8 },
  },
  footerBrand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: space.x1,
    gridColumn: { default: "1 / -1", [media.wide]: "1 / span 6" },
  },
  groupFirst: {
    gridColumn: { default: "auto", [media.desktop]: "1 / span 4", [media.wide]: "7 / span 2" },
  },
  groupSecond: {
    gridColumn: { default: "auto", [media.desktop]: "5 / span 4", [media.wide]: "9 / span 2" },
  },
  groupThird: {
    gridColumn: { default: "auto", [media.desktop]: "9 / span 4", [media.wide]: "11 / span 2" },
  },
  footerList: {
    display: "flex",
    flexDirection: "column",
    rowGap: space.x1,
    marginTop: space.x2,
    listStyle: "none",
  },
  footerBase: {
    rowGap: space.x2,
    paddingBottom: space.x4,
  },
  copyright: { gridColumn: { default: "1 / -1", [media.wide]: "1 / span 6" } },
  otherLanguage: {
    gridColumn: { default: "1", [media.desktop]: "1 / span 4", [media.wide]: "7 / span 2" },
  },
  // An address is lowercase: its @ keeps the default form, not the capitals' one.
  email: { fontFeatureSettings: fontFeatures.prose },
});
