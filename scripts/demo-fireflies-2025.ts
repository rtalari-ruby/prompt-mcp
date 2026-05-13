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
  "Build a workflow that uses the Fireflies MCP connector (available in Claude Cowork) to fetch all meeting transcripts from 2025-01-01 through 2026-05-13, classifies each as Sales | Customer | Internal | Other, scores Sales and Customer calls across five quality dimensions with concrete per-call action items, and produces a team-rollup with the top systemic gaps and 5 prioritized team-wide action items. Note: assume the Fireflies MCP is already connected at the runtime — do not include API key fetching, OAuth, or credential setup steps. Each step has its own narrow contract.";

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

## 7. How to run this in Claude Cowork

The Fireflies MCP connector is already available in Claude Cowork (\`claude.ai Fireflies\` shows ✓ Connected). Open a Cowork session and say:

> "Use the Fireflies MCP to pull all meeting transcripts from 2025-01-01 through 2026-05-13. For each, run the per-call analysis prompt from \`templates/fireflies-call-analysis.md\` section 3. Classify, score the Sales/Customer ones, and produce per-call action items. Then aggregate across all scored calls into a team-rollup with the top 5 prioritized action items. Save the result as \`out/fireflies-2025-2026-report.md\`."

Claude will:
1. Call \`fireflies_get_transcripts\` (or \`fireflies_search\`) with the date range.
2. For each transcript, call \`fireflies_get_transcript\` for the full text.
3. Run the per-call analysis prompt (the improved one in section 3) against each.
4. Collect JSON results, then run an aggregation prompt for the rollup.

Expected runtime: plan ~15 seconds per call against Sonnet. ~100 calls is roughly 25 minutes. The chain's verify-and-package step (section 6, step 5) will tell you if any step came back malformed before you ship the final report.

If you want a fully autonomous run on a schedule (e.g. monthly), copy section 6's chain into a routine via \`/anthropic-skills:schedule\` or save the prompt as a Cowork project asset.
`;

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "..", "templates", "fireflies-call-analysis.md");
writeFileSync(outPath, out);
console.error(`→ wrote ${outPath} (${out.length} chars)`);
