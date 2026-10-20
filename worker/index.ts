import { a2aPath, mcpPath } from "../src/agent-tools.ts";
import { type MessageId, translators, type Values, waitlistConsent } from "../src/i18n.ts";
import { href, isLocale, type Locale, type Route, sourceLocale } from "../src/locale.ts";
import {
  type InquiryTopic,
  inquiryMaxLength,
  isInquiryTopic,
  isTeamSize,
  products,
  type TeamSize,
} from "../src/site.ts";
import { a2a, mcp } from "./agents.ts";

/**
 * The Worker in front of the site (`cloudflare.config.ts`). `/api/waitlist` takes sign-ups,
 * `/api/contact` takes the contact form's inquiries, `/mcp` and `/a2a` answer AI agents
 * (`agents.ts`); every page goes to the static assets, as HTML or, for clients that ask for
 * `text/markdown`, as the Markdown copy the build writes next to it. Both forms write to the
 * `WAITLIST` KV namespace: the waiting lists one entry per `<product>:<email>`, the inquiries one
 * per `inquiry:<ISO time>:<random ID>`, so they list oldest first, each expiring a year after it
 * arrived (as the privacy policy says). List a product's entries with
 * `cf kv keys list --namespace-id <id> --prefix software-factory:`, the inquiries with
 * `--prefix inquiry:`, and read one with `cf kv keys get --namespace-id <id> <key>`; the ID is in
 * `cf kv namespaces list`.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const forms = { "/api/waitlist": join, "/api/contact": inquire } as const;
    if (url.pathname === "/api/waitlist" || url.pathname === "/api/contact") {
      if (request.method !== "POST")
        return new Response("Method not allowed\n", { status: 405, headers: { Allow: "POST" } });
      return forms[url.pathname](request, env.WAITLIST);
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

/** Loose on purpose: only the confirmation email would prove an address; this catches typos. */
const address = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** How a form's posts are answered: its rejections' title, and where their error page leads. */
type Form = { title: MessageId; back: { route: Route; label: MessageId } };

/** Why a post was turned away; `field` names the form field at fault, for the form to point at. */
type Problem = { status: number; reason: MessageId; values?: Values; field?: string };

/**
 * A rejected post in the language of the page the form was on: problem details (RFC 9457) for the
 * hydrated form, which asks for JSON; a short page with a way back for a browser without
 * JavaScript.
 */
function reject(request: Request, form: Form, locale: Locale, problem: Problem): Response {
  const { status, reason, values, field } = problem;
  const t = translators[locale];
  const title = t.text(form.title);
  const detail = t.text(reason, values);
  const headers = { "Cache-Control": "no-store", "Content-Language": locale };
  if (wantsJson(request))
    return new Response(
      `${JSON.stringify({ title, status, detail, ...(field !== undefined && { field }) })}\n`,
      {
        status,
        headers: { ...headers, "Content-Type": "application/problem+json; charset=utf-8" },
      },
    );
  const back = t.text(form.back.label);
  return new Response(
    `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><p>${detail}</p><p><a href="${href(locale, form.back.route)}">${back}</a></p></html>\n`,
    { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
  );
}

function wantsJson(request: Request): boolean {
  return request.headers.get("Accept")?.includes("application/json") ?? false;
}

/**
 * A post's fields, trimmed, once it came from this site's own page, and the language it was sent
 * in; or the problem with it. A page elsewhere cannot write to the namespace through a visitor's
 * browser, and a bot that fills the hidden `website` field is turned away.
 */
async function read(
  request: Request,
): Promise<
  | { $: "Read"; locale: Locale; field: (name: string) => string }
  | { $: "Rejected"; locale: Locale; problem: Problem }
> {
  if (request.headers.get("Origin") !== new URL(request.url).origin)
    return {
      $: "Rejected",
      locale: sourceLocale,
      problem: { status: 403, reason: "api_error_origin" },
    };
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return {
      $: "Rejected",
      locale: sourceLocale,
      problem: { status: 400, reason: "api_error_unreadable" },
    };
  }
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const requested = field("locale");
  if (!isLocale(requested))
    return {
      $: "Rejected",
      locale: sourceLocale,
      problem: { status: 400, reason: "api_error_unreadable" },
    };
  if (field("website") !== "")
    return {
      $: "Rejected",
      locale: requested,
      problem: { status: 400, reason: "api_error_unreadable" },
    };
  return { $: "Read", locale: requested, field };
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

const waitlistForm: Form = {
  title: "api_not_added",
  back: { route: "products", label: "back_to_products" },
};

/**
 * Adds a person to a product's waiting list. The form posts here: hydrated it asks for JSON and
 * reads the result in place; without JavaScript the browser follows the redirect to the
 * confirmation page. Every answer is in the language of the page the form was on.
 */
async function join(request: Request, storage: KVNamespace): Promise<Response> {
  const post = await read(request);
  if (post.$ === "Rejected") return reject(request, waitlistForm, post.locale, post.problem);
  const { locale, field } = post;
  const fail = (reason: MessageId, name: string) =>
    reject(request, waitlistForm, locale, { status: 400, reason, field: name });

  // Research has no waiting list: only products we sell take sign-ups.
  const product = products.find(
    ({ slug, shelf }) => slug === field("product") && shelf === "products",
  );
  if (product === undefined) return fail("api_error_product", "product");
  const person = field("email").toLowerCase();
  if (person.length > 254 || !address.test(person)) return fail("api_error_email", "email");
  const company = field("company");
  if (company.length > 200) return fail("api_error_company", "company");
  if (field("consent") !== "yes") return fail("api_error_consent", "consent");

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

  return wantsJson(request)
    ? new Response(`${JSON.stringify({ status: "joined", product: product.slug })}\n`, {
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      })
    : Response.redirect(new URL(href(locale, "joined"), request.url).href, 303);
}

/** What the namespace holds for each message sent with the contact form. */
type Inquiry = {
  name: string;
  email: string;
  company: string | null;
  teamSize: TeamSize;
  /** The answer to "What are you building with AI?", line ends as `\n`. */
  building: string;
  topic: InquiryTopic;
  /** The language the person wrote in; we answer in it. */
  locale: Locale;
  receivedAt: string;
};

const contactForm: Form = {
  title: "api_not_sent",
  back: { route: "contact", label: "contact_form_back" },
};

/**
 * Stores a message from the contact form. Like `join`: hydrated, the form asks for JSON and
 * answers in place; without JavaScript the browser follows the redirect to the confirmation page.
 * Each field is checked against the limits the form shows (`inquiryMaxLength`), and a rejection
 * names the field at fault.
 */
async function inquire(request: Request, storage: KVNamespace): Promise<Response> {
  const post = await read(request);
  if (post.$ === "Rejected") return reject(request, contactForm, post.locale, post.problem);
  const { locale, field } = post;
  const fail = (reason: MessageId, name: string, values?: Values) =>
    reject(request, contactForm, locale, {
      status: 400,
      reason,
      field: name,
      ...(values !== undefined && { values }),
    });

  const name = field("name");
  if (name === "" || name.length > inquiryMaxLength.name)
    return fail("api_error_name", "name", { max: inquiryMaxLength.name });
  const person = field("email");
  if (person.length > inquiryMaxLength.email || !address.test(person))
    return fail("api_error_email", "email");
  const company = field("company");
  if (company.length > inquiryMaxLength.company) return fail("api_error_company", "company");
  const teamSize = field("team");
  if (!isTeamSize(teamSize)) return fail("api_error_team", "team");
  // Browsers send a textarea's line ends as CRLF but count each as one character.
  const building = field("building").replaceAll("\r\n", "\n");
  if (building === "" || building.length > inquiryMaxLength.building)
    return fail("api_error_building", "building", { max: inquiryMaxLength.building });
  const topic = field("topic");
  if (!isInquiryTopic(topic)) return fail("api_error_topic", "topic");

  const inquiry: Inquiry = {
    name,
    email: person,
    company: company === "" ? null : company,
    teamSize,
    building,
    topic,
    locale,
    receivedAt: new Date().toISOString(),
  };
  // The privacy policy promises each message is deleted a year after it arrives.
  await storage.put(
    `inquiry:${inquiry.receivedAt}:${crypto.randomUUID()}`,
    JSON.stringify(inquiry),
    {
      metadata: { receivedAt: inquiry.receivedAt, topic },
      expirationTtl: 365 * 24 * 60 * 60,
    },
  );

  return wantsJson(request)
    ? new Response(`${JSON.stringify({ status: "sent", topic })}\n`, {
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      })
    : Response.redirect(new URL(href(locale, "sent"), request.url).href, 303);
}
