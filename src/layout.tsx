import * as stylex from "@stylexjs/stylex";
import { type ComponentChildren, createContext } from "preact";
import { schemeToken } from "./color.ts";
import { engravingCss } from "./figures/engraving.ts";
import { translators } from "./i18n.ts";
import { href, type Locale, localeInfo, locales, type Route, sourceLocale } from "./locale.ts";
import { Island } from "./island.tsx";
import { LogoMenu } from "./islands/logo.tsx";
import { ProductsMenu } from "./islands/products.tsx";
import { mark } from "./logo.tsx";
import { shareFrame } from "./og.tsx";
import { company, email, origin, type Shelf, shelved } from "./site.ts";
import {
  caps,
  colors,
  fontFeatures,
  grid,
  layer,
  leading,
  media,
  shadows,
  space,
  type,
  weights,
} from "./tokens.stylex.ts";
import { type Style, ui, untranslated } from "./ui.tsx";
import { versioned } from "./versioned.ts";

/**
 * What the build hands every page: the client script, the stylesheet StyleX collected, and for a
 * module the client imports on demand (`src/figures/proof.ts`) the URLs of its code and of what it
 * imports, so a page can name them in `<link rel="modulepreload">` before the script asks.
 */
export type Assets = { script: string; css: string; preload: (module: string) => string[] };

/** The page's assets, for the parts deep in it that preload their own code (`Machine`). */
export const PageAssets = createContext<Assets | null>(null);

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
  /** Preloads the monospace face, for pages that show code. */
  mono: boolean;
  /** Preloads Newsreader's italic, for pages that set words in it, so they never arrive late. */
  italic: boolean;
  jsonLd?: unknown;
  /** More head elements, such as an article's dates. */
  head?: ComponentChildren;
};

// Newsreader and JetBrains Mono come as Google Fonts subsets them: Latin, and Latin Extended for
// names such as Slovenian, Czech or Polish ones. The browser fetches a subset only for text that
// needs it. Every face is declared for weights 400 to 630, all the site uses (`weights`):
// nothing is set lighter than regular, so `scripts/newsreader.py` cuts Newsreader's lighter half.
const latin =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const latinExtended =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF";
// Inter, subset by `scripts/inter.py`: Latin-1 and punctuation in one file; Latin Extended-A and
// arrows, which only names and rare signs need, in a second the browser fetches only for them.
const interLatin =
  "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2010-205E,U+20AC,U+2122,U+2212";
const interLatinExtended = "U+0100-0130,U+0132-0151,U+0154-017F,U+2190-21FF";

// One URL per face, shared by its @font-face and its preload so the browser fetches it once.
// Newsreader and Inter wait for their files (`font-display: block`) instead of showing a fallback
// that then changes: the preloaded files arrive within the first frames, and on later pages they
// come from the cache. Only a file that takes longer than the browser's block period (about 3s)
// lets the metric-matched fallback below show.
const serifUrl = versioned("/fonts/newsreader-latin.woff2");
const interUrl = versioned("/fonts/inter-latin.woff2");
const monoUrl = versioned("/fonts/jetbrains-mono-latin.woff2");
const serifItalicUrl = versioned("/fonts/newsreader-italic-latin.woff2");

/** Newsreader's four files: upright and italic, each in Latin and Latin Extended. */
const serifFaces = (
  [
    ["normal", serifUrl, latin],
    ["normal", versioned("/fonts/newsreader-latin-ext.woff2"), latinExtended],
    ["italic", serifItalicUrl, latin],
    ["italic", versioned("/fonts/newsreader-italic-latin-ext.woff2"), latinExtended],
  ] as const
).map(
  ([style, url, ranges]) =>
    `@font-face{font-family:"Newsreader";font-style:${style};font-weight:400 630;font-display:block;src:url("${url}") format("woff2");unicode-range:${ranges}}`,
);

/** JetBrains Mono, upright only, for code. Shown only if it arrives in time: code never reflows. */
const monoFaces = (
  [
    [monoUrl, latin],
    [versioned("/fonts/jetbrains-mono-latin-ext.woff2"), latinExtended],
  ] as const
).map(
  ([url, ranges]) =>
    `@font-face{font-family:"JetBrains Mono";font-weight:400 630;font-display:optional;src:url("${url}") format("woff2");unicode-range:${ranges}}`,
);

/** The few rules StyleX cannot attach to an element, layered beneath StyleX's own layers. */
const globalCss = [
  "@layer reset;",
  ...serifFaces,
  `@font-face{font-family:"Inter";font-weight:400 630;font-display:block;src:url("${interUrl}") format("woff2");unicode-range:${interLatin}}`,
  `@font-face{font-family:"Inter";font-weight:400 630;font-display:block;src:url("${versioned("/fonts/inter-latin-ext.woff2")}") format("woff2");unicode-range:${interLatinExtended}}`,
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
  // The drawn machines (`figures/`): ink on paper, like the page.
  engravingCss(colors.primary, colors.bg),
].join("\n");

/**
 * Pages open at once: the browser fetches every page a link on this one leads to as soon as it
 * can, and renders one in the background, fonts & images included, once the pointer rests on its
 * link or a finger goes down on it. Following the link then shows the finished page. Only pages:
 * links to files (feeds, images) and to other windows are left alone. Browsers without
 * speculation rules ignore it. The policy allows it with 'inline-speculation-rules'.
 */
const pageLinks = {
  and: [
    { href_matches: "/*" },
    { not: { href_matches: "/*.*" } },
    { not: { selector_matches: "[target=_blank]" } },
  ],
};
const speculationRules = JSON.stringify({
  prefetch: [{ where: pageLinks, eagerness: "eager" }],
  prerender: [{ where: pageLinks, eagerness: "moderate" }],
});

/** JSON safe inside a `<script>`: `<`, `>` & `&` as Unicode escapes, which JSON reads back as is. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /[<>&]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

function JsonLd({ value }: { value: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: scriptJson(value) }} />
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

/** The shelves the products menu lists, in order: what we sell, then what we research. */
const menuShelves: readonly Shelf[] = ["products", "research"];

/** `aria-current` for a link to `target` from `path`: the page itself, or a page below it. */
function currentness(path: string, target: string): "page" | "true" | undefined {
  if (path === target) return "page";
  if (target !== "/" && path.startsWith(`${target}/`)) return "true";
  return undefined;
}

/**
 * The whole document: head, a sticky header with the name, the navigation, the languages (beside
 * the contact button) and the contact button (behind a menu button on phones), the
 * page's content, and the footer.
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
  const contact = href(locale, "contact");
  const links = nav.map(({ route, label }) => {
    const target = href(locale, route);
    return { route, target, current: currentness(path, target), label: t.text(label) };
  });
  // The products menu (`islands/products.tsx`): each shelf's overview, then its pages.
  const productGroups = menuShelves.map((shelf) => {
    const overview = href(locale, shelf);
    return {
      title: {
        href: overview,
        label: t.text(shelf === "products" ? "products_title" : "research_title"),
        current: path === overview,
      },
      links: shelved(shelf).map((product) => {
        const target = href(locale, product.shelf, product.slug);
        return { href: target, label: t.text(product.name), current: path === target };
      }),
    };
  });
  const page = schemeToken(assets.css, colors.bg);
  return (
    <html lang={locale} dir={localeInfo[locale].dir} {...stylex.props(ui.sans, styles.html)}>
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
              <link
                key={other}
                rel="alternate"
                hreflang={other}
                href={`${origin}${alternates[other]}`}
              />
            ))}
            <link
              rel="alternate"
              hreflang="x-default"
              href={`${origin}${alternates[sourceLocale]}`}
            />
          </>
        )}
        {/* The page backgrounds, `colors.bg`. */}
        <meta name="theme-color" content={page.dark} media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content={page.light} media="(prefers-color-scheme: light)" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content={company.name} />
        <meta property="og:locale" content={ogLocale(locale)} />
        {others.map((other) => (
          <meta key={other} property="og:locale:alternate" content={ogLocale(other)} />
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
        <link rel="preload" href={serifUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href={interUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        {meta.mono && (
          <link rel="preload" href={monoUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        )}
        {meta.italic && (
          <link
            rel="preload"
            href={serifItalicUrl}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        )}
        <script type="speculationrules" dangerouslySetInnerHTML={{ __html: speculationRules }} />
        <style dangerouslySetInnerHTML={{ __html: `${globalCss}\n${assets.css}` }} />
        {/* `async`: it runs as soon as it arrives, while the page may still be streaming in, so a
            drawn machine starts as soon as its figure is in (see `client.ts`). */}
        <script type="module" src={assets.script} async />
        {meta.jsonLd !== undefined && <JsonLd value={meta.jsonLd} />}
        {meta.head}
      </head>
      <body {...stylex.props(styles.body)}>
        <a {...stylex.props(ui.text, ui.focusRing, styles.skip)} href="#content">
          {t.text("skip_to_content")}
        </a>
        <header {...stylex.props(styles.header)}>
          <div {...stylex.props(ui.container, styles.bar)}>
            <Island
              name="logo"
              component={LogoMenu}
              props={{
                home: href(locale, "home"),
                current: currentness(path, href(locale, "home")) === "page",
                name: company.name,
                mark: { viewBox: mark.viewBox, path: mark.path },
                brandAssets: brandAssetsUrl,
                text: {
                  label: t.text("logo_menu_label"),
                  copy: t.text("logo_menu_copy"),
                  download: t.text("logo_menu_download"),
                },
              }}
            />
            <nav {...stylex.props(styles.nav)} aria-label={t.text("nav_label")}>
              {links.map(({ route, target, current, label }) =>
                route === "products" ? (
                  <Island
                    key={route}
                    name="products"
                    component={ProductsMenu}
                    props={{
                      label,
                      current:
                        current !== undefined ||
                        currentness(path, href(locale, "research")) !== undefined,
                      overview: target,
                      groups: productGroups,
                    }}
                  />
                ) : (
                  <a
                    key={route}
                    {...stylex.props(
                      ui.small,
                      ui.quiet,
                      ui.control,
                      ui.focusRing,
                      ui.navLink,
                      current !== undefined && styles.navCurrent,
                    )}
                    href={target}
                    aria-current={current}
                  >
                    {label}
                  </a>
                ),
              )}
            </nav>
            <div {...stylex.props(styles.actions)}>
              <LanguageSwitch meta={meta} size={ui.small} />
              <a {...stylex.props(ui.button, ui.compact, ui.primary, ui.focusRing)} href={contact}>
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
                        ui.control,
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
                  <LanguageSwitch meta={meta} size={ui.text} />
                  <a
                    {...stylex.props(ui.button, ui.primary, ui.focusRing, styles.panelContact)}
                    href={contact}
                  >
                    {t.text("nav_contact")}
                  </a>
                </div>
              </div>
            </details>
          </div>
        </header>
        <main {...stylex.props(styles.main)} id="content" tabIndex={-1}>
          <PageAssets.Provider value={assets}>{children}</PageAssets.Provider>
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
            {...stylex.props(ui.quiet, ui.control, ui.focusRing, style)}
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

/**
 * Every language by its code, `EN DE`, at `size`: the page's own in the header's gray & not a
 * link, each other one a quieter link to this page in that language, in full ink only under the
 * pointer or the keyboard, named in full for screen readers.
 */
function LanguageSwitch({ meta, size }: { meta: Meta; size: Style }) {
  const t = translators[meta.locale];
  return (
    <span {...stylex.props(size, styles.switch)}>
      {locales.map((code) =>
        code === meta.locale ? (
          <span
            key={code}
            {...stylex.props(styles.code, styles.codeCurrent)}
            lang={code}
            title={t.language(code)}
          >
            {code.toUpperCase()}
          </span>
        ) : (
          <a
            key={code}
            {...stylex.props(ui.quiet, ui.control, ui.focusRing, styles.code, styles.codeOther)}
            href={meta.alternates?.[code] ?? href(code, "home")}
            hreflang={code}
            lang={code}
            // Starts with the code it shows, so voice control finds it by what it says.
            aria-label={t.text("language_code_switch", {
              code: code.toUpperCase(),
              language: t.language(code),
            })}
          >
            {code.toUpperCase()}
          </a>
        ),
      )}
    </span>
  );
}

/** The logo in black & white in every format, for the logo's menu (`islands/logo.tsx`). */
const brandAssetsUrl = versioned("/brand/introspectum-brand.zip");

/**
 * The name and address, every page by group, the legal pages, and the other languages, on the
 * page's own ground & in its quieter grays, so the footer stays behind the page's content.
 */
function Footer({ meta }: { meta: Meta }) {
  const { locale, path } = meta;
  const t = translators[locale];
  const page = (route: Route, label: string) => ({ target: href(locale, route), label });
  const groups = [
    {
      title: t.text("nav_products"),
      place: styles.groupFirst,
      // Everything we build: the products we sell, then the research we publish (the Trading
      // Platform), each on its own page.
      links: [...shelved("products"), ...shelved("research")].map((product) => ({
        target: href(locale, product.shelf, product.slug),
        label: t.text(product.name),
      })),
    },
    {
      title: t.text("footer_company"),
      place: styles.groupSecond,
      links: [
        page("about", t.text("nav_about")),
        page("research", t.text("research_title")),
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
    // The footer is a block of its own: the body is a flex column, where the container's auto
    // margins would shrink the container to its content.
    <footer>
      <div {...stylex.props(ui.container)}>
        <div {...stylex.props(styles.footerColumns, styles.footerGrid)}>
          <div {...stylex.props(styles.footerBrand)}>
            <p>
              <svg {...stylex.props(styles.footerMark)} viewBox={mark.viewBox} aria-hidden="true">
                <path d={mark.path} fill="currentColor" fill-rule="evenodd" />
              </svg>
              <span {...stylex.props(ui.srOnly)} {...untranslated}>
                {company.name}
              </span>
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
            <div key={title} {...stylex.props(place)}>
              <h2 {...stylex.props(ui.small, ui.strong)}>{title}</h2>
              <ul {...stylex.props(styles.footerList)}>
                {links.map(({ target, label }) => (
                  <li key={target}>
                    <a
                      {...stylex.props(
                        ui.small,
                        ui.quiet,
                        ui.control,
                        ui.focusRing,
                        styles.footerLink,
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
        <div {...stylex.props(styles.footerColumns, styles.footerBase)}>
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
      </div>
    </footer>
  );
}

const styles = stylex.create({
  /** In Inter, so the header's height in caps (`caps.bar`) is the same here as on the bar. */
  html: {
    backgroundColor: colors.bg,
    colorScheme: "light dark",
    // Anchored sections stop below the sticky header, not under it.
    scrollPaddingTop: caps.bar,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    backgroundColor: colors.bg,
    color: colors.primary,
    // Text without a weight of its own, such as a form's fields, is regular in both schemes.
    fontWeight: weights.regular,
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
    zIndex: layer.skip,
    top: space.x2,
    insetInlineStart: space.x2,
    paddingInline: space.x2,
    paddingBlock: space.x1,
    color: colors.primary,
    backgroundColor: colors.bg,
    clipPath: { default: "inset(50%)", ":focus-visible": "none" },
  },
  /** Sticky over the page, on the page's own ground. */
  header: {
    position: "sticky",
    top: 0,
    zIndex: layer.header,
    backgroundColor: colors.bg,
  },
  bar: {
    display: "flex",
    alignItems: "center",
    columnGap: space.x4,
    height: caps.bar,
  },
  /**
   * The footer's mark, as tall as the header's (`islands/logo.tsx`), in a quieter gray, one unit
   * further from the tagline than the tagline from the address.
   */
  footerMark: {
    display: "block",
    height: caps.x3,
    width: "auto",
    color: colors.tertiary,
    marginBottom: space.x1,
  },
  /**
   * Desktop: the links sit on the left, next to the logo. Each link's padding fills the gap between
   * them, so the pointer finds no dead space along the row; the row reaches back by one padding at
   * its start, so the first link's text keeps the bar's gap from the logo.
   */
  nav: {
    display: { default: "none", [media.desktop]: "flex" },
    marginInlineStart: `calc(-1 * (${space.x1} + ${space.half}))`,
  },
  /** The page it is on: underlined, in the same gray; full ink is for the pointer alone. */
  navCurrent: { textDecorationLine: "underline" },
  /** Desktop: the languages & the contact button, on the right. */
  actions: {
    display: { default: "none", [media.desktop]: "flex" },
    alignItems: "center",
    columnGap: space.x3,
    marginInlineStart: "auto",
  },
  /** Phones: the menu button; open, its panel lies under the header, the full width of the page. */
  menu: {
    display: { default: "block", [media.desktop]: "none" },
    marginInlineStart: "auto",
  },
  toggle: { height: caps.x3_5 },
  panel: {
    position: "absolute",
    top: "100%",
    insetInline: 0,
    maxHeight: `calc(100dvh - ${caps.bar})`,
    overflowY: "auto",
    paddingBlock: space.x2,
    paddingInline: space.x3,
    backgroundColor: colors.bg,
    boxShadow: shadows.raised,
  },
  panelNav: { display: "flex", flexDirection: "column" },
  panelLink: {
    display: "flex",
    alignItems: "center",
    height: caps.x3_25,
    fontSize: type.menu,
    lineHeight: leading.x3_5,
  },
  /** The languages, then the contact button across the rest of the row. */
  panelFoot: {
    display: "flex",
    alignItems: "center",
    columnGap: space.x3,
    marginTop: space.x2,
  },
  panelContact: { flexGrow: 1 },
  /**
   * The language codes side by side, each four caps tall: as tall as the full button beside them
   * in the phone menu (48px at 1rem), 40px in the header's small text.
   */
  switch: { display: "inline-flex", flexShrink: 0, alignItems: "center" },
  code: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: caps.x4,
    height: caps.x4,
    fontWeight: weights.medium,
    letterSpacing: "0.02em",
    touchAction: "manipulation",
  },
  codeCurrent: { color: colors.secondary },
  codeOther: {
    color: {
      default: colors.tertiary,
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
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
      [media.desktop]: grid.columns,
    },
    columnGap: grid.gutter,
  },
  /** The main's bottom padding already parts the footer from the page; no card edge to clear. */
  footerGrid: {
    rowGap: space.x5,
    paddingBottom: { default: space.x6, [media.desktop]: space.x8 },
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
  /** The links' padding fills the space between them; the list starts higher by as much. */
  footerList: {
    display: "flex",
    flexDirection: "column",
    marginTop: `calc(${space.x2} - ${space.x1} / 2)`,
    listStyle: "none",
  },
  footerLink: { display: "block", width: "fit-content", paddingBlock: `calc(${space.x1} / 2)` },
  footerBase: {
    rowGap: space.x2,
    paddingBottom: { default: space.x4, [media.desktop]: space.x6 },
  },
  copyright: { gridColumn: { default: "1 / -1", [media.wide]: "1 / span 6" } },
  otherLanguage: {
    gridColumn: { default: "1", [media.desktop]: "1 / span 4", [media.wide]: "7 / span 2" },
  },
  // An address is lowercase: its @ keeps the default form, not the capitals' one.
  email: { fontFeatureSettings: fontFeatures.prose },
});
