// Phase-0 smoke harness: spawns the compiled server over stdio, lists tools,
// and invokes one stub. Acts as the "mcp-inspector" acceptance check.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, "../../dist/server.js");

const EXPECTED_TOOLS = [
  "scaffold_prompt",
  "improve_prompt",
  "critique_prompt",
  "apply_technique",
  "generate_examples",
  "build_eval",
  "design_chain",
  "explain_concept",
];

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: { ...process.env },
  });
  const client = new Client(
    { name: "prompt-mcp-smoke", version: "0.0.1" },
    { capabilities: {} },
  );
  await client.connect(transport);

  const list = await client.listTools();
  const names = list.tools.map((t) => t.name).sort();
  const expected = [...EXPECTED_TOOLS].sort();
  const ok =
    names.length === expected.length &&
    names.every((n, i) => n === expected[i]);

  console.log(`tools/list: ${names.length} tools`);
  for (const t of list.tools) console.log(`  - ${t.name}`);
  if (!ok) {
    console.error("FAIL: tool list mismatch");
    console.error("  got     :", names);
    console.error("  expected:", expected);
    await client.close();
    process.exit(1);
  }

  const callRes = await client.callTool({
    name: "explain_concept",
    arguments: { concept: "chain-of-thought" },
  });
  const text =
    Array.isArray(callRes.content) && callRes.content[0]?.type === "text"
      ? (callRes.content[0] as { text: string }).text
      : "";
  console.log(`explain_concept stub returned: ${text.slice(0, 80)}`);

  await client.close();
  console.log("PASS: phase-0 smoke");
}

main().catch((err) => {
  console.error("smoke failed:", err);
  process.exit(1);
});
