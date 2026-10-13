import type { VNode } from "preact";
import { renderToString } from "preact-render-to-string";
import { docs, posts } from "./content.ts";
import { files, type Listing, pageMarkdown, sitemap } from "./files.ts";
import { day, translators } from "./i18n.ts";
import { checkTranslations } from "./i18n-check.ts";
import type { Assets } from "./layout.tsx";
import {
  href,
  type Locale,
  localeInfo,
  locales,
  perLocale,
  type Route as Section,
} from "./locale.ts";
import type { ShareCard } from "./og.tsx";
import { BlogPage, PostPage } from "./pages/blog.tsx";
import { AboutPage } from "./pages/about.tsx";
import { DocPage, JoinedPage, NotFoundPage } from "./pages/doc.tsx";
import { Home } from "./pages/home.tsx";
import { JoinPage } from "./pages/join.tsx";
import { ProductPage, ProductsPage } from "./pages/products.tsx";
import { authors, products } from "./site.ts";

// For the build (`vite.config.ts`): share images first, since the pages link them by stamped
// names, then the pages, then the stamped copies of `public/` files the pages named.
export { shareImage } from "./og.tsx";
export { stamp, versionedCopies } from "./versioned.ts";

type PageProps = {
  assets: Assets;
  locale: Locale;
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  shareImage: string;
};

type Route = {
  locale: Locale;
  path: `/${string}`;
  /** The output file, when it is not the path plus `.html`. */
  file?: string;
  /** The same page in every locale; absent for error pages. */
  alternates?: Readonly<Record<Locale, `/${string}`>>;
  /** Listed in the sitemap and open to search engines. */
  index: boolean;
  /** Day of the last change, for the sitemap. */
  changed?: string;
  share: ShareCard;
  page: (assets: Assets, shareImage: string) => VNode;
};

/** One page in every locale: `build` renders the locale's version, `share` its link preview. */
function translated(
  section: Section,
  below: readonly string[],
  options: {
    index?: boolean;
    changed?: string;
    share: (locale: Locale) => ShareCard;
    build: (props: PageProps) => VNode;
  },
): Route[] {
  const alternates = perLocale((locale) => href(locale, section, ...below));
  return locales.map((locale) => ({
    locale,
    path: alternates[locale],
    alternates,
    index: options.index ?? true,
    ...(options.changed !== undefined && { changed: options.changed }),
    share: options.share(locale),
    page: (assets, shareImage) =>
      options.build({ assets, locale, path: alternates[locale], alternates, shareImage }),
  }));
}

const routes: readonly Route[] = [
  ...translated("home", [], {
    share: (locale) => ({ title: translators[locale].text("tagline") }),
    build: (props) => <Home {...props} />,
  }),
  ...translated("products", [], {
    share: (locale) => ({
      kicker: translators[locale].text("products_title"),
      title: translators[locale].text("products_intro"),
    }),
    build: (props) => <ProductsPage {...props} />,
  }),
  ...products.flatMap((product) =>
    translated("products", [product.slug], {
      share: (locale) => ({
        kicker: translators[locale].text(product.name),
        title: translators[locale].text(product.what),
      }),
      build: (props) => <ProductPage {...props} product={product} />,
    }),
  ),
  ...translated("join", [], {
    share: (locale) => ({
      kicker: translators[locale].text("join_title"),
      title: translators[locale].text("join_share_title"),
    }),
    build: (props) => <JoinPage {...props} />,
  }),
  ...translated("blog", [], {
    share: (locale) => ({
      kicker: translators[locale].text("blog_title"),
      title: translators[locale].text("blog_intro"),
    }),
    build: (props) => <BlogPage {...props} />,
  }),
  // Every post exists in every locale under the same slug (see `content.ts`).
  ...posts.en.flatMap(({ slug, date }) =>
    translated("blog", [slug], {
      changed: date,
      share: (locale) => {
        const post = posts[locale].find((candidate) => candidate.slug === slug);
        if (post === undefined) throw new Error(`No ${locale} post ${slug}`);
        return {
          kicker: translators[locale].text("blog_title"),
          title: post.title,
          byline: translators[locale].text("blog_share_byline", {
            author: authors[post.author].name,
            date: day(post.date),
          }),
        };
      },
      build: (props) => {
        const post = posts[props.locale].find((candidate) => candidate.slug === slug);
        if (post === undefined) throw new Error(`No ${props.locale} post ${slug}`);
        return <PostPage {...props} post={post} />;
      },
    }),
  ),
  ...translated("about", [], {
    share: (locale) => ({
      kicker: translators[locale].text("nav_about"),
      title: translators[locale].text("about_share_title"),
    }),
    build: (props) => (
      <AboutPage
        {...props}
        doc={docs[props.locale].about}
        description={translators[props.locale].text("home_who_text")}
      />
    ),
  }),
  ...translated("privacy", [], {
    share: (locale) => ({
      kicker: translators[locale].text("footer_privacy"),
      title: translators[locale].text("privacy_share_title"),
    }),
    build: (props) => (
      <DocPage
        {...props}
        doc={docs[props.locale].privacy}
        description={translators[props.locale].text("privacy_description")}
      />
    ),
  }),
  ...translated("imprint", [], {
    share: (locale) => ({
      kicker: translators[locale].text("footer_imprint"),
      title: translators[locale].text("imprint_share_title"),
    }),
    build: (props) => (
      <DocPage
        {...props}
        doc={docs[props.locale].imprint}
        description={translators[props.locale].text("imprint_description")}
      />
    ),
  }),
  ...translated("contact", [], {
    share: (locale) => ({
      kicker: translators[locale].text("contact_title"),
      title: translators[locale].text("contact_share_title"),
    }),
    build: (props) => (
      <DocPage
        {...props}
        doc={docs[props.locale].contact}
        description={translators[props.locale].text("contact_description")}
      />
    ),
  }),
  ...translated("joined", [], {
    index: false,
    share: (locale) => ({
      kicker: translators[locale].text("waitlist_label"),
      title: translators[locale].text("joined_title"),
    }),
    build: (props) => <JoinedPage {...props} />,
  }),
  // Each locale's folder gets a `404.html`; the server answers unknown paths below it with it.
  ...locales.map((locale): Route => ({
    locale,
    path: `${localeInfo[locale].prefix}/404`,
    file: `${localeInfo[locale].prefix.slice(1)}${localeInfo[locale].prefix && "/"}404.html`,
    index: false,
    share: { title: translators[locale].text("not_found_title") },
    page: (assets, shareImage) => (
      <NotFoundPage
        assets={assets}
        locale={locale}
        path={`${localeInfo[locale].prefix}/404`}
        shareImage={shareImage}
      />
    ),
  })),
];

/** Each page's link preview, keyed by the page's path. */
export const shareCards: Readonly<Record<string, ShareCard>> = Object.fromEntries(
  routes.map(({ path, share }) => [path, share]),
);

/** Where a page's link preview lives before stamping: `/images/share/de/produkte/erp-crm.png`. */
export function sharePath(path: string): `/${string}` {
  return `/images/share/${path === "/" ? "home" : path.slice(1)}.png`;
}

/** `/` → `index.html`, `/de/produkte/erp-crm` → `de/produkte/erp-crm.html`. */
const fileName = (route: Route) =>
  route.file ?? `${route.path === "/" ? "index" : route.path.slice(1)}.html`;

/**
 * The homepage must read in under three minutes in every language. At 200 words a minute, a slow
 * reading pace, that is 600 words of visible text in `<main>`.
 */
const homeWordLimit = 3 * 200;

function visibleWords(html: string): number {
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1];
  if (main === undefined) throw new Error("A page has no <main>.");
  return main
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word)).length;
}

/** Every link to a page of this site must reach one: a moved or misspelt path fails the build. */
function checkLinks(pages: Readonly<Record<string, string>>): void {
  const known = new Set(routes.map(({ path }) => path));
  const broken = Object.entries(pages).flatMap(([file, html]) =>
    [...html.matchAll(/href="(\/[^"#?]*)/g)]
      .map(([, target = ""]) => target)
      // Files (fonts, feeds, images) carry an extension; pages do not.
      .filter((target) => !/\.[a-z0-9]+$/i.test(target) && !known.has(`/${target.slice(1)}`))
      .map((target) => `${file} → ${target}`),
  );
  if (broken.length > 0) throw new Error(`Broken links:\n${broken.join("\n")}`);
}

/** Every generated file of the site, keyed by its path in the output directory. */
export function render(
  assets: Assets,
  shareImages: Readonly<Record<string, string>>,
): Record<string, string> {
  checkTranslations();
  const pages = Object.fromEntries(
    routes.map((route) => {
      const image = shareImages[route.path];
      if (image === undefined) throw new Error(`No share image for ${route.path}`);
      return [fileName(route), `<!doctype html>\n${renderToString(route.page(assets, image))}\n`];
    }),
  );
  for (const locale of locales) {
    const home = routes.find((route) => route.path === href(locale, "home"));
    if (home === undefined) throw new Error(`No ${locale} homepage`);
    const words = visibleWords(pages[fileName(home)] ?? "");
    if (words > homeWordLimit)
      throw new Error(`The ${locale} homepage has ${words} words; keep it under ${homeWordLimit}.`);
  }
  checkLinks(pages);
  const listings: Listing[] = routes.flatMap(({ path, alternates, index, changed }) =>
    index && alternates ? [{ path, alternates, ...(changed !== undefined && { changed }) }] : [],
  );
  const markdown = Object.fromEntries(
    Object.entries(pages).map(([file, html]) => [
      file.replace(/\.html$/, ".md"),
      pageMarkdown(html),
    ]),
  );
  return { ...pages, ...markdown, ...files(assets.css), "sitemap.xml": sitemap(listings) };
}
