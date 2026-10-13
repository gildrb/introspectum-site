/**
 * Full-page screenshots of the main pages, mobile and desktop, light and dark, compared with the
 * hashes in `bench/visual.json`: the agent-facing work must not move a pixel. Uses Chromium over
 * the DevTools protocol (`CHROME_PATH`). Usage: node bench/visual.ts <base-url> [--record].
 * Screenshots go to `$TMPDIR/introspectum-visual/` for comparison when a page differs.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const [argument, mode] = process.argv.slice(2);
if (argument === undefined) throw new Error("usage: node bench/visual.ts <base-url> [--record]");
const base: string = argument;
const chrome = process.env.CHROME_PATH ?? "chromium";
const baselineFile = path.join(import.meta.dirname, "visual.json");
const shots = path.join(os.tmpdir(), "introspectum-visual");

const pages = [
  "/",
  "/de",
  "/about",
  "/products",
  "/products/software-factory",
  "/join",
  "/blog",
  "/imprint",
  "/privacy",
  "/__missing",
];
const views = [
  { name: "mobile", width: 390, height: 844, mobile: true, scheme: "light" },
  { name: "desktop", width: 1440, height: 900, mobile: false, scheme: "light" },
  { name: "dark", width: 1440, height: 900, mobile: false, scheme: "dark" },
] as const;

const profile = await mkdtemp(path.join(os.tmpdir(), "introspectum-chrome-"));
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
const devtools = Promise.withResolvers<string>();
let log = "";
browser.stderr.on("data", (chunk: Buffer) => {
  log += chunk.toString();
  const match = /DevTools listening on (ws:\S+)/.exec(log);
  if (match?.[1] !== undefined) devtools.resolve(match[1]);
});
browser.on("exit", (code) => devtools.reject(new Error(`chromium exited ${String(code)}: ${log}`)));

const socket = new WebSocket(await devtools.promise);
const opened = Promise.withResolvers<void>();
socket.addEventListener("open", () => opened.resolve(), { once: true });
await opened.promise;
let nextId = 0;
const pending = new Map<number, (message: unknown) => void>();
const listeners = new Set<(message: unknown) => void>();
socket.addEventListener("message", ({ data }) => {
  const message: unknown = JSON.parse(String(data));
  const id = typeof message === "object" && message !== null && "id" in message ? message.id : null;
  if (typeof id === "number") pending.get(id)?.(message);
  for (const listener of listeners) listener(message);
});

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null && key in value
    ? Reflect.get(value, key)
    : undefined;
}

/** One DevTools command; rejects with the protocol's error. */
function send(method: string, params: object = {}, sessionId?: string): Promise<unknown> {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  const { promise, resolve, reject } = Promise.withResolvers<unknown>();
  pending.set(id, (message) => {
    pending.delete(id);
    const error = field(message, "error");
    if (error === undefined) resolve(field(message, "result"));
    else reject(new Error(`${method}: ${JSON.stringify(error)}`));
  });
  return promise;
}

const target = field(await send("Target.createTarget", { url: "about:blank" }), "targetId");
const attached = await send("Target.attachToTarget", { targetId: target, flatten: true });
const sessionField = field(attached, "sessionId");
if (typeof sessionField !== "string") throw new Error("no DevTools session");
const session: string = sessionField;
await send("Page.enable", {}, session);

async function screenshot(page: string, view: (typeof views)[number]): Promise<Buffer> {
  await send(
    "Emulation.setDeviceMetricsOverride",
    { width: view.width, height: view.height, deviceScaleFactor: 1, mobile: view.mobile },
    session,
  );
  await send(
    "Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-color-scheme", value: view.scheme }] },
    session,
  );
  const loaded = Promise.withResolvers<void>();
  const listener = (message: unknown) => {
    if (
      field(message, "method") === "Page.loadEventFired" &&
      field(message, "sessionId") === session
    ) {
      listeners.delete(listener);
      loaded.resolve();
    }
  };
  listeners.add(listener);
  await send("Page.navigate", { url: new URL(page, base).href }, session);
  await loaded.promise;
  const ready = await send(
    "Runtime.evaluate",
    {
      expression:
        "document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).then(() => location.origin + ' ' + (document.querySelector('main') !== null))",
      awaitPromise: true,
      returnByValue: true,
    },
    session,
  );
  if (field(field(ready, "result"), "value") !== `${new URL(base).origin} true`)
    throw new Error(`${page} did not load from ${base}`);
  // Lazy images below the fold load only when scrolled to; the screenshot must show them all.
  await send(
    "Runtime.evaluate",
    {
      expression:
        "Promise.all([...document.images].map((image) => { image.loading = 'eager'; return image.decode().catch(() => {}); })).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))",
      awaitPromise: true,
    },
    session,
  );
  const metrics = await send("Page.getLayoutMetrics", {}, session);
  const height = Math.ceil(Number(field(field(metrics, "cssContentSize"), "height")));
  const shot = await send(
    "Page.captureScreenshot",
    {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: view.width, height, scale: 1 },
    },
    session,
  );
  const data = field(shot, "data");
  if (typeof data !== "string") throw new Error(`no screenshot of ${page}`);
  return Buffer.from(data, "base64");
}

await rm(shots, { recursive: true, force: true });
await mkdir(shots, { recursive: true });
const hashes: Record<string, string> = {};
for (const view of views)
  for (const page of pages) {
    const png = await screenshot(page, view);
    const key = `${view.name} ${page}`;
    hashes[key] = createHash("sha256").update(png).digest("hex");
    await writeFile(path.join(shots, `${view.name}${page.replaceAll("/", "_")}.png`), png);
  }
socket.close();
const exited = Promise.withResolvers<void>();
browser.removeAllListeners("exit");
browser.on("exit", () => exited.resolve());
browser.kill();
await exited.promise;
await rm(profile, { recursive: true, force: true });

if (mode === "--record") {
  await writeFile(baselineFile, `${JSON.stringify(hashes, null, 2)}\n`);
  console.log(`recorded ${Object.keys(hashes).length} screenshots`);
} else {
  const baseline: unknown = JSON.parse(await readFile(baselineFile, "utf8"));
  const changed = Object.entries(hashes).filter(([key, hash]) => field(baseline, key) !== hash);
  for (const [key] of changed) console.log(`changed: ${key}`);
  console.log(`METRIC visual_changed=${changed.length}`);
}
