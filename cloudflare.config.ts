import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./worker/index.ts" with { type: "cf-worker" };

/**
 * The site is one Worker with static assets. The assets are the client build's output, where
 * `vite.config.ts` prerenders every page; only `/api/*` runs the Worker's code.
 */
export default defineConfig({
  worker: {
    name: "introspectum-si",
    entrypoint,
    compatibilityDate: "2026-10-01",
    domains: ["introspectum.si"],
    assets: {
      runWorkerFirst: ["/api/*"],
      // Unknown paths get `public/404.html` with a 404 status.
      notFoundHandling: "404-page",
    },
    env: {
      // The waiting lists. The first `cf deploy` creates the namespace; later deploys keep it.
      WAITLIST: bindings.kv(),
    },
    observability: { enabled: true },
  },
});
