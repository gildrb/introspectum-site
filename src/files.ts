import { posts } from "./content.ts";
import { authors, company, consulting, email, origin, products, roles } from "./site.ts";

/**
 * The feed, the sitemap and llms.txt. Everything comes from `site.ts` and the posts, so a new post
 * or product reaches all three at once.
 */

const url = (path: string) => `${origin}${path}`;

const escape = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escape(company.name)} blog</title>
    <link>${url("/blog")}</link>
    <description>${escape(company.description)}</description>
    <language>en</language>
    <atom:link href="${url("/feed.xml")}" rel="self" type="application/rss+xml" />
${posts
  .map(
    (post) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${url(`/blog/${post.slug}`)}</link>
      <guid isPermaLink="true">${url(`/blog/${post.slug}`)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${escape(authors[post.author].name)}</dc:creator>
      <description>${escape(post.description)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;

/** Every indexable page, with the day it last changed where the site knows it. */
export function sitemap(paths: readonly string[]): string {
  const changed = new Map(posts.map((post) => [`/blog/${post.slug}`, post.date]));
  const entries = paths.map((path) => {
    const date = changed.get(path);
    return `  <url><loc>${url(path)}</loc>${date === undefined ? "" : `<lastmod>${date}</lastmod>`}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}

const llms = `# ${company.name}

> ${company.description}

${company.mission}

${company.who}

## Products

${products
  .map(
    (product) =>
      `- [${product.name}](${url(`/products/${product.slug}`)}): ${product.what} ${product.audience} Status: ${product.status}.`,
  )
  .join("\n")}

## Consulting

${consulting.what} ${consulting.audience} Contact: ${email}.

## Jobs

${roles.map((role) => `- [${role.title}](${url("/join")}): ${role.intro.join(" ")}`).join("\n")}

## Blog

${
  posts.length === 0
    ? `No posts yet. Feed: ${url("/feed.xml")}`
    : posts
        .map(
          (post) =>
            `- [${post.title}](${url(`/blog/${post.slug}`)}) (${post.date}): ${post.description}`,
        )
        .join("\n")
}

## Pages

- [About](${url("/about")}): the company and its team
- [Privacy](${url("/privacy")}): what the site stores and why
`;

export const files: Record<string, string> = {
  "feed.xml": feed,
  "llms.txt": llms,
};
