import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { decompress } from "wawoff2";
import { srgb, token } from "./color.ts";
import { company } from "./site.ts";
import { colors } from "./tokens.stylex.ts";

/** The frame link previews use (1.91:1). */
export const shareFrame = { width: 1200, height: 630 } as const;

/** What a page's link preview says: where it sits on the site, its title, and who wrote it. */
export type ShareCard = { kicker?: string; title: string; byline?: string };

const variationTables: Record<string, true> = {
  fvar: true,
  gvar: true,
  avar: true,
  HVAR: true,
  MVAR: true,
  STAT: true,
};

/**
 * The font without its variation tables: its default instance, Inter at weight 400, the page's
 * text weight. Satori's font parser cannot read variable fonts.
 */
function defaultInstance(font: Uint8Array): Buffer {
  const source = Buffer.from(font);
  const tables = Array.from({ length: source.readUInt16BE(4) }, (_, index) => {
    const record = 12 + index * 16;
    return {
      tag: source.toString("latin1", record, record + 4),
      body: source.subarray(
        source.readUInt32BE(record + 8),
        source.readUInt32BE(record + 8) + source.readUInt32BE(record + 12),
      ),
    };
  }).filter(({ tag }) => !Object.hasOwn(variationTables, tag));
  // An sfnt: version, table count, then one 16-byte record per table, bodies 4-byte aligned.
  const directory = Buffer.alloc(12 + tables.length * 16);
  source.copy(directory, 0, 0, 4);
  directory.writeUInt16BE(tables.length, 4);
  const bodies: Buffer[] = [];
  let offset = directory.length;
  for (const [index, { tag, body }] of tables.entries()) {
    const record = 12 + index * 16;
    directory.write(tag, record, "latin1");
    directory.writeUInt32BE(offset, record + 8);
    directory.writeUInt32BE(body.length, record + 12);
    const aligned = Buffer.alloc(Math.ceil(body.length / 4) * 4);
    body.copy(aligned);
    bodies.push(aligned);
    offset += aligned.length;
  }
  return Buffer.concat([directory, ...bodies]);
}

// Inter with the page's case forms built in, since satori cannot turn features on.
const inter = decompress(readFileSync("src/fonts/inter-share.woff2")).then(defaultInstance);
// Newsreader as a static instance at its display size (optical size 72, weight 500), for titles.
// `decompress` hands back a view into its WebAssembly memory, which its next call reuses: Inter
// is copied out before this one starts.
const newsreader = inter
  .then(() => decompress(readFileSync("src/fonts/newsreader-share.woff2")))
  .then((font) => Buffer.from(font));

/** The share image's grid: eight units in from every edge, as on the page. */
const inset = 64;

function Card({ card, css }: { card: ShareCard; css: string }) {
  const color = (variable: string) => srgb(token(css, variable));
  // Long titles step down a size so three lines still hold them.
  const titleSize = card.title.length > 56 ? 56 : 72;
  const small = {
    fontFamily: "Inter",
    fontSize: 32,
    lineHeight: "40px",
    color: color(colors.secondary),
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: shareFrame.width,
        height: shareFrame.height,
        // Satori lays boxes out content-box by default; the inset must come out of the frame.
        boxSizing: "border-box",
        padding: inset,
        backgroundColor: color(colors.bg),
        color: color(colors.primary),
        fontFamily: "Newsreader",
      }}
    >
      <div style={{ display: "flex", fontSize: 44, lineHeight: "48px", letterSpacing: "-0.01em" }}>
        {company.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {card.kicker !== undefined && (
          <div style={{ display: "flex", ...small, marginBottom: 24 }}>{card.kicker}</div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            lineHeight: `${titleSize + 8}px`,
            letterSpacing: "-0.02em",
          }}
        >
          {card.title}
        </div>
        {card.byline !== undefined && (
          <div style={{ display: "flex", ...small, marginTop: 32 }}>{card.byline}</div>
        )}
      </div>
    </div>
  );
}

/** Renders a page's link preview as PNG bytes. `css` is the built stylesheet, for its colors. */
export async function shareImage(card: ShareCard, css: string): Promise<Uint8Array> {
  const svg = await satori(<Card card={card} css={css} />, {
    width: shareFrame.width,
    height: shareFrame.height,
    fonts: [
      { name: "Inter", data: await inter, weight: 400, style: "normal" },
      { name: "Newsreader", data: await newsreader, weight: 500, style: "normal" },
    ],
  });
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
