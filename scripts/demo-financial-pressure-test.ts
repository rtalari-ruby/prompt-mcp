// Build a reusable "pressure-test the financial model + analyst feedback" prompt.
// scaffold → improve. Writes templates/financial-model-pressure-test.md.

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "../src/llm/env.js";
loadEnv();

import { scaffoldPromptTool } from "../src/tools/scaffold.js";
import { improvePromptTool } from "../src/tools/improve.js";

const TASK =
  "Generate a prompt that takes (1) a financial model summary or attached spreadsheet, (2) an analyst's written summary of feedback on that model (the analyst is named in {{analyst_name}}), and (3) the discussion threads behind the model, and produces an unbiased pressure-test of BOTH the model AND the analyst's feedback. The reviewer's role is a senior CFO and financial model auditor who does not rubber-stamp analysis. Output as markdown with these sections in order: (1) Verdict — PASS, CONDITIONAL_PASS, or FAIL with a one-sentence summary explaining the verdict. (2) Where the analyst is correct — bullets, each citing the specific model line or thread quote that supports the analyst. (3) Where the analyst is wrong, incomplete, or biased — bullets, each citing the specific claim being challenged and why. (4) Gaps in the model itself — assumptions not tested, sensitivities not run, scenarios absent, line items that look unjustified. (5) Pass/fail criteria — the explicit list of conditions that must hold for the verdict to be PASS, with which ones currently hold and which do not. (6) Concrete next actions ranked by priority — each with owner role (modeler, analyst, CFO), expected delta on the model, and effort estimate. The reviewer MUST be evidence-grounded: every finding cites the exact model line, thread quote, or analyst claim it's based on. No vague language. No false confidence. If any input is missing or unparseable, demand specific missing data instead of inventing analysis.";

console.error("→ scaffold");
const scaffold = await scaffoldPromptTool.handler({
  task: TASK,
  inputs: ["financial_model_summary", "analyst_name", "analyst_feedback", "discussion_threads"],
  output_format: "markdown",
  model_hint: "opus",
  techniques: ["xml-tags", "extended-thinking", "document-first-ordering", "few-shot"],
});

const scaffoldBody = (scaffold.structured as { prompt_body?: string }).prompt_body ?? "";

console.error("→ improve");
const improve = await improvePromptTool.handler({ prompt: scaffoldBody });
const improved = (improve.structured as { after?: string }).after ?? scaffoldBody;

const out = `# Financial-model + analyst-feedback pressure-test prompt

Reusable prompt for forcing a rigorous, unbiased final-pass review of a financial model AND the human analyst's summary of it. The reviewer is instructed to challenge the analyst, not just the modeler — useful when you suspect anchoring or confirmation bias.

**Built via** prompt-mcp \`scaffold_prompt → improve_prompt\`. Re-run \`scripts/demo-financial-pressure-test.ts\` if you want to regenerate.

---

## How to use

1. Open Claude Code or Claude Desktop in any session.
2. (Optional) Attach the model file directly — Claude reads .xlsx and .csv.
3. Paste the prompt below, replacing the four \`{{var}}\` placeholders:
   - \`{{financial_model_summary}}\` — paste a summary OR write "see attached file" if you dragged in the .xlsx.
   - \`{{analyst_name}}\` — the analyst whose feedback you're pressure-testing (e.g. "Pano").
   - \`{{analyst_feedback}}\` — paste the analyst's written summary of their findings verbatim.
   - \`{{discussion_threads}}\` — paste the Slack/email/comment threads that led to the model update.

The reviewer is told NOT to rubber-stamp the analyst. Every finding it produces must cite the specific model line, thread quote, or analyst claim it's challenging.

---

## The prompt

\`\`\`
${improved}
\`\`\`

---

## Output structure you'll see

1. **Verdict** — PASS / CONDITIONAL_PASS / FAIL with a one-sentence rationale.
2. **Where the analyst is correct** — bullets with cited evidence.
3. **Where the analyst is wrong, incomplete, or biased** — bullets with cited evidence.
4. **Gaps in the model itself** — assumptions, sensitivities, scenarios, unjustified line items.
5. **Pass/fail criteria** — the explicit conditions, which hold and which don't.
6. **Concrete next actions** — ranked, with owner role / expected delta / effort.

---

## Tips

- **Iterate cheaply:** if the verdict feels too lenient or too harsh, follow up with "Re-score with these additional facts: …" — the cache makes follow-ups instant.
- **Lock the verdict criteria:** if you want PASS to require specific things (e.g., "all base-case assumptions have a one-line justification + a sensitivity"), append those to \`{{analyst_feedback}}\` or as an extra constraint at the end of the prompt before sending.
- **Run it monthly:** once you trust the criteria, save the filled-in prompt as a Cowork project asset and schedule via \`/anthropic-skills:schedule monthly\`.

---

## Diff from initial scaffold (for the curious)

${improve.markdown}
`;

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "..", "templates", "financial-model-pressure-test.md");
writeFileSync(outPath, out);
console.error(`→ wrote ${outPath} (${out.length} chars)`);
