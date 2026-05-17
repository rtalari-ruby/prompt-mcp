// Phase-0 smoke harness: spawns the compiled server over stdio, lists tools,
// and invokes one stub. Acts as the "mcp-inspector" acceptance check.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, "../../dist/server.js");

const EXPECTED_TOOLS = [
  // Prompt-engineering family (LLM-backed)
  "scaffold_prompt",
  "improve_prompt",
  "critique_prompt",
  "apply_technique",
  "generate_examples",
  "build_eval",
  "design_chain",
  "explain_concept",
  // Manifest KB family (personal store, no LLM)
  "pf_create_prompt",
  "pf_find_prompt",
  "pf_apply_prompt",
  "pf_list_prompts",
  "pf_log_session",
  "pf_scope_feature",
];

async function main() {
  // Use a throwaway KB so the manifest tools don't pollute ~/.promptforge/kb
  // across smoke runs. Set this BEFORE spawning the child so the server
  // inherits it.
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const tmp = mkdtempSync(join(tmpdir(), "pf-smoke-"));

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: { ...process.env, PROMPTFORGE_HOME: tmp },
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

  // Exercise one manifest KB tool round-trip against the throwaway KB
  // configured above so the smoke also covers the new family.
  try {
    const created = await client.callTool({
      name: "pf_create_prompt",
      arguments: {
        raw: "smoke: fix the rate-limit retry bug in ruby_ml",
        repos: ["ruby_ml"],
      },
    });
    const createdStruct = created.structuredContent as { id: string; type: string };
    if (createdStruct.type !== "bug-fix")
      throw new Error(`pf_create_prompt expected bug-fix, got ${createdStruct.type}`);

    const found = await client.callTool({
      name: "pf_find_prompt",
      arguments: { query: "rate limit" },
    });
    const foundStruct = found.structuredContent as {
      hits: Array<{ id: string }>;
      count: number;
    };
    if (foundStruct.count !== 1 || foundStruct.hits[0]?.id !== createdStruct.id)
      throw new Error(
        `pf_find_prompt expected 1 hit for created id, got ${JSON.stringify(foundStruct)}`,
      );

    console.log(
      `pf_create_prompt + pf_find_prompt round-trip: ${createdStruct.id} (KB=${tmp})`,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  await client.close();
  console.log("PASS: phase-0 smoke");
}

main().catch((err) => {
  console.error("smoke failed:", err);
  process.exit(1);
});
