// Phase-5 smoke: exercise the LLM-backed tools end-to-end.
// First run hits the LLM; subsequent runs are cached on disk.
import { loadEnv } from "../../src/llm/env.js";
loadEnv();

import { llmConfigured } from "../../src/llm/client.js";
import { critiquePromptTool } from "../../src/tools/critique.js";
import { generateExamplesTool } from "../../src/tools/examples.js";
import { scaffoldPromptTool } from "../../src/tools/scaffold.js";
import { improvePromptTool } from "../../src/tools/improve.js";
import { buildEvalTool } from "../../src/tools/eval.js";
import { designChainTool } from "../../src/tools/chain.js";

if (!llmConfigured()) {
  console.error("LLM not configured. Set AZURE_OPENAI_* in .env. Skipping phase-5 smoke.");
  process.exit(0);
}

let fails = 0;

async function step<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
  const t0 = Date.now();
  try {
    const r = await fn();
    console.log(`ok ${name} (${Date.now() - t0}ms)`);
    return r;
  } catch (err) {
    fails++;
    console.error(`FAIL ${name}: ${(err as Error).message}`);
    return null;
  }
}

const badPrompt = "Analyze this and improve it.";

await step("critique (bad prompt)", async () => {
  const r = await critiquePromptTool.handler({ prompt: badPrompt });
  const findings = (r.structured as { findings?: unknown[] }).findings ?? [];
  if (findings.length === 0) throw new Error("expected at least one finding for bad prompt");
  console.log(`  → ${findings.length} findings`);
});

await step("generate_examples", async () => {
  const r = await generateExamplesTool.handler({
    task: "classify a support ticket as billing/technical/account/other and return JSON",
    n: 3,
  });
  const examples = (r.structured as { examples?: unknown[] }).examples ?? [];
  if (examples.length === 0) throw new Error("expected at least one example");
  console.log(`  → ${examples.length} examples`);
});

await step("scaffold_prompt", async () => {
  const r = await scaffoldPromptTool.handler({
    task: "extract product attributes from a product detail page",
    output_format: "json",
  });
  const s = r.structured as { prompt_body?: string };
  if (!s.prompt_body || s.prompt_body.length < 50)
    throw new Error("expected non-trivial prompt_body");
  console.log(`  → prompt body ${s.prompt_body.length} chars`);
});

await step("improve_prompt", async () => {
  const r = await improvePromptTool.handler({ prompt: badPrompt });
  const s = r.structured as { after?: string };
  if (!s.after || s.after.length < 50)
    throw new Error("expected non-trivial improved prompt");
  console.log(`  → after ${s.after.length} chars`);
});

await step("build_eval", async () => {
  const r = await buildEvalTool.handler({
    prompt: "Classify a support ticket as billing/technical/account/other.",
    n_cases: 6,
  });
  const s = r.structured as { cases?: unknown[] };
  if (!s.cases || s.cases.length === 0) throw new Error("expected cases");
  console.log(`  → ${s.cases.length} cases`);
});

await step("design_chain", async () => {
  const r = await designChainTool.handler({
    task: "Take a long PDF, extract key claims, fact-check each claim, output a verified summary.",
    max_steps: 4,
  });
  const s = r.structured as { steps?: unknown[] };
  if (!s.steps || s.steps.length === 0) throw new Error("expected steps");
  console.log(`  → ${s.steps.length} steps`);
});

if (fails > 0) {
  console.error(`${fails} failures`);
  process.exit(1);
}
console.log("PASS phase-5");
