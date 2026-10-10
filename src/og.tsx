import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { decompress } from "wawoff2";
import { company } from "./site.ts";
import { colors } from "./tokens.stylex.ts";

/** The frame link previews use (1.91:1). */
export const shareFrame = { width: 1200, height: 630 } as const;

/** What a page's link preview says: where it sits on the site, its title, and who wrote it. */
export type ShareCard = { kicker?: string; title: string; byline?: string };

/** A token's default (dark) value: the first declaration of its variable in the built CSS. */
function token(css: string, variable: string): string {
  const name = variable.match(/^var\((--[\w-]+)\)$/)?.[1];
  if (name === undefined) throw new Error(`Not a CSS variable: ${variable}`);
  const value = css.match(new RegExp(`${name}:([^;}]+)`))?.[1];
  if (value === undefined) throw new Error(`No value for ${name} in the built CSS.`);
  return value.trim();
}

/** A linear-light sRGB channel, clamped, gamma-encoded and scaled to 0–255. */
function srgbChannel(linear: number): number {
  const clamped = Math.min(1, Math.max(0, linear));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
}

/**
 * `oklch(L C H / alpha)` in sRGB, which the rasterizer understands. The matrices are OKLab's
 * (Björn Ottosson, 2020), from OKLCH through linear LMS and linear sRGB.
 */
function srgb(color: string): string {
  const match = color.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/,
  );
  if (!match) throw new Error(`Unsupported color: ${color}`);
  const [, lightness = "", lightnessPercent, chroma = "", hue = "", alpha, alphaPercent] = match;
  const l = Number(lightness) / (lightnessPercent ? 100 : 1);
  const c = Number(chroma);
  const h = (Number(hue) * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = srgbChannel(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short);
  const green = srgbChannel(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short);
  const blue = srgbChannel(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short);
  const opacity = alpha === undefined ? 1 : Number(alpha) / (alphaPercent ? 100 : 1);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

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

/** The share image's grid: eight units in from every edge, as on the page. */
const inset = 64;

function Card({ card, css }: { card: ShareCard; css: string }) {
  const color = (variable: string) => srgb(token(css, variable));
  // Long titles step down a size so three lines still hold them.
  const titleSize = card.title.length > 56 ? 48 : 64;
  const small = { fontSize: 32, lineHeight: "40px", color: color(colors.tertiary) };
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
        fontFamily: "Inter",
        letterSpacing: "-0.02em",
      }}
    >
      <div style={{ display: "flex", fontSize: 40, lineHeight: "48px" }}>{company.name}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {card.kicker !== undefined && (
          <div style={{ display: "flex", ...small, marginBottom: 16 }}>{card.kicker}</div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            lineHeight: `${titleSize + 8}px`,
          }}
        >
          {card.title}
        </div>
        {card.byline !== undefined && (
          <div style={{ display: "flex", ...small, marginTop: 24 }}>{card.byline}</div>
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
    fonts: [{ name: "Inter", data: await inter, weight: 400, style: "normal" }],
  });
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
