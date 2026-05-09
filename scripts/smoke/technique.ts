// Phase-4 smoke: apply_technique transforms.
import { applyTechniqueTool } from "../../src/tools/technique.js";

const cases: Array<{ prompt: string; technique: any; expectInAfter: string }> = [
  { prompt: "Translate this to French:\n\nHello world.", technique: "xml-tags", expectInAfter: "<input>" },
  { prompt: "Solve: 23 + 19", technique: "cot", expectInAfter: "<thinking>" },
  { prompt: "Solve a hard problem", technique: "extended-thinking", expectInAfter: "budget_tokens" },
  { prompt: "Return JSON only.", technique: "prefill", expectInAfter: '"{"' },
  { prompt: "Find the lowest price", technique: "react", expectInAfter: "Thought:" },
  { prompt: "Plan a trip", technique: "tot", expectInAfter: "tree of thoughts" },
  { prompt: "Solve a math problem", technique: "self-consistency", expectInAfter: "majority" },
  { prompt: "Multi-step pipeline", technique: "prompt-chaining", expectInAfter: "design_chain" },
  { prompt: "Answer using docs", technique: "rag", expectInAfter: "<documents>" },
  { prompt: "Classify the ticket", technique: "few-shot", expectInAfter: "<examples>" },
];

let fails = 0;
for (const c of cases) {
  const r = await applyTechniqueTool.handler({ prompt: c.prompt, technique: c.technique });
  const ok = r.markdown.includes(c.expectInAfter);
  console.log(`${ok ? "ok" : "FAIL"} ${c.technique}: expect "${c.expectInAfter}"`);
  if (!ok) {
    console.log("  --- markdown ---");
    console.log(r.markdown);
    console.log("  --- end ---");
    fails++;
  }
}
if (fails > 0) {
  console.error(`${fails} failures`);
  process.exit(1);
}
console.log("PASS phase-4");
