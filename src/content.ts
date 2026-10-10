import { type Block, parse, wordCount } from "./markdown.tsx";
import { type AuthorId, email, isAuthorId } from "./site.ts";

/** `{email}` in any Markdown file stands for the company address, so it is written only once. */
const emailToken = "{email}";

const pageSources = import.meta.glob<string>("./content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const postSources = import.meta.glob<string>("./content/blog/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** A plain page written in `src/content/<slug>.md`: a `# Title` line, then the text. */
export type DocPage = { slug: string; title: string; blocks: Block[] };

export function docPage(slug: string): DocPage {
  const file = `./content/${slug}.md`;
  const source = pageSources[file];
  if (source === undefined) throw new Error(`Missing src/content/${slug}.md`);
  const [first = "", ...rest] = source
    .replaceAll(emailToken, email)
    .replaceAll("\r\n", "\n")
    .trim()
    .split("\n");
  if (!first.startsWith("# ")) throw new Error(`src/content/${slug}.md must begin with a # title.`);
  const blocks = parse(rest.join("\n"), `src/content/${slug}.md`, 2);
  return { slug, title: first.slice(2), blocks };
}

/**
 * A blog post: `src/content/blog/<slug>.md`, its URL `/blog/<slug>`. The file opens with front
 * matter naming exactly these four fields, then the text in the Markdown of `markdown.tsx`:
 *
 * ---
 * title: What the post is about
 * date: 2026-10-14
 * author: fabian-klopfer
 * description: One or two sentences for the blog index, search results and link previews.
 * ---
 *
 * `author` is a key of `authors` in `site.ts`.
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

function post(path: string, source: string): Post {
  const slug = path.replace(/^\.\/content\/blog\/|\.md$/g, "");
  const file = `src/content/blog/${slug}.md`;
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

/** Every post, newest first. */
export const posts: readonly Post[] = Object.entries(postSources)
  .map(([path, source]) => post(path, source))
  .toSorted(
    (left, right) => right.date.localeCompare(left.date) || left.slug.localeCompare(right.slug),
  );
