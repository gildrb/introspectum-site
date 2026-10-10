import type { VNode } from "preact";
import { renderToString } from "preact-render-to-string";
import { docPage, posts } from "./content.ts";
import { files, sitemap } from "./files.ts";
import type { Assets } from "./layout.tsx";
import type { ShareCard } from "./og.tsx";
import { BlogPage, blogIntro, PostPage } from "./pages/blog.tsx";
import { DocPage, JoinedPage } from "./pages/doc.tsx";
import { Home } from "./pages/home.tsx";
import { JoinPage } from "./pages/join.tsx";
import { ProductPage, ProductsPage, productsIntro } from "./pages/products.tsx";
import { authors, company, products } from "./site.ts";

// For the build (`vite.config.ts`): share images first, since the pages link them by stamped
// names, then the pages, then the stamped copies of `public/` files the pages named.
export { shareImage } from "./og.tsx";
export { stamp, versionedCopies } from "./versioned.ts";

type Route = {
  path: `/${string}`;
  share: ShareCard;
  /** False for pages kept out of the sitemap and search results. */
  index: boolean;
  page: (assets: Assets, shareImage: string) => VNode;
};

const about = docPage("about");
const privacy = docPage("privacy");

const routes: readonly Route[] = [
  {
    path: "/",
    share: { title: "Software that is checked instead of trusted." },
    index: true,
    page: (assets, shareImage) => <Home assets={assets} shareImage={shareImage} />,
  },
  {
    path: "/products",
    share: { kicker: "Products", title: productsIntro },
    index: true,
    page: (assets, shareImage) => <ProductsPage assets={assets} shareImage={shareImage} />,
  },
  ...products.map((product): Route => ({
    path: `/products/${product.slug}`,
    share: { kicker: product.name, title: product.what },
    index: true,
    page: (assets, shareImage) => (
      <ProductPage assets={assets} shareImage={shareImage} product={product} />
    ),
  })),
  {
    path: "/join",
    share: { kicker: "Join us", title: "Founding engineer and internships" },
    index: true,
    page: (assets, shareImage) => <JoinPage assets={assets} shareImage={shareImage} />,
  },
  {
    path: "/blog",
    share: { kicker: "Blog", title: blogIntro },
    index: true,
    page: (assets, shareImage) => <BlogPage assets={assets} shareImage={shareImage} />,
  },
  ...posts.map((post): Route => ({
    path: `/blog/${post.slug}`,
    share: {
      kicker: "Blog",
      title: post.title,
      byline: `${authors[post.author].name}, ${post.date}`,
    },
    index: true,
    page: (assets, shareImage) => <PostPage assets={assets} shareImage={shareImage} post={post} />,
  })),
  {
    path: "/about",
    share: { kicker: "About", title: "A software company registered in the Isle of Man" },
    index: true,
    page: (assets, shareImage) => (
      <DocPage assets={assets} shareImage={shareImage} doc={about} description={company.who} />
    ),
  },
  {
    path: "/privacy",
    share: { kicker: "Privacy", title: "What this site stores and why" },
    index: true,
    page: (assets, shareImage) => (
      <DocPage
        assets={assets}
        shareImage={shareImage}
        doc={privacy}
        description="What the Introspectum site stores, why, and your rights."
      />
    ),
  },
  {
    path: "/joined",
    share: { kicker: "Waiting list", title: "You are on the waiting list" },
    index: false,
    page: (assets, shareImage) => <JoinedPage assets={assets} shareImage={shareImage} />,
  },
];

/** Each page's link preview, keyed by the page's path. */
export const shareCards: Readonly<Record<string, ShareCard>> = Object.fromEntries(
  routes.map(({ path, share }) => [path, share]),
);

/** Where a page's link preview lives before stamping: `/images/share/products/erp-crm.png`. */
export function sharePath(path: string): `/${string}` {
  return `/images/share/${path === "/" ? "home" : path.slice(1)}.png`;
}

/** `/` → `index.html`, `/products/erp-crm` → `products/erp-crm.html`. */
const fileName = (path: string) => `${path === "/" ? "index" : path.slice(1)}.html`;

/**
 * The homepage must read in under three minutes. At 200 words a minute, a slow reading pace, that
 * is 600 words of visible text in `<main>`.
 */
const homeWordLimit = 3 * 200;

function checkReadingTime(html: string) {
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1];
  if (main === undefined) throw new Error("The homepage has no <main>.");
  const words = main
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((word) => /\w/.test(word)).length;
  if (words > homeWordLimit)
    throw new Error(`The homepage has ${words} words; keep it under ${homeWordLimit} (3 minutes).`);
}

/** Every generated file of the site, keyed by its path in the output directory. */
export function render(
  assets: Assets,
  shareImages: Readonly<Record<string, string>>,
): Record<string, string> {
  const pages = Object.fromEntries(
    routes.map(({ path, page }) => {
      const image = shareImages[path];
      if (image === undefined) throw new Error(`No share image for ${path}`);
      return [fileName(path), `<!doctype html>\n${renderToString(page(assets, image))}\n`];
    }),
  );
  checkReadingTime(pages["index.html"] ?? "");
  return {
    ...pages,
    ...files,
    "sitemap.xml": sitemap(routes.filter(({ index }) => index).map(({ path }) => path)),
  };
}
