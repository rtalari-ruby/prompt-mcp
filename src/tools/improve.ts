import { z } from "zod";
import { complete, llmConfigured, extractJson, LlmError } from "../llm/client.js";
import { critiquePromptTool, type Finding } from "./critique.js";

const FOCUS = ["clarity", "structure", "examples", "contract"] as const;

const inputSchema = {
  prompt: z.string().describe("The existing prompt to improve."),
  focus: z.array(z.enum(FOCUS)).optional(),
};

type Improvement = {
  before: string;
  after: string;
  changes_applied: string[];
  rationale: string;
};

const SYSTEM = `You are a senior prompt-engineering editor. Given a prompt and a list of
findings from the critique step, you produce an improved prompt that
applies Claude best practices: XML tags, concrete instructions, output
contract, multishot examples slot, escape hatch, reasoning structure.

Don't strip useful content — preserve the user's intent. Add structure
and discipline. Use {{vars}} where the original had implicit slots.

Return strict JSON, no prose, no markdown fences:
{
  "after": "<the rewritten prompt>",
  "changes_applied": ["<short kebab-case>", ...],
  "rationale": "<one paragraph: what you changed and why>"
}`;

function buildUser(prompt: string, findings: Finding[], focus?: readonly string[]): string {
  return [
    `<prompt_to_improve>`,
    prompt.trim(),
    `</prompt_to_improve>`,
    "",
    `<findings>`,
    findings.length === 0
      ? "(none)"
      : findings
          .map((f) => `- [${f.severity}] ${f.category}: ${f.finding}\n  fix: ${f.suggested_fix}`)
          .join("\n"),
    `</findings>`,
    "",
    focus && focus.length
      ? `<focus>${focus.join(", ")}</focus>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderImprovement(impr: Improvement): string {
  return [
    `# Improved prompt`,
    "",
    `## Changes applied`,
    impr.changes_applied.map((c) => `- ${c}`).join("\n") || "_(none)_",
    "",
    `## Rationale`,
    impr.rationale,
    "",
    `## Before`,
    "```",
    impr.before,
    "```",
    "",
    `## After`,
    "```",
    impr.after,
    "```",
  ].join("\n");
}

export const improvePromptTool = {
  name: "improve_prompt",
  title: "Improve an existing prompt",
  description:
    "Rewrite an existing prompt to apply Claude best practices: directness, XML structure, multishot examples, output contract, optional <thinking> wrapping.",
  inputSchema,
  async handler(input: { prompt: string; focus?: readonly string[] }) {
    const prompt = String(input.prompt ?? "").trim();
    if (!prompt) {
      return { markdown: "Pass a `prompt` string.", structured: {} };
    }
    // Always run critique first — even without LLM (static only).
    const critique = await critiquePromptTool.handler({ prompt });
    const findings: Finding[] = (critique.structured as { findings?: Finding[] })?.findings ?? [];

    if (!llmConfigured()) {
      return {
        markdown:
          `# Improvement (static lint only)\n\n` +
          `LLM not configured — cannot rewrite. Static findings:\n\n` +
          findings.map((f) => `- [${f.severity}] ${f.category}: ${f.finding}`).join("\n"),
        structured: { findings, error: "llm_not_configured" },
      };
    }

    try {
      const out = await complete(SYSTEM, buildUser(prompt, findings, input.focus), {
        maxTokens: 8192,
        cacheKey: `improve:${prompt}:${(input.focus ?? []).join(",")}`,
      });
      const parsed = extractJson<{ after: string; changes_applied: string[]; rationale: string }>(out);
      const impr: Improvement = {
        before: prompt,
        after: parsed.after,
        changes_applied: parsed.changes_applied ?? [],
        rationale: parsed.rationale ?? "",
      };
      return {
        markdown: renderImprovement(impr),
        structured: { ...impr, findings },
      };
    } catch (err) {
      const msg = err instanceof LlmError ? err.message : String(err);
      return {
        markdown: `Failed to improve: ${msg}`,
        structured: { findings, error: msg },
      };
    }
  },
};
