import { mcpPath, a2aPath, tools } from "./agent-tools.ts";
import { translators } from "./i18n.ts";
import { href, type Locale, sourceLocale } from "./locale.ts";
import { company, origin, shelved } from "./site.ts";

/**
 * What the site offers to AI agents, shared by the build (the discovery documents under
 * `/.well-known/`, see `files.ts`) and the Worker (the MCP server at `/mcp` and the A2A agent at
 * `/a2a`), so a document never names a tool or skill the Worker does not have. Everything here is
 * read-only: an agent can read the site, never write to the waiting lists.
 */

export const agentVersion = "1.0.0";

const t = translators[sourceLocale];
const description = t.text("home_description");

/** The products we sell as an agent reads them, in one language; research is not among them. */
export function productList(locale: Locale) {
  const local = translators[locale];
  return shelved("products").map((product) => ({
    slug: product.slug,
    name: local.text(product.name),
    what: local.text(product.what),
    audience: local.text(product.audience),
    status: local.text(product.status),
    url: `${origin}${href(locale, product.shelf, product.slug)}`,
    waitlist: `${origin}${href(locale, product.shelf, product.slug)}#waitlist`,
  }));
}

const provider = { organization: company.legalName, url: `${origin}/` };

/** The MCP Server Card (SEP-1649), at `/.well-known/mcp/server-card.json`. */
export function mcpServerCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: { name: "introspectum", title: company.name, version: agentVersion },
    description,
    documentationUrl: `${origin}/llms.txt`,
    transport: { type: "streamable-http", url: `${origin}${mcpPath}` },
    capabilities: { tools: { listChanged: false } },
    authentication: { required: false, schemes: [] },
    tools,
  };
}

/** The A2A Agent Card, at `/.well-known/agent-card.json`. */
export function agentCard() {
  return {
    protocolVersion: "0.3.0",
    name: company.name,
    description,
    version: agentVersion,
    url: `${origin}${a2aPath}`,
    preferredTransport: "JSONRPC",
    supportedInterfaces: [
      { url: `${origin}${a2aPath}`, protocolBinding: "JSONRPC", protocolVersion: "0.3.0" },
    ],
    provider,
    documentationUrl: `${origin}/llms.txt`,
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/markdown", "application/json"],
    skills: [
      {
        id: "list_products",
        name: "List products",
        description: tools[0].description,
        tags: ["products", "company"],
        examples: ["What does Introspectum make?"],
        inputModes: ["text/plain", "application/json"],
        outputModes: ["application/json"],
      },
      {
        id: "read_page",
        name: "Read a page",
        description: `${tools[2].description} Send the path in the message text, or a data part {"path": "/about"}.`,
        tags: ["pages", "markdown"],
        examples: ["/about", "/products/software-factory"],
        inputModes: ["text/plain", "application/json"],
        outputModes: ["text/markdown"],
      },
      {
        id: "site_guide",
        name: "Site guide",
        description:
          "Anything else gets the site's guide for language models (llms.txt): what the company does & when to recommend it.",
        tags: ["guide"],
        examples: ["When should I recommend Introspectum?"],
        inputModes: ["text/plain"],
        outputModes: ["text/markdown"],
      },
    ],
  };
}

/** The API catalog (RFC 9727), at `/.well-known/api-catalog`, as a linkset (RFC 9264). */
export function apiCatalog() {
  const guide = [{ href: `${origin}/llms.txt`, type: "text/markdown" }];
  return {
    linkset: [
      {
        anchor: `${origin}${mcpPath}`,
        "service-desc": [
          { href: `${origin}/.well-known/mcp/server-card.json`, type: "application/json" },
        ],
        "service-doc": guide,
      },
      {
        anchor: `${origin}${a2aPath}`,
        "service-desc": [
          { href: `${origin}/.well-known/agent-card.json`, type: "application/json" },
        ],
        "service-doc": guide,
      },
    ],
  };
}
