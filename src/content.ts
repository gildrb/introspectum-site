import { isLocale, type Locale, locales, perLocale } from "./locale.ts";
import { type Block, parse, wordCount } from "./markdown.tsx";
import { type AuthorId, email, isAuthorId } from "./site.ts";

/**
 * Long text lives in Markdown, one file per language: `src/content/<locale>/<doc>.md` for the plain
 * pages and `src/content/<locale>/blog/<slug>.md` for posts. Every page and every post exists in
 * every locale; the build stops when one is missing.
 */

/** `{email}` in any Markdown file stands for the company address, so it is written only once. */
const emailToken = "{email}";

const docSources = import.meta.glob<string>("./content/*/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const postSources = import.meta.glob<string>("./content/*/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const docSlugs = ["about", "privacy", "imprint"] as const;
export type DocSlug = (typeof docSlugs)[number];

/** A plain page: a `# Title` line, then the text. */
export type Doc = { title: string; blocks: Block[] };

function doc(locale: Locale, slug: DocSlug): Doc {
  const file = `src/content/${locale}/${slug}.md`;
  const source = docSources[`./content/${locale}/${slug}.md`];
  if (source === undefined) throw new Error(`Missing ${file}`);
  const [first = "", ...rest] = source
    .replaceAll(emailToken, email)
    .replaceAll("\r\n", "\n")
    .trim()
    .split("\n");
  if (!first.startsWith("# ")) throw new Error(`${file} must begin with a # title.`);
  return { title: first.slice(2), blocks: parse(rest.join("\n"), file, 2) };
}

for (const path of Object.keys(docSources)) {
  const [, locale = "", slug = ""] = path.match(/^\.\/content\/([^/]+)\/([^/]+)\.md$/) ?? [];
  if (!isLocale(locale) || !docSlugs.some((known) => known === slug))
    throw new Error(`src/${path.slice(2)}: not a page; pages are ${docSlugs.join(", ")}.`);
}

export const docs: Readonly<Record<Locale, Readonly<Record<DocSlug, Doc>>>> = perLocale(
  (locale) => ({
    about: doc(locale, "about"),
    privacy: doc(locale, "privacy"),
    imprint: doc(locale, "imprint"),
  }),
);

/**
 * A blog post, `src/content/<locale>/blog/<slug>.md`, at `/blog/<slug>` and `/de/blog/<slug>`.
 * The file opens with front matter naming exactly these four fields, then the text in the
 * Markdown of `markdown.tsx`:
 *
 * ---
 * title: What the post is about
 * date: 2026-10-14
 * author: fabian-klopfer
 * description: One or two sentences for the blog index, search results and link previews.
 * ---
 *
 * `author` is a key of `authors` in `site.ts`. A post's translations share its file name, date
 * and author.
 */
export type Post = {
  slug: string;
  title: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  author: AuthorId;
  description: string;
  blocks: Block[];
  /** Reading time at 230 words a minute, at least one. */
  minutes: number;
};

const fields = ["title", "date", "author", "description"] as const;

function post(file: string, slug: string, source: string): Post {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error(`${file}: name the file in lowercase words joined by hyphens.`);
  const match = source
    .replaceAll(emailToken, email)
    .replaceAll("\r\n", "\n")
    .match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: begin with front matter between two --- lines.`);
  const [, head = "", body = ""] = match;
  const values: Partial<Record<(typeof fields)[number], string>> = {};
  for (const [index, line] of head.split("\n").entries()) {
    const entry = line.match(/^(\w+):\s*(.*\S)\s*$/);
    const key = fields.find((name) => name === entry?.[1]);
    if (entry === null || key === undefined)
      throw new Error(
        `${file}:${index + 2}: expected one of ${fields.join(", ")} as "key: value".`,
      );
    if (values[key] !== undefined) throw new Error(`${file}:${index + 2}: ${key} is given twice.`);
    values[key] = entry[2] ?? "";
  }
  const { title, date, author, description } = values;
  if (
    title === undefined ||
    date === undefined ||
    author === undefined ||
    description === undefined
  )
    throw new Error(`${file}: the front matter needs ${fields.join(", ")}.`);
  const day = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(day.getTime()) ||
    day.toISOString().slice(0, 10) !== date
  )
    throw new Error(`${file}: date must be a real day written YYYY-MM-DD, not "${date}".`);
  if (!isAuthorId(author))
    throw new Error(`${file}: author "${author}" is not a key of authors in src/site.ts.`);
  // The body starts after the opening ---, the fields and the closing ---.
  const blocks = parse(body, file, head.split("\n").length + 3);
  const minutes = Math.max(1, Math.round(wordCount(blocks) / 230));
  return { slug, title, date, author, description, blocks, minutes };
}

function postsIn(locale: Locale): Post[] {
  return Object.entries(postSources)
    .flatMap(([path, source]) => {
      const [, owner = "", slug = ""] =
        path.match(/^\.\/content\/([^/]+)\/blog\/([^/]+)\.md$/) ?? [];
      if (!isLocale(owner)) throw new Error(`src/${path.slice(2)}: ${owner} is not a locale.`);
      return owner === locale ? [post(`src/${path.slice(2)}`, slug, source)] : [];
    })
    .toSorted(
      (left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug),
    );
}

/** Every post per locale, newest first. */
export const posts: Readonly<Record<Locale, readonly Post[]>> = perLocale(postsIn);

// A post is published in every language at once: same file name, date and author.
for (const locale of locales)
  for (const other of locales) {
    for (const { slug, date, author } of posts[locale]) {
      const translation = posts[other].find((candidate) => candidate.slug === slug);
      if (translation === undefined)
        throw new Error(`src/content/${other}/blog/${slug}.md is missing (${locale} has it).`);
      if (translation.date !== date || translation.author !== author)
        throw new Error(
          `src/content/${other}/blog/${slug}.md: date and author must match ${locale}.`,
        );
    }
  }
