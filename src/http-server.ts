#!/usr/bin/env node
// HTTP entry. Exposes the same 8 tools over Streamable HTTP for use by
// Claude.ai, Claude Desktop, or any MCP client that speaks HTTPS.
//
// Auth: bearer token via Authorization: Bearer <PROMPT_MCP_TOKEN>.
// Set PROMPT_MCP_TOKEN in .env or the process env. If unset, the server
// refuses to start (refusing anonymous access — protects the LLM key).
//
// Endpoints:
//   POST /mcp        — MCP messages (Streamable HTTP transport)
//   GET  /mcp        — MCP SSE stream (Streamable HTTP transport)
//   DELETE /mcp      — MCP session termination
//   GET  /healthz    — health check (no auth)

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import { loadEnv } from "./llm/env.js";
loadEnv();

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer, TOOLS } from "./build-server.js";

const PORT = Number(process.env.PORT ?? process.env.PROMPT_MCP_PORT ?? 3000);
const HOST = process.env.PROMPT_MCP_HOST ?? "127.0.0.1";
const TOKEN = process.env.PROMPT_MCP_TOKEN ?? "";

if (!TOKEN) {
  console.error(
    "FATAL: PROMPT_MCP_TOKEN is not set. Refusing to start a public MCP server without auth.\n" +
      "Set PROMPT_MCP_TOKEN in .env (any high-entropy string).",
  );
  process.exit(1);
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      if (chunks.length === 0) return resolve(undefined);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function checkAuth(req: IncomingMessage): boolean {
  const header = req.headers["authorization"] ?? "";
  if (!header) return false;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) return false;
  // constant-time compare to avoid timing leaks on a short string
  const got = Buffer.from(m[1]);
  const want = Buffer.from(TOKEN);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function main() {
  const server = buildServer();
  // Stateless mode: each request is independent — works well behind
  // serverless / cold-start hosting. If you need streaming across many
  // turns, set sessionIdGenerator to randomUUID.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  await server.connect(transport);

  const http = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // health check (no auth)
    if (req.method === "GET" && url.pathname === "/healthz") {
      return send(res, 200, { ok: true, tools: TOOLS.length });
    }

    // root → friendly hint
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
      return send(res, 200, {
        name: "prompt-mcp",
        version: "0.2.0",
        endpoint: "/mcp",
        tools: TOOLS.length,
        docs: "https://github.com/your/repo/tree/main/prompt-mcp",
      });
    }

    if (url.pathname !== "/mcp") {
      return send(res, 404, { error: "not_found", path: url.pathname });
    }

    if (!checkAuth(req)) {
      res.setHeader("WWW-Authenticate", 'Bearer realm="prompt-mcp"');
      return send(res, 401, { error: "unauthorized" });
    }

    try {
      const body = req.method === "POST" ? await readJsonBody(req) : undefined;
      await transport.handleRequest(req, res, body);
    } catch (err) {
      if (!res.headersSent) {
        send(res, 500, { error: "internal", message: (err as Error).message });
      } else {
        try {
          res.end();
        } catch {
          // ignore
        }
      }
    }
  });

  http.listen(PORT, HOST, () => {
    console.error(
      `prompt-mcp ready (${TOOLS.length} tools, http) http://${HOST}:${PORT}/mcp`,
    );
    console.error(`auth: Bearer ${TOKEN.slice(0, 4)}…${TOKEN.slice(-4)} (set via PROMPT_MCP_TOKEN)`);
  });

  function shutdown(sig: string) {
    console.error(`\n${sig} → shutting down`);
    http.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(`prompt-mcp http fatal: ${err?.stack || err}`);
  process.exit(1);
});
