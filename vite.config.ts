import assert from "node:assert";
import type { IncomingMessage, ServerResponse } from "node:http";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import stylexVite from "@stylexjs/unplugin/vite";
import { defineConfig, type Plugin } from "vite-plus";
import type * as RenderModule from "./src/render.tsx";

type Render = typeof RenderModule;

/** The renderer module, as the bundler hands it back untyped; its signatures are `render.tsx`'s. */
function isRender(module: unknown): module is Render {
  return (
    typeof module === "object" &&
    module !== null &&
    "render" in module &&
    typeof module.render === "function" &&
    "shareImage" in module &&
    typeof module.shareImage === "function" &&
    "shareCards" in module &&
    typeof module.shareCards === "object" &&
    "sharePath" in module &&
    typeof module.sharePath === "function" &&
    "stamp" in module &&
    typeof module.stamp === "function" &&
    "versionedCopies" in module &&
    typeof module.versionedCopies === "function"
  );
}

function renderModule(module: unknown): Render {
  if (!isRender(module)) throw new TypeError("src/render.tsx lacks the expected exports");
  return module;
}

const ssrOutDir = "node_modules/.site-ssr";

// StyleX's plugin exposes the CSS it has collected so far; the dev server inlines it, so pages are
// styled from their first byte exactly as in production (no separate stylesheet or runtime).
const stylexPlugin: Plugin & { __stylexCollectCss?: () => string } = stylexVite({
  useCSSLayers: true,
  lightningcssOptions: { minify: true },
  devMode: "css-only",
});

const sitePlugin: Plugin = {
  name: "site",
  configureServer(server) {
    // Pages are server-rendered on each request, so any source edit simply reloads the page.
    server.watcher.on("change", (file) => {
      if (file.includes(`${path.sep}src${path.sep}`)) server.ws.send({ type: "full-reload" });
    });
    // Connect ignores returned promises: hand a rejection to `next` so it reaches the error page.
    server.middlewares.use((request, response, next) => {
      serve(request, response).then(
        (handled) => {
          if (!handled) next();
        },
        (error: unknown) => next(error),
      );
    });
    /** Answers the request if it names a page or a share image; false lets Vite serve it. */
    async function serve(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
      const { pathname } = new URL(request.url ?? "/", "http://localhost");
      const site = renderModule(await server.ssrLoadModule("/src/render.tsx"));
      const css = stylexPlugin.__stylexCollectCss?.() ?? "";
      const card = Object.entries(site.shareCards).find(
        ([page]) => site.sharePath(page) === pathname,
      )?.[1];
      if (card !== undefined) {
        response.setHeader("Content-Type", "image/png");
        response.end(await site.shareImage(card, css));
        return true;
      }
      const shareImages = Object.fromEntries(
        Object.keys(site.shareCards).map((page) => [page, site.sharePath(page)]),
      );
      const files = site.render({ script: "/src/client.ts", css }, shareImages);
      // A stamped font or image: rewrite the URL so Vite serves the public file it copies.
      const copy = site.versionedCopies().get(pathname);
      if (copy) {
        request.url = copy;
        return false;
      }
      const file = [pathname.slice(1), `${pathname.slice(1) || "index"}.html`].find(
        (name) => name in files,
      );
      if (!file) return false;
      const body = files[file] ?? "";
      const type = file.endsWith(".html")
        ? "text/html"
        : file.endsWith(".xml")
          ? "application/xml"
          : "text/plain";
      response.setHeader("Content-Type", `${type}; charset=utf-8`);
      response.end(file.endsWith(".html") ? await server.transformIndexHtml(pathname, body) : body);
      return true;
    }
  },
};

export default defineConfig({
  staged: { "*": "vp check --fix" },
  fmt: { ignorePatterns: ["src/content/**", "public/**"] },
  lint: {
    ignorePatterns: ["public/**"],
    plugins: ["typescript", "unicorn", "oxc", "import"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    categories: { correctness: "error", suspicious: "error" },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/no-explicit-any": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "typescript/consistent-type-definitions": ["error", "type"],
      "typescript/switch-exhaustiveness-check": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "no-var": "error",
      // StyleX names the hook that hands over its collected CSS.
      "no-underscore-dangle": ["error", { allow: ["__stylexCollectCss"] }],
      "prefer-const": "error",
      eqeqeq: "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
  appType: "custom",
  server: { host: "127.0.0.1", port: 5175, strictPort: false },
  // The Cloudflare plugin runs `worker/` in the Workers runtime under `vp dev`, with local KV, and
  // after the build below writes the Worker and the client output as Build Output for `cf deploy`.
  // Its environment is named `worker`: `ssr` (its default) is the Node prerenderer below.
  plugins: [stylexPlugin, sitePlugin, cloudflare({ viteEnvironment: { name: "worker" } })],
  environments: {
    client: { build: { rollupOptions: { input: "src/client.ts" } } },
    ssr: {
      build: {
        outDir: ssrOutDir,
        copyPublicDir: false,
        rollupOptions: { input: "src/render.tsx" },
      },
    },
  },
  builder: {
    // Prerender every page: the SSR pass registers all StyleX rules, the client pass bundles the
    // island and emits the collected CSS, which is inlined into each page. The Cloudflare plugin's
    // own post-build step then builds the Worker, once the pages are in the client output.
    async buildApp(builder) {
      const { ssr, client: browser } = builder.environments;
      assert(ssr && browser);
      const prerender = await builder.build(ssr);
      assert("output" in prerender);
      const renderer = prerender.output.find((chunk) => chunk.type === "chunk" && chunk.isEntry);
      assert(renderer);
      const client = await builder.build(browser);
      assert("output" in client);
      const entry = client.output.find((chunk) => chunk.type === "chunk" && chunk.isEntry);
      assert(entry);
      const outDir = browser.config.build.outDir;
      const cssFile = path.join(outDir, "assets/stylex.css");
      const css = await readFile(cssFile, "utf8");
      // Dynamic: the SSR bundle exists only once `builder.build(ssr)` above has written it.
      const site = renderModule(await import(path.resolve(ssrOutDir, renderer.fileName)));
      const write = async (file: string, body: string | Uint8Array) => {
        await mkdir(path.dirname(path.join(outDir, file)), { recursive: true });
        await writeFile(path.join(outDir, file), body);
      };
      // Share images first: the pages link them by names stamped with their bytes.
      const shareImages = Object.fromEntries(
        await Promise.all(
          Object.entries(site.shareCards).map(async ([page, card]) => {
            const image = await site.shareImage(card, css);
            const url = site.stamp(site.sharePath(page), image);
            await write(url, image);
            return [page, url];
          }),
        ),
      );
      const files = site.render({ script: `/${entry.fileName}`, css }, shareImages);
      await Promise.all(Object.entries(files).map(([file, body]) => write(file, body)));
      // Rendering named every stamped font and image; copy each public file to its stamped name.
      await Promise.all(
        [...site.versionedCopies()].map(([stamped, source]) =>
          copyFile(path.join(outDir, source), path.join(outDir, stamped)),
        ),
      );
      await Promise.all([rm(cssFile), rm(ssrOutDir, { recursive: true })]);
    },
  },
});
