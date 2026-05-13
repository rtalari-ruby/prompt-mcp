// Shared server factory used by both the stdio entry (src/server.ts)
// and the HTTP entry (src/http-server.ts). All tool registration lives
// here so the two transports never drift.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { scaffoldPromptTool } from "./tools/scaffold.js";
import { improvePromptTool } from "./tools/improve.js";
import { critiquePromptTool } from "./tools/critique.js";
import { applyTechniqueTool } from "./tools/technique.js";
import { generateExamplesTool } from "./tools/examples.js";
import { buildEvalTool } from "./tools/eval.js";
import { designChainTool } from "./tools/chain.js";
import { explainConceptTool } from "./tools/explain.js";

type ToolModule = {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodRawShape;
  /**
   * Tool handler. Receives the parsed input and the MCP request-handler
   * `extra` so LLM-using tools can request sampling from the host client
   * (Claude Code / Desktop) instead of needing an external API key.
   */
  handler: (
    input: any,
    extra?: any,
  ) => Promise<{ markdown: string; structured?: unknown }>;
};

export const TOOLS: ToolModule[] = [
  scaffoldPromptTool,
  improvePromptTool,
  critiquePromptTool,
  applyTechniqueTool,
  generateExamplesTool,
  buildEvalTool,
  designChainTool,
  explainConceptTool,
];

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "prompt-mcp", version: "0.2.0" },
    { capabilities: { tools: {} } },
  );

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (input: any, extra: any) => {
        const result = await tool.handler(input ?? {}, extra);
        return {
          content: [{ type: "text", text: result.markdown }],
          structuredContent: result.structured
            ? (result.structured as Record<string, unknown>)
            : undefined,
        };
      },
    );
  }

  return server;
}
