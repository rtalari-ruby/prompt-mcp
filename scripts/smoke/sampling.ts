// Phase-7e smoke: verify the sampling path is taken when `extra` is supplied.
// Uses a fake sendRequest that captures the outbound sampling/createMessage
// request and returns a canned response. Proves:
//   1. The tool handler calls sendRequest with the right method.
//   2. The system prompt and user message are forwarded correctly.
//   3. The response text comes back through the cache layer to the tool.

import { loadEnv } from "../../src/llm/env.js";
loadEnv();

import { critiquePromptTool } from "../../src/tools/critique.js";
import { explainConceptTool } from "../../src/tools/explain.js";

let lastRequest: any = null;
const fakeExtra = {
  signal: { aborted: false } as AbortSignal,
  requestId: "smoke-1",
  sendRequest: async (req: any, _schema: any) => {
    lastRequest = req;
    if (req.method !== "sampling/createMessage") {
      throw new Error(`unexpected method: ${req.method}`);
    }
    // Echo a canned valid critique JSON so the tool can render.
    return {
      role: "assistant",
      content: {
        type: "text",
        text: JSON.stringify({
          findings: [
            {
              severity: "major",
              category: "test-from-sampling",
              finding: "this finding came from the synthetic sampling stub",
              suggested_fix: "if you can read this, the sampling path is wired",
            },
          ],
          summary: "synthetic sampling response",
        }),
      },
      model: "claude-test",
      stopReason: "endTurn",
    };
  },
};

// Cache-bust each run so the test exercises the live sampling path.
const cacheBuster = `Analyze this and improve it. [smoke-${Date.now()}]`;

// 1. Tool that uses LLM — should hit sampling.
const r = await critiquePromptTool.handler(
  { prompt: cacheBuster },
  fakeExtra as any,
);
if (!lastRequest) throw new Error("FAIL: sendRequest was never called");
if (lastRequest.method !== "sampling/createMessage")
  throw new Error("FAIL: wrong method");
const params = lastRequest.params;
if (!params.messages || !params.systemPrompt)
  throw new Error("FAIL: missing messages/systemPrompt in params");
const findings = (r.structured as any)?.findings ?? [];
const hasSampleFinding = findings.some(
  (f: any) => f.category === "test-from-sampling",
);
if (!hasSampleFinding) {
  console.error("FAIL: critique did not include the sampling-stub finding");
  console.error("got findings:", findings);
  process.exit(1);
}
console.log("ok critique used sampling path");
console.log("  sampling request method:", lastRequest.method);
console.log("  system prompt length:", params.systemPrompt.length);
console.log("  messages count:", params.messages.length);
console.log("  echoed finding category:", findings.find((f: any) => f.category === "test-from-sampling")?.category);

// 2. KB-only tool should NOT call sampling.
lastRequest = null;
const r2 = await explainConceptTool.handler(
  { concept: "chain-of-thought" },
  fakeExtra as any,
);
if (lastRequest !== null) {
  console.error("FAIL: KB-only tool unexpectedly called sampling");
  process.exit(1);
}
if (!r2.markdown.includes("Chain of Thought"))
  throw new Error("FAIL: explain_concept did not return the CoT card");
console.log("ok explain_concept stayed KB-only (no sampling call)");

console.log("PASS sampling smoke");
