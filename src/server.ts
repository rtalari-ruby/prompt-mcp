#!/usr/bin/env node
// Stdio entry. Used by Claude Code (local subprocess transport).
// For Claude.ai / Claude Desktop over HTTPS, use http-server.ts instead.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadEnv } from "./llm/env.js";
loadEnv();

import { buildServer, TOOLS } from "./build-server.js";

async function main() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`prompt-mcp ready (${TOOLS.length} tools, stdio)\n`);
}

main().catch((err) => {
  process.stderr.write(`prompt-mcp fatal: ${err?.stack || err}\n`);
  process.exit(1);
});
