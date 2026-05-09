import { z } from "zod";
import { complete, llmConfigured, extractJson, LlmError } from "../llm/client.js";

const inputSchema = {
  task: z.string().describe("Task description for which to generate examples."),
  n: z.number().int().min(1).max(10).optional(),
  include_edge_case: z.boolean().optional(),
  include_negative: z.boolean().optional(),
};

type Example = { input: string; output: string; kind?: "happy" | "edge" | "negative" };

const SYSTEM = `You are a senior prompt-engineering example author. Given a task,
you produce high-quality multishot examples for use with Claude.

Each example is a (input, output) pair. The output should be exactly what
you'd want Claude to produce — concise, format-correct, no preamble.

Always include at least one "edge" example (ambiguous, partial, or boundary
input) and at least one "negative" example (out-of-scope or unparseable input
where the right answer is to refuse / flag low confidence / return an
explicit "doesn't apply" form).

Return strict JSON, no prose, no markdown fences. Schema:
{
  "examples": [
    { "kind": "happy" | "edge" | "negative", "input": "...", "output": "..." }
  ]
}`;

function buildUser(task: string, n: number, includeEdge: boolean, includeNeg: boolean): string {
  return [
    `Task: ${task}`,
    "",
    `Generate ${n} examples.`,
    includeEdge ? "Include at least one edge case." : "",
    includeNeg ? "Include at least one negative / out-of-scope case." : "",
    "Pick the most representative happy-path example as #1.",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderExamples(examples: Example[]): string {
  const lines: string[] = ["# Generated examples", ""];
  lines.push("## Pasteable XML block");
  lines.push("");
  lines.push("```");
  lines.push("<examples>");
  for (const e of examples) {
    lines.push("<example>");
    lines.push(`  <input>${e.input}</input>`);
    lines.push(`  <output>${e.output}</output>`);
    lines.push("</example>");
  }
  lines.push("</examples>");
  lines.push("```");
  lines.push("");
  lines.push("## Per-example breakdown");
  lines.push("");
  examples.forEach((e, i) => {
    lines.push(`### ${i + 1}. ${e.kind ?? "happy"}`);
    lines.push(`**Input:** ${e.input}`);
    lines.push(`**Output:** ${e.output}`);
    lines.push("");
  });
  return lines.join("\n");
}

export const generateExamplesTool = {
  name: "generate_examples",
  title: "Generate multishot examples",
  description:
    "Generate 3–5 multishot examples for a given task, including edge cases and negative examples, formatted in XML.",
  inputSchema,
  async handler(input: {
    task: string;
    n?: number;
    include_edge_case?: boolean;
    include_negative?: boolean;
  }) {
    const task = String(input.task ?? "").trim();
    if (!task) {
      return { markdown: "Pass a `task` string.", structured: { examples: [] } };
    }
    const n = input.n ?? 4;
    const includeEdge = input.include_edge_case !== false;
    const includeNeg = input.include_negative !== false;

    if (!llmConfigured()) {
      return {
        markdown:
          "Cannot generate examples: LLM is not configured. Set AZURE_OPENAI_* in `.env`.",
        structured: { examples: [], error: "llm_not_configured" },
      };
    }
    try {
      const out = await complete(
        SYSTEM,
        buildUser(task, n, includeEdge, includeNeg),
        { maxTokens: 4096, cacheKey: `examples:${task}:${n}:${includeEdge}:${includeNeg}` },
      );
      const parsed = extractJson<{ examples: Example[] }>(out);
      const examples = parsed.examples ?? [];
      return {
        markdown: renderExamples(examples),
        structured: { examples },
      };
    } catch (err) {
      const msg = err instanceof LlmError ? err.message : String(err);
      return {
        markdown: `Failed to generate examples: ${msg}`,
        structured: { examples: [], error: msg },
      };
    }
  },
};
