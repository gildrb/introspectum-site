import { agentVersion, productList, type ToolName, tools } from "../src/agents.ts";
import { isLocale, sourceLocale } from "../src/locale.ts";
import { company } from "../src/site.ts";

/**
 * The MCP server (Streamable HTTP, stateless, JSON responses) and the A2A agent (JSON-RPC) that
 * `src/agents.ts` describes. Both read the site's static files through the assets binding: the
 * product list, the sitemap, the Markdown copy of each page and llms.txt. Neither can write.
 */

/** MCP revisions this server speaks, newest first. */
const mcpVersions = ["2025-11-25", "2025-06-18", "2025-03-26"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
};

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null && key in value
    ? Reflect.get(value, key)
    : undefined;
}

type Id = string | number | null;
type Call = { id: Id | undefined; method: string; params: unknown };

/** A JSON-RPC 2.0 request or notification; undefined for anything else. */
function call(body: unknown): Call | undefined {
  const method = field(body, "method");
  const id = field(body, "id");
  if (field(body, "jsonrpc") !== "2.0" || typeof method !== "string") return undefined;
  if (id !== undefined && id !== null && typeof id !== "string" && typeof id !== "number")
    return undefined;
  return { id, method, params: field(body, "params") };
}

function json(body: unknown, status = 200): Response {
  return new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  });
}

const result = (id: Id, value: unknown) => json({ jsonrpc: "2.0", id, result: value });
const failure = (id: Id, code: number, message: string) =>
  json({ jsonrpc: "2.0", id, error: { code, message } });

/** The request's JSON-RPC call, or the error response to send instead. */
async function readCall(request: Request): Promise<Call | Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST")
    return new Response("Method not allowed\n", {
      status: 405,
      headers: { Allow: "POST", ...cors },
    });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(null, -32700, "Parse error: the body is not JSON.");
  }
  return call(body) ?? failure(null, -32600, "Invalid request: expected one JSON-RPC 2.0 call.");
}

type Outcome =
  | { $: "Text"; text: string }
  | { $: "Data"; text: string; data: Record<string, unknown> }
  | { $: "Failed"; text: string };

/** A page's Markdown copy, by the page's path; see `markdown` in `index.ts`. */
async function readPage(path: unknown, assets: Fetcher, base: URL): Promise<Outcome> {
  if (typeof path !== "string" || !/^\/[a-z0-9/-]{0,200}$/.test(path) || path.includes("//"))
    return { $: "Failed", text: "`path` must be a page path such as `/about`." };
  const trimmed = path.replace(/\/+$/, "");
  const copy = await assets.fetch(new URL(`${trimmed === "" ? "/index" : trimmed}.md`, base));
  if (copy.status !== 200) {
    await copy.body?.cancel();
    return { $: "Failed", text: `No page at ${path}. list_pages names every page.` };
  }
  return { $: "Text", text: await copy.text() };
}

async function run(name: ToolName, args: unknown, assets: Fetcher, base: URL): Promise<Outcome> {
  switch (name) {
    case "list_products": {
      const locale = field(args, "locale") ?? sourceLocale;
      if (typeof locale !== "string" || !isLocale(locale))
        return { $: "Failed", text: "`locale` must be `en` or `de`." };
      const list = productList(locale);
      return { $: "Data", text: JSON.stringify(list, null, 2), data: { products: list } };
    }
    case "list_pages": {
      const sitemap = await (await assets.fetch(new URL("/sitemap.xml", base))).text();
      const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc = ""]) => loc);
      return { $: "Data", text: pages.join("\n"), data: { pages } };
    }
    case "read_page":
      return readPage(field(args, "path"), assets, base);
    default: {
      const unknown: never = name;
      return unknown;
    }
  }
}

/** `POST /mcp`: the MCP server. */
export async function mcp(request: Request, assets: Fetcher): Promise<Response> {
  const parsed = await readCall(request);
  if (parsed instanceof Response) return parsed;
  const { id, method, params } = parsed;
  // A notification (`notifications/initialized`, …) gets no answer.
  if (id === undefined) return new Response(null, { status: 202, headers: cors });
  switch (method) {
    case "initialize": {
      const asked = field(params, "protocolVersion");
      return result(id, {
        protocolVersion: mcpVersions.find((version) => version === asked) ?? mcpVersions[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "introspectum", title: company.name, version: agentVersion },
        instructions:
          "Read-only access to introspectum.eu: list the products, list the pages, read any page as Markdown.",
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools });
    case "tools/call": {
      const name = tools.find((tool) => tool.name === field(params, "name"))?.name;
      if (name === undefined) return failure(id, -32602, "Unknown tool. tools/list names them.");
      const outcome = await run(name, field(params, "arguments"), assets, new URL(request.url));
      const content = [{ type: "text", text: outcome.text }];
      switch (outcome.$) {
        case "Text":
          return result(id, { content });
        case "Data":
          return result(id, { content, structuredContent: outcome.data });
        case "Failed":
          return result(id, { content, isError: true });
        default: {
          const unknown: never = outcome;
          return unknown;
        }
      }
    }
    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

/** What an A2A message asks for: a page by its path, the products, or else the site's guide. */
function intent(message: unknown): { tool: ToolName; args: unknown } | undefined {
  const parts = field(message, "parts");
  for (const part of Array.isArray(parts) ? parts : []) {
    const data = field(part, "data");
    if (field(data, "path") !== undefined) return { tool: "read_page", args: data };
    if (field(data, "skill") === "list_products") return { tool: "list_products", args: data };
    const text = field(part, "text");
    if (typeof text !== "string") continue;
    const trimmed = text.trim();
    if (trimmed.startsWith("/")) return { tool: "read_page", args: { path: trimmed } };
    if (/\bproduct/i.test(trimmed)) return { tool: "list_products", args: {} };
  }
  return undefined;
}

/** `POST /a2a`: the A2A agent. Every answer is one message; it never starts a task. */
export async function a2a(request: Request, assets: Fetcher): Promise<Response> {
  const parsed = await readCall(request);
  if (parsed instanceof Response) return parsed;
  const { id = null, method, params } = parsed;
  switch (method) {
    case "message/send": {
      const message = field(params, "message");
      const base = new URL(request.url);
      const wanted = intent(message);
      const outcome: Outcome =
        wanted === undefined
          ? { $: "Text", text: await (await assets.fetch(new URL("/llms.txt", base))).text() }
          : await run(wanted.tool, wanted.args, assets, base);
      const contextId = field(message, "contextId");
      return result(id, {
        kind: "message",
        role: "agent",
        messageId: crypto.randomUUID(),
        ...(typeof contextId === "string" && { contextId }),
        parts:
          outcome.$ === "Data"
            ? [{ kind: "data", data: outcome.data }]
            : [{ kind: "text", text: outcome.text }],
      });
    }
    case "tasks/get":
    case "tasks/cancel":
      return failure(id, -32001, "Task not found: this agent answers with messages, not tasks.");
    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}
