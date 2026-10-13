import { a2aPath, mcpPath } from "../src/agents.ts";
import { type MessageId, translators, waitlistConsent } from "../src/i18n.ts";
import { href, isLocale, type Locale, sourceLocale } from "../src/locale.ts";
import { products } from "../src/site.ts";
import { a2a, mcp } from "./agents.ts";

/**
 * The Worker in front of the site (`cloudflare.config.ts`). `/api/waitlist` takes sign-ups, `/mcp`
 * and `/a2a` answer AI agents (`agents.ts`); every page goes to the static assets, as HTML or, for
 * clients that ask for `text/markdown`, as the Markdown copy the build writes next to it. The
 * waiting lists live in the `WAITLIST` KV namespace,
 * one entry per `<product>:<email>`. List a product's entries with
 * `cf kv keys list --namespace-id <id> --prefix software-factory:`; the ID is in
 * `cf kv namespaces list`.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/waitlist") {
      if (request.method !== "POST")
        return new Response("Method not allowed\n", { status: 405, headers: { Allow: "POST" } });
      return join(request, env.WAITLIST);
    }
    if (url.pathname.startsWith("/api/")) return new Response("Not found\n", { status: 404 });
    if (url.pathname === mcpPath) return mcp(request, env.ASSETS);
    if (url.pathname === a2aPath) return a2a(request, env.ASSETS);
    if (prefersMarkdown(request.headers.get("Accept")) && !/\.[a-z0-9]+$/i.test(url.pathname))
      return markdown(url, env.ASSETS);
    const response = await env.ASSETS.fetch(request);
    if (!(response.headers.get("Content-Type") ?? "").startsWith("text/html")) return response;
    const page = new Response(response.body, response);
    page.headers.append("Vary", "Accept");
    // Where an agent finds the machine-readable side of the site (RFC 8288, RFC 9727).
    const copy = `${url.pathname.replace(/\/+$/, "") || "/index"}.md`;
    page.headers.append(
      "Link",
      [
        '</.well-known/api-catalog>; rel="api-catalog"',
        '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
        '</llms.txt>; rel="describedby"; type="text/markdown"',
        ...(response.status === 200 ? [`<${copy}>; rel="alternate"; type="text/markdown"`] : []),
      ].join(", "),
    );
    return page;
  },
} satisfies ExportedHandler<Env>;

/**
 * Whether the client ranks `text/markdown` at least as high as `text/html` (RFC 9110 quality
 * values). Browsers never name `text/markdown`, so they always get HTML.
 */
function prefersMarkdown(accept: string | null): boolean {
  let markdownQuality = 0;
  let htmlQuality = 0;
  for (const range of (accept ?? "").split(",")) {
    const [type = "", ...parameters] = range.split(";").map((part) => part.trim().toLowerCase());
    const q = parameters.find((parameter) => parameter.startsWith("q="));
    const quality = q === undefined ? 1 : Number(q.slice(2));
    if (!Number.isFinite(quality)) continue;
    if (type === "text/markdown") markdownQuality = Math.max(markdownQuality, quality);
    if (type === "text/html") htmlQuality = Math.max(htmlQuality, quality);
  }
  return markdownQuality > 0 && markdownQuality >= htmlQuality;
}

/**
 * A page's Markdown copy: `/` → `/index.md`, `/de/produkte` → `/de/produkte.md`. A path with no
 * page gets its language's 404 page, in Markdown, with a 404 status.
 */
async function markdown(url: URL, assets: Fetcher): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "");
  let copy = await assets.fetch(new URL(`${path === "" ? "/index" : path}.md`, url));
  const found = copy.status === 200;
  if (!found) {
    await copy.body?.cancel();
    copy = await assets.fetch(new URL(path.startsWith("/de/") ? "/de/404.md" : "/404.md", url));
  }
  const response = new Response(copy.body, { status: found ? 200 : 404, headers: copy.headers });
  response.headers.set("Content-Type", "text/markdown; charset=utf-8");
  response.headers.append("Vary", "Accept");
  return response;
}

/** What the namespace holds for each person on a waiting list. */
type Entry = {
  email: string;
  company: string | null;
  product: string;
  /** The language the person signed up in. */
  locale: Locale;
  /** The sentence the person agreed to, as the form showed it. */
  consent: string;
  joinedAt: string;
};

/** Loose on purpose: only the confirmation email would prove an address; this catches typos. */
const address = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/**
 * Adds a person to a product's waiting list. The form posts here: hydrated it asks for JSON and
 * reads the result in place; without JavaScript the browser follows the redirect to the
 * confirmation page. Every answer is in the language of the page the form was on.
 */
async function join(request: Request, storage: KVNamespace): Promise<Response> {
  const json = request.headers.get("Accept")?.includes("application/json") ?? false;
  const reject = (locale: Locale, status: number, reason: MessageId) => {
    const t = translators[locale];
    const title = t.text("api_not_added");
    const detail = t.text(reason);
    const headers = { "Cache-Control": "no-store", "Content-Language": locale };
    if (json)
      return new Response(`${JSON.stringify({ title, status, detail })}\n`, {
        status,
        headers: { ...headers, "Content-Type": "application/problem+json; charset=utf-8" },
      });
    const back = t.text("back_to_products");
    return new Response(
      `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><p>${detail}</p><p><a href="${href(locale, "products")}">${back}</a></p></html>\n`,
      { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
    );
  };

  // Only this site's own form may write: a page elsewhere cannot add addresses to the list.
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    return reject(sourceLocale, 403, "api_error_origin");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reject(sourceLocale, 400, "api_error_unreadable");
  }
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  };

  const requested = field("locale");
  const locale = isLocale(requested) ? requested : sourceLocale;
  if (field("website") !== "" || !isLocale(requested))
    return reject(locale, 400, "api_error_unreadable");
  const product = products.find(({ slug }) => slug === field("product"));
  if (product === undefined) return reject(locale, 400, "api_error_product");
  const person = field("email").toLowerCase();
  if (person.length > 254 || !address.test(person)) return reject(locale, 400, "api_error_email");
  const company = field("company");
  if (company.length > 200) return reject(locale, 400, "api_error_company");
  if (field("consent") !== "yes") return reject(locale, 400, "api_error_consent");

  // Joining twice keeps the first entry, and its date.
  const key = `${product.slug}:${person}`;
  if ((await storage.get(key)) === null) {
    const entry: Entry = {
      email: person,
      company: company === "" ? null : company,
      product: product.slug,
      locale,
      consent: waitlistConsent(locale, product),
      joinedAt: new Date().toISOString(),
    };
    await storage.put(key, JSON.stringify(entry), { metadata: { joinedAt: entry.joinedAt } });
  }

  return json
    ? new Response(`${JSON.stringify({ status: "joined", product: product.slug })}\n`, {
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      })
    : Response.redirect(new URL(href(locale, "joined"), request.url).href, 303);
}
