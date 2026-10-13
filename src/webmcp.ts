import { mcpPath, tools } from "./agent-tools.ts";

/**
 * WebMCP (https://webmachinelearning.github.io/webmcp/): an agent working in the visitor's browser
 * gets the MCP server's read-only tools on every page. Each call goes to `/mcp` on this origin,
 * so the browser and a remote agent get the same answers. `client.ts` loads this module only in a
 * browser that offers `document.modelContext` (or the earlier `navigator.modelContext`).
 */
export function registerTools(context: object): void {
  const register: unknown = Reflect.get(context, "registerTool");
  if (typeof register !== "function") return;
  for (const tool of tools)
    Reflect.apply(register, context, [
      {
        ...tool,
        annotations: { readOnlyHint: true },
        async execute(input: unknown): Promise<unknown> {
          const response = await fetch(mcpPath, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: { name: tool.name, arguments: input ?? {} },
            }),
          });
          if (!response.ok) throw new Error(`${mcpPath} answered HTTP ${response.status}`);
          const reply: unknown = await response.json();
          const error: unknown =
            typeof reply === "object" && reply !== null ? Reflect.get(reply, "error") : undefined;
          if (error !== undefined) throw new Error(JSON.stringify(error));
          return typeof reply === "object" && reply !== null ? Reflect.get(reply, "result") : reply;
        },
      },
    ]);
}
