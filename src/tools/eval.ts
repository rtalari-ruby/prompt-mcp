import { z } from "zod";
import { complete, llmAvailable, extractJson, LlmError, type SamplingExtra } from "../llm/client.js";

const inputSchema = {
  prompt: z.string().describe("The prompt to build an eval suite for."),
  n_cases: z.number().int().min(3).max(40).optional(),
  metric: z.enum(["exact_match", "rubric", "llm_judge"]).optional(),
};

type EvalCase = {
  id: string;
  kind: "happy" | "edge" | "adversarial" | "ambiguous";
  input: string;
  expected: string;
  notes?: string;
};

type Rubric = { criterion: string; pass_definition: string; weight: number };

type EvalSuite = {
  name: string;
  metric: "exact_match" | "rubric" | "llm_judge";
  cases: EvalCase[];
  rubric: Rubric[];
  judge_prompt?: string;
  notes: string;
};

const SYSTEM = `You are a senior eval designer. Given a prompt under test and a chosen
metric, produce an eval suite covering happy path, edge, adversarial,
and ambiguous inputs. Cases must be reproducible (same input → same
expected output) and the rubric must be concrete (no "good" / "well-written").

Distribution heuristic for n cases:
- 50% happy
- 25% edge
- 15% adversarial
- 10% ambiguous (testing the escape hatch)

Return strict JSON, no prose, no markdown fences. Schema:
{
  "name": "<short snake_case eval id>",
  "metric": "exact_match" | "rubric" | "llm_judge",
  "cases": [
    { "id": "case_01", "kind": "happy"|"edge"|"adversarial"|"ambiguous",
      "input": "...", "expected": "...", "notes": "<optional>" }
  ],
  "rubric": [
    { "criterion": "<one decision>", "pass_definition": "<concrete>", "weight": 1 }
  ],
  "judge_prompt": "<only if metric=llm_judge>",
  "notes": "<one paragraph: how to run, what to watch for>"
}`;

function buildUser(prompt: string, n: number, metric: string): string {
  return [
    `<prompt_under_test>`,
    prompt.trim(),
    `</prompt_under_test>`,
    "",
    `Generate ${n} cases. Metric: ${metric}.`,
  ].join("\n");
}

function renderSuite(s: EvalSuite): string {
  const lines: string[] = [];
  lines.push(`# Eval: ${s.name}`);
  lines.push("");
  lines.push(`**Metric:** ${s.metric}`);
  lines.push(`**Cases:** ${s.cases.length}`);
  lines.push("");
  lines.push(`## Cases`);
  lines.push("");
  for (const c of s.cases) {
    lines.push(`### ${c.id} — ${c.kind}`);
    lines.push(`- **Input:** ${c.input}`);
    lines.push(`- **Expected:** ${c.expected}`);
    if (c.notes) lines.push(`- **Notes:** ${c.notes}`);
    lines.push("");
  }
  if (s.rubric.length) {
    lines.push(`## Rubric`);
    lines.push("");
    for (const r of s.rubric) {
      lines.push(`- **${r.criterion}** (weight ${r.weight}): ${r.pass_definition}`);
    }
    lines.push("");
  }
  if (s.judge_prompt) {
    lines.push(`## Judge prompt`);
    lines.push("```");
    lines.push(s.judge_prompt);
    lines.push("```");
    lines.push("");
  }
  if (s.notes) {
    lines.push(`## Notes`);
    lines.push(s.notes);
    lines.push("");
  }
  lines.push(`## YAML (for runner)`);
  lines.push("```yaml");
  lines.push(`name: ${s.name}`);
  lines.push(`metric: ${s.metric}`);
  lines.push(`cases:`);
  for (const c of s.cases) {
    lines.push(`  - id: ${c.id}`);
    lines.push(`    kind: ${c.kind}`);
    lines.push(`    input: ${JSON.stringify(c.input)}`);
    lines.push(`    expected: ${JSON.stringify(c.expected)}`);
  }
  lines.push("```");
  return lines.join("\n");
}

export const buildEvalTool = {
  name: "build_eval",
  title: "Build an eval suite for a prompt",
  description:
    "Generate a 10–20 case eval set (rubric + cases YAML) for a prompt, covering happy path, edge, adversarial, and ambiguous inputs.",
  inputSchema,
  async handler(
    input: { prompt: string; n_cases?: number; metric?: "exact_match" | "rubric" | "llm_judge" },
    extra?: SamplingExtra,
  ) {
    const prompt = String(input.prompt ?? "").trim();
    if (!prompt) {
      return { markdown: "Pass a `prompt` string.", structured: {} };
    }
    const n = input.n_cases ?? 12;
    const metric = input.metric ?? "rubric";
    if (!llmAvailable(extra)) {
      return {
        markdown:
          "Cannot build eval: no sampling-capable host (Claude Code / Desktop) and no AZURE_OPENAI_* in `.env`.",
        structured: { error: "llm_not_available" },
      };
    }
    try {
      const out = await complete(SYSTEM, buildUser(prompt, n, metric), {
        maxTokens: 8192,
        cacheKey: `eval:${prompt}:${n}:${metric}`,
        extra,
      });
      const suite = extractJson<EvalSuite>(out);
      return { markdown: renderSuite(suite), structured: suite };
    } catch (err) {
      const msg = err instanceof LlmError ? err.message : String(err);
      return {
        markdown: `Failed to build eval: ${msg}`,
        structured: { error: msg },
      };
    }
  },
};
