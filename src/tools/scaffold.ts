import { z } from "zod";
import { complete, llmConfigured, extractJson, LlmError } from "../llm/client.js";

const inputSchema = {
  task: z.string().describe("One-line task description for the prompt to handle."),
  inputs: z.array(z.string()).optional(),
  output_format: z.enum(["json", "markdown", "xml", "text"]).optional(),
  model_hint: z.enum(["opus", "sonnet", "haiku"]).optional(),
  techniques: z.array(z.string()).optional(),
};

type Scaffold = {
  prompt_body: string;
  variables: string[];
  techniques_applied: string[];
  suggested_model: string;
  notes: string;
};

const SYSTEM = `You are a senior prompt-engineering scaffolder. Given a task description
and optional constraints, you produce a Claude-native prompt that follows
all best practices:

- Clear role in a system prompt block (when warranted).
- XML tags to delimit input, examples, task, output schema.
- Concrete instructions (no vague verbs).
- Output contract: schema + worked example + "Return ONLY ..." discipline.
- Escape hatch for ambiguous / off-topic / empty input.
- Multishot examples slot (3 placeholders: representative, edge, negative)
  unless examples are not warranted for this task.
- Reasoning structure (extended thinking note OR <thinking>+<answer>) for
  multi-step tasks.
- Document-first ordering for tasks with retrieved documents.
- Use {{var_name}} placeholders for any inputs the user must fill.

Heuristics:
- Extraction / classification → few-shot + JSON contract + escape hatch.
- Reasoning / planning → extended-thinking note (Opus 4.7 / Sonnet 4.6).
- Retrieval-grounded answer → document-first <documents> block with index attrs.
- Open writing → minimal structure, just role + brief.

Return strict JSON, no prose, no markdown fences. Schema:
{
  "prompt_body": "<the full prompt as a single string, with {{vars}}>",
  "variables": ["var1", "var2"],
  "techniques_applied": ["xml-tags", "few-shot", ...],
  "suggested_model": "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5",
  "notes": "<one short paragraph: what techniques you applied and why>"
}`;

function buildUser(input: {
  task: string;
  inputs?: string[];
  output_format?: string;
  model_hint?: string;
  techniques?: string[];
}): string {
  const lines: string[] = [];
  lines.push(`Task: ${input.task}`);
  if (input.inputs?.length) lines.push(`Inputs to surface as {{vars}}: ${input.inputs.join(", ")}`);
  if (input.output_format) lines.push(`Output format: ${input.output_format}`);
  if (input.model_hint) lines.push(`Model size hint: ${input.model_hint}`);
  if (input.techniques?.length)
    lines.push(`User-requested techniques (apply these): ${input.techniques.join(", ")}`);
  return lines.join("\n");
}

function renderScaffold(s: Scaffold, task: string): string {
  return [
    `# Scaffolded prompt`,
    "",
    `**Task:** ${task}`,
    `**Suggested model:** ${s.suggested_model}`,
    `**Techniques applied:** ${s.techniques_applied.join(", ")}`,
    "",
    `## Prompt`,
    "",
    "```",
    s.prompt_body,
    "```",
    "",
    `## Variables`,
    s.variables.length
      ? s.variables.map((v) => `- \`{{${v}}}\``).join("\n")
      : "_(none)_",
    "",
    `## Notes`,
    s.notes,
  ].join("\n");
}

export const scaffoldPromptTool = {
  name: "scaffold_prompt",
  title: "Scaffold a Claude-native prompt",
  description:
    "Generate a structured prompt from a one-line task description, applying Claude's best practices (XML tags, role, examples, output contract).",
  inputSchema,
  async handler(input: {
    task: string;
    inputs?: string[];
    output_format?: string;
    model_hint?: string;
    techniques?: string[];
  }) {
    const task = String(input.task ?? "").trim();
    if (!task) {
      return {
        markdown: "Pass a `task` string describing what the prompt should do.",
        structured: {},
      };
    }
    if (!llmConfigured()) {
      return {
        markdown:
          "Cannot scaffold: LLM is not configured. Set AZURE_OPENAI_* in `.env`.",
        structured: { error: "llm_not_configured" },
      };
    }
    try {
      const out = await complete(SYSTEM, buildUser(input), {
        maxTokens: 8192,
        cacheKey: `scaffold:${JSON.stringify(input)}`,
      });
      const s = extractJson<Scaffold>(out);
      return {
        markdown: renderScaffold(s, task),
        structured: s,
      };
    } catch (err) {
      const msg = err instanceof LlmError ? err.message : String(err);
      return {
        markdown: `Failed to scaffold: ${msg}`,
        structured: { error: msg },
      };
    }
  },
};
