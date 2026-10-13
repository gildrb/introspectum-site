/**
 * Agent readiness of the built site, checked against a local server (`vp preview`), the way
 * isitagentready.com and is-agentic.com check the live one. Stricter than both: every link a
 * discovery document names must resolve, and every protocol endpoint must answer the protocol.
 * Usage: node bench/agent-ready.ts <base-url>. Prints one line per check and `METRIC` lines.
 */
import { createHash } from "node:crypto";

const [argument] = process.argv.slice(2);
if (argument === undefined) throw new Error("usage: node bench/agent-ready.ts <base-url>");
const base: string = argument;

type Fetched = { status: number; type: string; headers: Headers; body: string };

/** Absolute links name the live origin; they are fetched from the local server instead. */
async function get(href: string, init: RequestInit = {}): Promise<Fetched> {
  const url = new URL(href.replace("https://introspectum.eu", base), base);
  const response = await fetch(url, { redirect: "follow", ...init });
  return {
    status: response.status,
    type: response.headers.get("content-type") ?? "",
    headers: response.headers,
    body: await response.text(),
  };
}

function parse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

/** `value.a.b…`, or undefined where a step is not an object with that key. */
function at(value: unknown, ...keys: readonly string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (typeof current !== "object" || current === null || !(key in current)) return undefined;
    current = Reflect.get(current, key);
  }
  return current;
}

/** A nonempty string, or undefined. */
function str(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function list(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

async function resolves(href: unknown): Promise<boolean> {
  const url = str(href);
  return url !== undefined && (await get(url)).status === 200;
}

/** A JSON-RPC 2.0 call: its result, or undefined on any error. */
async function rpc(url: string, method: string, params: unknown): Promise<unknown> {
  const response = await get(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const reply = parse(response.body);
  if (response.status !== 200 || at(reply, "jsonrpc") !== "2.0" || at(reply, "error") !== undefined)
    return undefined;
  return at(reply, "result");
}

async function markdownPage(path: string): Promise<boolean> {
  const md = await get(path, { headers: { Accept: "text/markdown" } });
  const html = await get(path, { headers: { Accept: "text/html" } });
  const varyAccept = [md, html].every(({ headers }) =>
    (headers.get("vary") ?? "").split(",").some((name) => name.trim().toLowerCase() === "accept"),
  );
  return (
    md.status === 200 &&
    md.type.startsWith("text/markdown") &&
    md.body.trim().length >= 200 &&
    !md.body.includes("<html") &&
    html.status === 200 &&
    html.type.startsWith("text/html") &&
    varyAccept
  );
}

const checks: Readonly<Record<string, () => Promise<boolean>>> = {
  async robots_txt() {
    const r = await get("/robots.txt");
    return r.status === 200 && r.type.startsWith("text/plain") && /^user-agent:/im.test(r.body);
  },
  async sitemap() {
    const r = await get("/sitemap.xml");
    return r.status === 200 && r.body.includes("<urlset");
  },
  async link_headers() {
    const header = (await get("/")).headers.get("link") ?? "";
    const entries = [...header.matchAll(/<([^>]+)>\s*;([^,]*)/g)];
    const useful = entries.some(([, , params]) =>
      /rel="?[^";]*\b(api-catalog|service-desc|service-doc|describedby)\b/.test(params ?? ""),
    );
    const targets = await Promise.all(entries.map(([, href]) => resolves(href)));
    return useful && targets.every(Boolean);
  },
  async markdown_negotiation() {
    return (await Promise.all(["/", "/about", "/de"].map(markdownPage))).every(Boolean);
  },
  async ai_bot_rules() {
    const { body } = await get("/robots.txt");
    return /^user-agent:\s*(\*|gptbot|claudebot|oai-searchbot|claude-searchbot)/im.test(body);
  },
  async content_signals() {
    const { body } = await get("/robots.txt");
    return /^content-signal:.*\b(ai-train|search|ai-input)=(yes|no)/im.test(body);
  },
  async api_catalog() {
    const r = await get("/.well-known/api-catalog");
    const linkset = list(at(parse(r.body), "linkset"));
    if (r.status !== 200 || !r.type.startsWith("application/linkset+json")) return false;
    if (linkset.length === 0) return false;
    const hrefs = linkset.flatMap((entry) => {
      const links = [...list(at(entry, "service-desc")), ...list(at(entry, "service-doc"))];
      return str(at(entry, "anchor")) === undefined || links.length === 0
        ? [undefined]
        : links.map((link) => at(link, "href"));
    });
    return (await Promise.all(hrefs.map(resolves))).every(Boolean);
  },
  async mcp_server_card() {
    const card = parse((await get("/.well-known/mcp/server-card.json")).body);
    const url = str(at(card, "transport", "url"));
    if (str(at(card, "serverInfo", "name")) === undefined || url === undefined) return false;
    const init = await rpc(url, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "bench", version: "0" },
    });
    if (str(at(init, "serverInfo", "name")) === undefined) return false;
    return list(at(await rpc(url, "tools/list", {}), "tools")).length > 0;
  },
  async a2a_agent_card() {
    const card = parse((await get("/.well-known/agent-card.json")).body);
    const url = str(at(list(at(card, "supportedInterfaces"))[0], "url"));
    if (str(at(card, "name")) === undefined || str(at(card, "version")) === undefined) return false;
    if (url === undefined) return false;
    const reply = await rpc(url, "message/send", {
      message: {
        role: "user",
        kind: "message",
        messageId: "bench",
        parts: [{ kind: "text", text: "What does Introspectum make?" }],
      },
    });
    return reply !== undefined;
  },
  async agent_skills() {
    const index = parse((await get("/.well-known/agent-skills/index.json")).body);
    const skills = list(at(index, "skills"));
    if (str(at(index, "$schema")) === undefined || skills.length === 0) return false;
    const ok = await Promise.all(
      skills.map(async (skill) => {
        const url = str(at(skill, "url"));
        if (url === undefined || str(at(skill, "name")) === undefined) return false;
        if (str(at(skill, "description")) === undefined) return false;
        const r = await get(url);
        const digest = `sha256:${createHash("sha256").update(r.body).digest("hex")}`;
        return r.status === 200 && digest === at(skill, "digest");
      }),
    );
    return ok.every(Boolean);
  },
  async webmcp() {
    const page = (await get("/")).body;
    if (/<form[^>]*\btoolname=/.test(page)) return true;
    const scripts = [...page.matchAll(/<script[^>]*src="([^"]+)"/g)].map(([, src]) => src ?? "");
    const bodies = await Promise.all(scripts.map(async (src) => (await get(src)).body));
    return bodies.some((body) => body.includes("registerTool"));
  },
  async ard() {
    const manifest = parse((await get("/.well-known/ai-catalog.json")).body);
    const entries = list(at(manifest, "entries"));
    if (str(at(manifest, "specVersion")) === undefined || at(manifest, "host") === undefined)
      return false;
    if (entries.length === 0) return false;
    const ok = await Promise.all(
      entries.map(async (entry) => {
        const id = str(at(entry, "identifier")) ?? "";
        if (!id.startsWith("urn:air:introspectum.eu:") || str(at(entry, "type")) === undefined)
          return false;
        if (str(at(entry, "displayName")) === undefined) return false;
        const url = at(entry, "url");
        const data = at(entry, "data");
        if ((url === undefined) === (data === undefined)) return false;
        return data !== undefined || (await resolves(url));
      }),
    );
    return ok.every(Boolean);
  },
  async oauth_discovery() {
    for (const path of [
      "/.well-known/oauth-authorization-server",
      "/.well-known/openid-configuration",
    ]) {
      const meta = parse((await get(path)).body);
      const authorize = str(at(meta, "authorization_endpoint"));
      if (
        str(at(meta, "issuer")) !== undefined &&
        authorize !== undefined &&
        str(at(meta, "token_endpoint")) !== undefined &&
        list(at(meta, "grant_types_supported")).length > 0
      )
        return (await get(authorize)).status !== 404;
    }
    return false;
  },
  async oauth_protected_resource() {
    const meta = parse((await get("/.well-known/oauth-protected-resource")).body);
    return (
      str(at(meta, "resource")) !== undefined && list(at(meta, "authorization_servers")).length > 0
    );
  },
  async auth_md() {
    const r = await get("/auth.md");
    const meta = parse((await get("/.well-known/oauth-authorization-server")).body);
    return r.status === 200 && at(meta, "agent_auth") !== undefined;
  },
  async not_found_markdown() {
    const r = await get("/__bench-missing", { headers: { Accept: "text/markdown" } });
    return (
      r.status === 404 &&
      r.type.startsWith("text/markdown") &&
      r.body.trim().length >= 20 &&
      /(llms\.txt|sitemap\.xml)/.test(r.body)
    );
  },
  async agent_instruction() {
    return /^#+ .*when to use/im.test((await get("/llms.txt")).body);
  },
  async org_schema() {
    const page = (await get("/")).body;
    const blocks = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const nodes = blocks.flatMap(([, json]) => {
      const data = parse(json ?? "");
      return [data, ...list(data), ...list(at(data, "@graph"))];
    });
    return nodes.some((node) => {
      if (at(node, "@type") !== "Organization") return false;
      const contacts = [at(node, "contactPoint"), ...list(at(node, "contactPoint"))];
      const contact = contacts.some(
        (c) =>
          str(at(c, "contactType")) !== undefined &&
          (str(at(c, "email")) ?? str(at(c, "telephone"))) !== undefined,
      );
      return contact && at(node, "address", "@type") === "PostalAddress";
    });
  },
  async trust_anchors() {
    const pages = await Promise.all(["/about", "/contact", "/privacy"].map((p) => get(p)));
    return pages.every(({ status, body }) => {
      const words = body
        .replaceAll(/<(script|style|template)[\s\S]*?<\/\1>/g, " ")
        .replaceAll(/<[^>]+>/g, " ")
        .replaceAll(/\s+/g, " ")
        .trim();
      return status === 200 && words.length >= 500;
    });
  },
};

const results = await Promise.all(
  Object.entries(checks).map(async ([id, check]) => {
    try {
      return { id, ok: await check() };
    } catch (error: unknown) {
      console.error(`${id}: ${String(error)}`);
      return { id, ok: false };
    }
  }),
);
const passed = results.filter(({ ok }) => ok).length;
for (const { id, ok } of results) console.log(`${ok ? "pass" : "FAIL"} ${id}`);
console.log(`METRIC agent_ready_pct=${((100 * passed) / results.length).toFixed(1)}`);
console.log(`METRIC checks_passed=${passed}`);
console.log(`METRIC checks_total=${results.length}`);
