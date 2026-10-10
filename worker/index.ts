import { products, waitlistConsent } from "../src/site.ts";

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
  /** The sentence the person agreed to, as the form showed it. */
  consent: string;
  joinedAt: string;
};

/** Loose on purpose: only the confirmation email would prove an address; this catches typos. */
const address = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/**
 * Adds a person to a product's waiting list. The form posts here: hydrated it asks for JSON and
 * reads the result in place; without JavaScript the browser follows the redirect to `/joined`.
 */
async function join(request: Request, storage: KVNamespace): Promise<Response> {
  const json = request.headers.get("Accept")?.includes("application/json") ?? false;
  const reject = (status: number, detail: string) =>
    json
      ? new Response(`${JSON.stringify({ title: "Not added", status, detail })}\n`, {
          status,
          headers: {
            "Content-Type": "application/problem+json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        })
      : new Response(
          `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Not added</title><p>${detail}</p><p><a href="/products">Back to the products</a></p>\n`,
          {
            status,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
          },
        );

  // Only this site's own form may write: a page elsewhere cannot add addresses to the list.
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    return reject(403, "Send the form from this site.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reject(400, "The form could not be read. Please send it again.");
  }
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  };

  if (field("website") !== "")
    return reject(400, "The form could not be read. Please send it again.");
  const product = products.find(({ slug }) => slug === field("product"));
  if (product === undefined) return reject(400, "There is no waiting list for this product.");
  const person = field("email").toLowerCase();
  if (person.length > 254 || !address.test(person))
    return reject(400, "Please enter a valid email address.");
  const company = field("company");
  if (company.length > 200) return reject(400, "Please shorten the company name.");
  if (field("consent") !== "yes")
    return reject(400, "Please agree that we may store your address for this waiting list.");

  // Joining twice keeps the first entry, and its date.
  const key = `${product.slug}:${person}`;
  if ((await storage.get(key)) === null) {
    const entry: Entry = {
      email: person,
      company: company === "" ? null : company,
      product: product.slug,
      consent: waitlistConsent(product),
      joinedAt: new Date().toISOString(),
    };
    await storage.put(key, JSON.stringify(entry), { metadata: { joinedAt: entry.joinedAt } });
  }

  return json
    ? new Response(`${JSON.stringify({ status: "joined", product: product.slug })}\n`, {
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      })
    : Response.redirect(new URL("/joined", request.url).href, 303);
}
