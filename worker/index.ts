import { type MessageId, translators, waitlistConsent } from "../src/i18n.ts";
import { href, isLocale, type Locale, sourceLocale } from "../src/locale.ts";
import { products } from "../src/site.ts";

/**
 * The Worker behind `/api/*`; every other path is a static asset (`cloudflare.config.ts`). The
 * waiting lists live in the `WAITLIST` KV namespace, one entry per `<product>:<email>`. List a
 * product's entries with `cf kv keys list --namespace-id <id> --prefix software-factory:`; the ID
 * is in `cf kv namespaces list`.
 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== "/api/waitlist") return new Response("Not found\n", { status: 404 });
    if (request.method !== "POST")
      return new Response("Method not allowed\n", { status: 405, headers: { Allow: "POST" } });
    return join(request, env.WAITLIST);
  },
} satisfies ExportedHandler<Env>;

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
