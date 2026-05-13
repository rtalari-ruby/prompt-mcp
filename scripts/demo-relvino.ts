// One-off demo: scaffold a reusable Relvino investor-intro 1-pager prompt.
import { loadEnv } from "../src/llm/env.js";
loadEnv();
import { scaffoldPromptTool } from "../src/tools/scaffold.js";

const r = await scaffoldPromptTool.handler({
  task:
    "Generate a polished one-page customer-intro brief for Relvino (the intelligence layer for human-agent commerce, replacing legacy marketing stacks with autonomous AI agents) that an investor will forward to companies in their network. Synthesize from attached materials (deck, website copy, FAQ, customer notes). Output is a single-page markdown brief with: 1) hook (one sentence), 2) problem we solve, 3) Relvino in one paragraph, 4) ICP (who this is most relevant for + 3-5 disqualifiers), 5) proof points (logos, metrics, quotes — only what's actually in the materials, no fabrication), 6) what we want from this intro (one specific ask), 7) two-line contact + next step. Fit on one printed page. Investor's voice is warm/peer-to-peer, not pitch-y.",
  inputs: ["materials", "investor_name", "investor_relationship", "current_traction_facts"],
  output_format: "markdown",
  model_hint: "sonnet",
  techniques: ["xml-tags", "few-shot", "extended-thinking", "document-first-ordering"],
});
console.log(r.markdown);
