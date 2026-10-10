import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/** Stamped path → the `public/` path it is a copy of. */
const copies = new Map<string, `/${string}`>();
/** `public/` path → its stamped path, so each file is hashed once. */
const stamped = new Map<string, string>();

/**
 * `path` with a hash of `bytes` in its file name (`/images/og-image.3kQ…x.png`): the URL changes
 * exactly when the content does. The hash is in the name, not a query string, so the new URL does
 * not exist until the deploy carrying it is live; nothing can cache old bytes under it meanwhile.
 */
export function stamp(path: `/${string}`, bytes: Uint8Array): string {
  const hash = createHash("sha256").update(bytes).digest("base64url").slice(0, 10);
  const dot = path.lastIndexOf(".");
  if (dot <= path.lastIndexOf("/")) throw new Error(`No file extension to stamp before: ${path}`);
  return `${path.slice(0, dot)}.${hash}${path.slice(dot)}`;
}

/**
 * The URL of a file in `public/`, stamped with a hash of its bytes. Fonts and images are served
 * as immutable for a year (see `public/_headers`), so a file replaced under the same name would
 * otherwise stay stale in every cache. The build copies each file to its stamped path
 * (`versionedCopies`); the dev server serves it from there. Build-time only.
 */
export function versioned(path: `/${string}`): string {
  let url = stamped.get(path);
  if (url === undefined) {
    url = stamp(path, readFileSync(`public${path}`));
    stamped.set(path, url);
    copies.set(url, path);
  }
  return url;
}

/** Every stamped path handed out so far, with the `public/` file it copies. */
export function versionedCopies(): ReadonlyMap<string, `/${string}`> {
  return copies;
}

/**
 * The intrinsic size of an image in `public/`, so the page reserves the image's space before it
 * loads. Reads PNG, JPEG, WebP and SVG headers. Build-time only.
 */
export function imageSize(path: `/${string}`): { width: number; height: number } {
  const file = readFileSync(`public${path}`);
  const fail = () => new Error(`Cannot read the size of public${path}.`);
  const ascii = (start: number, end: number) => file.toString("latin1", start, end);
  if (ascii(1, 4) === "PNG" && file.length >= 24)
    return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) };
  if (file[0] === 0xff && file[1] === 0xd8) {
    // JPEG: walk the segments to the frame header, which holds the size.
    for (let offset = 2; offset + 9 <= file.length && file[offset] === 0xff;) {
      const marker = file[offset + 1] ?? 0;
      const frame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (frame)
        return { height: file.readUInt16BE(offset + 5), width: file.readUInt16BE(offset + 7) };
      offset += 2 + file.readUInt16BE(offset + 2);
    }
    throw fail();
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP" && file.length >= 30) {
    const chunk = ascii(12, 16);
    if (chunk === "VP8X")
      return { width: 1 + file.readUIntLE(24, 3), height: 1 + file.readUIntLE(27, 3) };
    if (chunk === "VP8L") {
      const bits = file.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8 ")
      return { width: file.readUInt16LE(26) & 0x3fff, height: file.readUInt16LE(28) & 0x3fff };
    throw fail();
  }
  if (path.endsWith(".svg")) {
    const box = ascii(0, Math.min(file.length, 4096)).match(
      /viewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/,
    );
    if (box) return { width: Number(box[1]), height: Number(box[2]) };
  }
  throw fail();
}
