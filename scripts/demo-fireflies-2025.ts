// Run scaffold → critique → improve → examples → eval → design_chain
// for the Fireflies 2025-call-analysis use case. Writes the assembled
// output to templates/fireflies-2025-call-analysis.md.

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "../src/llm/env.js";
loadEnv();

import { scaffoldPromptTool } from "../src/tools/scaffold.js";
import { critiquePromptTool } from "../src/tools/critique.js";
import { improvePromptTool } from "../src/tools/improve.js";
import { generateExamplesTool } from "../src/tools/examples.js";
import { buildEvalTool } from "../src/tools/eval.js";
import { designChainTool } from "../src/tools/chain.js";

const TASK =
  "Analyze a single Fireflies meeting transcript. First classify the call as one of: Sales | Customer | Internal | Other. If the classification is Sales or Customer, score the call across five dimensions (rapport_building, discovery_quality, next_step_clarity, objection_handling, listening_ratio) on a 1-5 scale with one-sentence evidence per dimension, then produce three concrete action items the rep can apply on future calls. If the classification is Internal or Other, return the classification with one-sentence reasoning and stop. Output is a single JSON object so it can feed into a team-rollup step.";

const CHAIN_TASK =
  "Build a workflow that uses the Fireflies MCP connector to fetch all meeting transcripts from 2025-01-01 through 2025-12-31, classifies each as Sales | Customer | Internal | Other, scores Sales and Customer calls across five quality dimensions with concrete per-call action items, and produces a team-rollup with the top systemic gaps and 5 prioritized team-wide action items. Each step has its own narrow contract.";

console.error("→ scaffold");
const scaffold = await scaffoldPromptTool.handler({
  task: TASK,
  inputs: ["transcript", "meeting_title", "meeting_date", "attendees"],
  output_format: "json",
  model_hint: "sonnet",
  techniques: ["xml-tags", "few-shot", "extended-thinking", "document-first-ordering"],
});
const scaffoldBody =
  (scaffold.structured as { prompt_body?: string }).prompt_body ?? "";

console.error("→ critique");
const critique = await critiquePromptTool.handler({ prompt: scaffoldBody });

console.error("→ improve");
const improve = await improvePromptTool.handler({ prompt: scaffoldBody });
const improvedPrompt =
  (improve.structured as { after?: string }).after ?? scaffoldBody;

console.error("→ generate_examples");
const examples = await generateExamplesTool.handler({
  task:
    "Classify a meeting transcript as Sales|Customer|Internal|Other; if Sales or Customer, score it on 5 dimensions and propose 3 action items. Return JSON.",
  n: 4,
  include_edge_case: true,
  include_negative: true,
});

console.error("→ build_eval");
const evalSuite = await buildEvalTool.handler({
  prompt: improvedPrompt,
  n_cases: 10,
  metric: "rubric",
});

console.error("→ design_chain");
const chain = await designChainTool.handler({
  task: CHAIN_TASK,
  max_steps: 6,
});

// Assemble.
const out = `# Fireflies 2025 call analysis — assembled output

> Built by running prompt-mcp's scaffold → critique → improve → examples → eval → design_chain against the task. Use the **improved prompt** (section 3) as the per-call analyzer, and the **chain** (section 6) as the orchestration plan.

---

## 1. Scaffolded prompt (initial draft from \`scaffold_prompt\`)

${scaffold.markdown}

---

## 2. Critique of the scaffold (from \`critique_prompt\`)

${critique.markdown}

---

## 3. Improved prompt (from \`improve_prompt\`) — **use this one**

${improve.markdown}

---

## 4. Multishot examples (from \`generate_examples\`) — paste into the prompt above

${examples.markdown}

---

## 5. Eval suite (from \`build_eval\`) — run this to validate

${evalSuite.markdown}

---

## 6. Orchestration chain (from \`design_chain\`) — the actual workflow

${chain.markdown}

---

## 7. How to run this in Claude Code

You have the Fireflies connector wired (\`claude.ai Fireflies\` shows ✓ Connected). Open a Claude Code session and say:

> "Use the Fireflies MCP to pull all transcripts from 2025-01-01 through 2025-12-31. For each, run the per-call analysis prompt from \`templates/fireflies-2025-call-analysis.md\` section 3. Classify, score the Sales/Customer ones, and produce per-call action items. Then aggregate across all scored calls into a team-rollup with top 5 prioritized action items."

Claude will:
1. Call \`fireflies_get_transcripts\` (or \`fireflies_search\`) with the date range.
2. For each transcript, call \`fireflies_get_transcript\` for the full text.
3. Run the per-call analysis prompt (the improved one in section 3) against each.
4. Collect JSON results, then run an aggregation prompt for the rollup.

Expected runtime depends on call count. For ~50 calls in 2025, plan for 10–20 minutes total against Sonnet.

If you want a fully autonomous run, copy section 6's chain into a routine via \`/anthropic-skills:schedule\` or as a saved prompt.
`;

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "..", "templates", "fireflies-2025-call-analysis.md");
writeFileSync(outPath, out);
console.error(`→ wrote ${outPath} (${out.length} chars)`);
