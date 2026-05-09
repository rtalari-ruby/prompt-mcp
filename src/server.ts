#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
  handler: (input: any) => Promise<{ markdown: string; structured?: unknown }>;
};

const TOOLS: ToolModule[] = [
  scaffoldPromptTool,
  improvePromptTool,
  critiquePromptTool,
  applyTechniqueTool,
  generateExamplesTool,
  buildEvalTool,
  designChainTool,
  explainConceptTool,
];

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "prompt-mcp", version: "0.1.0" },
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
      async (input: any) => {
        const result = await tool.handler(input ?? {});
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

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Stay alive on stdio. The transport keeps the process running.
  process.stderr.write(`prompt-mcp ready (${TOOLS.length} tools)\n`);
}

main().catch((err) => {
  process.stderr.write(`prompt-mcp fatal: ${err?.stack || err}\n`);
  process.exit(1);
});
