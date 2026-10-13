import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./worker/index.ts" with { type: "cf-worker" };

/**
 * The site is one Worker with static assets. The assets are the client build's output, where
 * `vite.config.ts` prerenders every page. The Worker runs first for `/api/*` and for the pages,
 * which it serves as Markdown to clients that ask for it; files with stamped names never reach it.
 */
export default defineConfig({
  worker: {
    name: "introspectum-eu",
    entrypoint,
    compatibilityDate: "2026-10-01",
    domains: ["introspectum.eu"],
    assets: {
      runWorkerFirst: ["/*", "!/assets/*", "!/images/*", "!/fonts/*", "!/brand/*"],
      // Unknown paths get `public/404.html` with a 404 status.
      notFoundHandling: "404-page",
    },
    env: {
      ASSETS: bindings.assets(),
      // The waiting lists. The first `cf deploy` creates the namespace; later deploys keep it.
      WAITLIST: bindings.kv(),
    },
    observability: { enabled: true },
  },
});
