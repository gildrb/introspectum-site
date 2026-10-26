import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./worker/index.ts" with { type: "cf-worker" };

/**
 * The site is one Worker with static assets. The assets are the client build's output, where
 * `vite.config.ts` prerenders every page. The Worker runs first for `/api/*` and for the pages,
 * which it serves as Markdown to clients that ask for it; files with stamped names never reach it.
 *
 * The default export is a function of the build context: preview uploads reject the `domains`
 * field, so the custom domain applies only outside preview builds (`cf previews deploy` sets
 * `isPreview` for the build it delegates to vite).
 */
export default defineConfig(({ isPreview }) => ({
  worker: {
    name: "introspectum-eu",
    entrypoint,
    compatibilityDate: "2026-10-01",
    domains: isPreview ? [] : ["introspectum.eu"],
    assets: {
      runWorkerFirst: ["/*", "!/assets/*", "!/images/*", "!/fonts/*", "!/brand/*"],
      // Unknown paths get `public/404.html` with a 404 status.
      notFoundHandling: "404-page",
    },
    env: {
      ASSETS: bindings.assets(),
      // The waiting lists & the contact form's inquiries (`worker/index.ts`). The first
      // `cf deploy` creates the namespace; later deploys keep it.
      WAITLIST: bindings.kv(),
    },
    observability: { enabled: true },
  },
}));
