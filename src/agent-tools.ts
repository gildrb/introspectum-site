import { locales } from "./locale.ts";

/**
 * The tools an agent can call on the site: the MCP server at `/mcp` (`worker/agents.ts`) and, in a
 * visitor's browser, WebMCP (`webmcp.ts`). Kept free of the catalogs, so the browser bundle stays
 * small. Every tool only reads.
 */

export const mcpPath = "/mcp";
export const a2aPath = "/a2a";
/** A JSON Schema for a tool's arguments. */
type ObjectSchema = {
  type: "object";
  properties: Readonly<
    Record<string, { type: "string"; description: string; enum?: readonly string[] }>
  >;
  required: readonly string[];
  additionalProperties: false;
};

const localeArgument = {
  type: "string",
  description: "Language of the answer.",
  enum: [...locales],
} as const;

export const tools = [
  {
    name: "list_products",
    title: "List products",
    description:
      "The company's products: what each does, who it is for, where it stands, and its page & waiting list.",
    inputSchema: {
      type: "object",
      properties: { locale: localeArgument },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "list_pages",
    title: "List pages",
    description: "Every public page of the site, in English & German, from the sitemap.",
    inputSchema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "read_page",
    title: "Read a page",
    description:
      "One page of the site as Markdown, by its path: `/`, `/about`, `/products/erp-crm`, `/de/produkte`.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The page's path on introspectum.eu, from `/`." },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
] as const satisfies readonly {
  name: string;
  title: string;
  description: string;
  inputSchema: ObjectSchema;
}[];

export type ToolName = (typeof tools)[number]["name"];
