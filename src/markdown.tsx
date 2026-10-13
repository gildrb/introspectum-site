import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { colors, leading, space, stroke, tracking, type, weights } from "./tokens.stylex.ts";
import { ui } from "./ui.tsx";
import { imageSize, versioned } from "./versioned.ts";

/**
 * The Markdown the site understands, and nothing more:
 *
 * - `## Heading` and `### Subheading`
 * - paragraphs, lines joined until a blank line; a line ending in `\` breaks there (addresses)
 * - `- item` lists and `1. item` lists
 * - `> quote` lines
 * - fenced code blocks, optionally naming a language: ```rust
 * - `![Alt text](/images/blog/file.png)` on a line of its own; PNG, JPEG, WebP or SVG in `public/`
 * - inline: `code`, [label](https://… or /path or mailto:…), **strong**, *emphasis*
 *
 * Anything else (tables, HTML, deeper headings, rules) stops the build with a message, so it never
 * reaches the page as stray symbols.
 */
export type Block =
  | { type: "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "image"; alt: string; src: string; width: number; height: number };

const image = /^!\[([^\]]+)\]\(\/(images\/(?:[\w-]+\/)*[\w-]+\.(?:png|jpe?g|webp|svg))\)$/;
const ordered = /^\d+\. /;
const blockStart = /^(?:#|```|- |> |!\[)/;
const unsupported: [pattern: RegExp, message: string][] = [
  [/^#(?:\s|$)/, "The title is not part of the text: give it in the front matter or first line."],
  [/^#{4,}/, "Only ## and ### headings are supported."],
  [/^</, "HTML is not supported."],
  [/^\|/, "Tables are not supported."],
  [/^(?:-{3,}|\*{3,}|_{3,})$/, "Horizontal rules are not supported."],
  [/^[*+] /, "Start list items with '- '."],
  [/^!\[/, "Images need alt text and a path under /images/, on a line of their own."],
];

/**
 * Parses a page or post body. `source` names the file in error messages, and `firstLine` is the
 * file line the body starts on, so the messages point at the right line.
 */
export function parse(markdown: string, source: string, firstLine: number): Block[] {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  /** Consumes the run of lines that pass `test`, each passed through `strip`. */
  const take = (test: (line: string) => boolean, strip: (line: string) => string) => {
    const taken: string[] = [];
    for (; index < lines.length && test(lines[index] ?? ""); index += 1)
      taken.push(strip(lines[index] ?? ""));
    return taken;
  };
  while (index < lines.length) {
    const line = lines[index] ?? "";
    const problem = unsupported.find(([pattern]) => pattern.test(line));
    const figure = line.match(image);
    if (line.trim() === "") {
      index += 1;
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      blocks.push({ type: line.startsWith("## ") ? "h2" : "h3", text: line.replace(/^#+ /, "") });
      index += 1;
    } else if (line.startsWith("```")) {
      const end = lines.indexOf("```", index + 1);
      if (end === -1) throw new Error(`${source}:${firstLine + index}: unclosed code block.`);
      blocks.push({
        type: "code",
        language: line.slice(3).trim(),
        code: lines.slice(index + 1, end).join("\n"),
      });
      index = end + 1;
    } else if (figure) {
      const [, alt = "", path = ""] = figure;
      blocks.push({ type: "image", alt, src: versioned(`/${path}`), ...imageSize(`/${path}`) });
      index += 1;
    } else if (problem) {
      throw new Error(`${source}:${firstLine + index}: ${problem[1]}`);
    } else if (line.startsWith("- ")) {
      const items = take(
        (next) => next.startsWith("- "),
        (next) => next.slice(2),
      );
      blocks.push({ type: "ul", items });
    } else if (ordered.test(line)) {
      const items = take(
        (next) => ordered.test(next),
        (next) => next.replace(ordered, ""),
      );
      blocks.push({ type: "ol", items });
    } else if (line.startsWith("> ")) {
      const text = take(
        (next) => next.startsWith("> "),
        (next) => next.slice(2),
      ).join(" ");
      blocks.push({ type: "quote", text });
    } else {
      const text = take(
        (next) =>
          next.trim() !== "" &&
          !blockStart.test(next) &&
          !ordered.test(next) &&
          !unsupported.some(([pattern]) => pattern.test(next)),
        (next) => next.trim(),
      )
        .map((part) => (part.endsWith("\\") ? `${part.slice(0, -1)}\n` : `${part} `))
        .join("")
        .trim();
      blocks.push({ type: "p", text });
    }
  }
  return blocks;
}

/** The text of every block that has any, in order. */
function texts(blocks: readonly Block[]): string[] {
  return blocks.flatMap((block) => {
    switch (block.type) {
      case "ul":
      case "ol":
        return block.items;
      case "code":
      case "image":
        return [];
      case "h2":
      case "h3":
      case "p":
      case "quote":
        return [block.text];
      default: {
        const exhaustive: never = block;
        return exhaustive;
      }
    }
  });
}

/** Words a reader reads: everything but code and images. */
export function wordCount(blocks: readonly Block[]): number {
  return texts(blocks)
    .join(" ")
    .split(/\s+/)
    .filter((word) => /\w/.test(word)).length;
}

const inline =
  /`([^`]+)`|\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^\s)]*)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** Whether `Inline` sets any of `text` in italics, a link's label included. */
function emphasized(text: string): boolean {
  return [...text.matchAll(inline)].some(
    ([, , label, , , em]) => em !== undefined || (label !== undefined && emphasized(label)),
  );
}

/** Whether the blocks set anything in italics, so the page can preload the italic face. */
export function usesItalic(blocks: readonly Block[]): boolean {
  return texts(blocks).some(emphasized);
}

/** Plain text with its hard line breaks rendered as `<br>`. */
function withBreaks(text: string): ComponentChildren[] {
  return text.split("\n").flatMap((part, index) => (index === 0 ? [part] : [<br />, part]));
}

/** Inline Markdown: code, links, strong and emphasis. */
export function Inline({ text }: { text: string }) {
  const nodes: ComponentChildren[] = [];
  let last = 0;
  for (const match of text.matchAll(inline)) {
    const [whole, code, label, href = "", strong, em] = match;
    nodes.push(...withBreaks(text.slice(last, match.index)));
    last = match.index + whole.length;
    if (code !== undefined) {
      nodes.push(<code {...stylex.props(ui.mono, styles.code)}>{code}</code>);
    } else if (label !== undefined) {
      const external = href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" };
      nodes.push(
        <a {...stylex.props(ui.link, ui.focusRing)} href={href} {...external}>
          <Inline text={label} />
        </a>,
      );
    } else if (strong !== undefined) {
      nodes.push(<strong {...stylex.props(styles.strong)}>{strong}</strong>);
    } else {
      nodes.push(<em>{em}</em>);
    }
  }
  nodes.push(...withBreaks(text.slice(last)));
  return <>{nodes}</>;
}

const wide: Record<Block["type"], boolean> = {
  h2: false,
  h3: false,
  p: false,
  quote: true,
  ul: false,
  ol: false,
  code: true,
  image: true,
};

/** Space above a block, by what came before it: chapters open wide, headings hold their text. */
function gap(previous: Block | undefined, block: Block) {
  if (previous === undefined) return null;
  if (block.type === "h2") return styles.chapter;
  if (block.type === "h3") return styles.subchapter;
  if (previous.type === "h2" || previous.type === "h3") return styles.afterHeading;
  return wide[previous.type] || wide[block.type] ? styles.aroundWide : styles.paragraph;
}

export function Markdown({ blocks }: { blocks: readonly Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const spacing = gap(blocks[index - 1], block);
        switch (block.type) {
          case "h2":
            return (
              <h2 {...stylex.props(ui.serif, styles.h2, spacing)}>
                <Inline text={block.text} />
              </h2>
            );
          case "h3":
            return (
              <h3 {...stylex.props(ui.serif, styles.h3, spacing)}>
                <Inline text={block.text} />
              </h3>
            );
          case "p":
            return (
              <p {...stylex.props(ui.prose, spacing)}>
                <Inline text={block.text} />
              </p>
            );
          case "quote":
            return (
              <blockquote {...stylex.props(ui.prose, styles.quote, spacing)}>
                <Inline text={block.text} />
              </blockquote>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List {...stylex.props(ui.prose, styles.list, spacing)}>
                {block.items.map((item) => (
                  <li {...stylex.props(styles.item)}>
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "code":
            return (
              <pre {...stylex.props(ui.mono, styles.pre, spacing)}>
                <code>{block.code}</code>
              </pre>
            );
          case "image":
            return (
              <img
                {...stylex.props(styles.image, spacing)}
                src={block.src}
                alt={block.alt}
                width={block.width}
                height={block.height}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            );
          default: {
            const exhaustive: never = block;
            return exhaustive;
          }
        }
      })}
    </>
  );
}

const styles = stylex.create({
  chapter: { marginTop: space.x6 },
  subchapter: { marginTop: space.x4 },
  afterHeading: { marginTop: space.x2 },
  paragraph: { marginTop: space.x2 },
  aroundWide: { marginTop: space.x3 },
  h2: {
    fontSize: type.subheading,
    fontWeight: weights.medium,
    lineHeight: leading.x4_5,
    letterSpacing: tracking.tight,
    color: colors.primary,
    textWrap: "balance",
  },
  h3: {
    fontSize: type.title,
    fontWeight: weights.medium,
    lineHeight: leading.x4,
    color: colors.primary,
    textWrap: "balance",
  },
  strong: { color: colors.primary, fontWeight: weights.semibold },
  quote: {
    paddingInlineStart: space.x2,
    borderInlineStartWidth: stroke.width,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: colors.tertiary,
    color: colors.secondary,
  },
  list: { paddingInlineStart: space.x3 },
  item: { marginTop: { default: space.x1, ":first-child": 0 } },
  code: {
    fontSize: "0.875em",
    paddingInline: "0.25em",
    borderRadius: "0.25em",
    backgroundColor: colors.codeBg,
    color: colors.primary,
  },
  pre: {
    overflowX: "auto",
    padding: space.x2,
    borderRadius: space.x1,
    backgroundColor: colors.codeBg,
    color: colors.primary,
    fontSize: type.small,
    lineHeight: leading.x2_5,
    tabSize: 4,
  },
  image: {
    display: "block",
    width: "100%",
    height: "auto",
    borderRadius: space.x1,
  },
});
