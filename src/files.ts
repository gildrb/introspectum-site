import { posts } from "./content.ts";
import { day, translators } from "./i18n.ts";
import { href, type Locale, localeInfo, locales, sourceLocale } from "./locale.ts";
import { authors, company, email, origin, products, roles } from "./site.ts";

/**
 * The feeds, the sitemap and llms.txt. Everything comes from the catalogs, `site.ts` and the posts,
 * so a new post, product or translation reaches all of them at once.
 */

const url = (path: string) => `${origin}${path}`;

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** The blog's RSS feed in one language: `/feed.xml`, `/de/feed.xml`. */
function feed(locale: Locale): string {
  const t = translators[locale];
  const self = url(`${localeInfo[locale].prefix}/feed.xml`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(t.text("feed_title", { brand: company.name }))}</title>
    <link>${url(href(locale, "blog"))}</link>
    <description>${escape(t.text("blog_intro"))}</description>
    <language>${locale}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${posts[locale]
  .map(
    (post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${url(href(locale, "blog", post.slug))}</link>
      <guid isPermaLink="true">${url(href(locale, "blog", post.slug))}</guid>
      <pubDate>${day(post.date).toUTCString()}</pubDate>
      <dc:creator>${escape(authors[post.author].name)}</dc:creator>
      <description>${escape(post.description)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;
}

/** An indexable page: its path in one locale, and the same page in every locale. */
export type Listing = {
  path: `/${string}`;
  alternates: Readonly<Record<Locale, `/${string}`>>;
  /** ISO date the page last changed, where the site knows it. */
  changed?: string;
};

/** Every indexable page with its translations, as Google reads `hreflang` from sitemaps. */
export function sitemap(listings: readonly Listing[]): string {
  const entries = listings.map(({ path, alternates, changed }) =>
    [
      `  <url>`,
      `    <loc>${url(path)}</loc>`,
      ...(changed === undefined ? [] : [`    <lastmod>${changed}</lastmod>`]),
      ...locales.map(
        (locale) =>
          `    <xhtml:link rel="alternate" hreflang="${locale}" href="${url(alternates[locale])}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(alternates[sourceLocale])}" />`,
      `  </url>`,
    ].join("\n"),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
}

/** A Markdown link to a page of the site. */
const link = (label: string, path: string) => `[${label}](${url(path)})`;

/** A guide for language models, in the source language, naming the translated pages too. */
function llms(): string {
  const t = translators[sourceLocale];
  return `# ${company.name}

> ${t.text("home_description")}

${t.text("home_why_text")}

${t.text("home_who_text")}

## ${t.text("nav_products")}

${products
  .map(
    (product) =>
      `- ${link(t.text(product.name), href("en", "products", product.slug))}: ${t.text(product.what)} ${t.text(product.audience)} (${t.text(product.status)})`,
  )
  .join("\n")}

## ${t.text("consulting_name")}

${t.text("consulting_what")} ${t.text("consulting_audience")} ${email}

## ${t.text("nav_join")}

${roles.map((role) => `- ${link(t.text(role.title), href("en", "join"))}: ${role.intro.map((id) => t.text(id)).join(" ")}`).join("\n")}

## ${t.text("nav_blog")}

${[
  `- ${link(t.text("blog_title"), href("en", "blog"))}: ${t.text("blog_intro")}`,
  ...posts.en.map(
    (post) =>
      `- ${link(post.title, href("en", "blog", post.slug))} (${post.date}): ${post.description}`,
  ),
].join("\n")}

## ${t.text("nav_about")}

- ${link(t.text("nav_about"), href("en", "about"))}: ${t.text("about_share_title")}
- ${link(t.text("footer_privacy"), href("en", "privacy"))}: ${t.text("privacy_description")}
- ${link(t.text("footer_imprint"), href("en", "imprint"))}: ${t.text("imprint_description")}

${locales
  .filter((locale) => locale !== sourceLocale)
  .map((locale) => {
    const other = translators[locale];
    const pages = (["products", "join", "blog", "about"] as const).map(
      (route) => `- ${link(other.text(`nav_${route}`), href(locale, route))}`,
    );
    return `## ${other.language(locale)}\n\n${pages.join("\n")}`;
  })
  .join("\n\n")}
`;
}

export const files: Record<string, string> = {
  "feed.xml": feed("en"),
  "de/feed.xml": feed("de"),
  "llms.txt": llms(),
};
