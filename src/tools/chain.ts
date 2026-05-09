import { z } from "zod";
import { complete, llmConfigured, extractJson, LlmError } from "../llm/client.js";

const inputSchema = {
  task: z.string().describe("Complex task to decompose into a prompt chain."),
  max_steps: z.number().int().min(2).max(10).optional(),
};

type ChainStep = {
  index: number;
  name: string;
  role: string;
  prompt: string;
  inputs: string[];
  output_contract: string;
  validator: string;
  glue_to_next: string;
};

type ChainPlan = {
  task: string;
  steps: ChainStep[];
  notes: string;
};

const SYSTEM = `You are a senior prompt-engineering chain designer. Given a complex task,
you decompose it into a sequence of prompts where each step has:

- A specific role (one specialty per step).
- A narrow prompt with clear inputs.
- A typed output contract (JSON schema or precise format).
- A validator step (what to check before passing output forward).
- Glue notes for how this step's output feeds the next.

Prefer 3–5 steps. Each step should do ONE thing well. The last step
typically formats / verifies / decides.

Return strict JSON, no prose, no markdown fences. Schema:
{
  "task": "<the original task>",
  "steps": [
    {
      "index": 1,
      "name": "<short kebab-case>",
      "role": "<system role>",
      "prompt": "<full prompt body, with {{vars}}>",
      "inputs": ["{{var}}", ...],
      "output_contract": "<schema or shape>",
      "validator": "<what to check>",
      "glue_to_next": "<how output feeds next step>"
    }
  ],
  "notes": "<one paragraph: orchestration tips, caching opportunities, error handling>"
}`;

function buildUser(task: string, maxSteps: number): string {
  return [
    `Task: ${task}`,
    "",
    `Maximum steps: ${maxSteps}.`,
    "Decompose into the smallest sensible chain.",
  ].join("\n");
}

function renderMermaid(plan: ChainPlan): string {
  const nodes = plan.steps.map(
    (s) => `  S${s.index}["${s.index}. ${s.name}<br/>(${s.role})"]`,
  );
  const edges = plan.steps
    .slice(0, -1)
    .map((s, i) => `  S${s.index} --> S${plan.steps[i + 1].index}`);
  return `\`\`\`mermaid\nflowchart LR\n${nodes.join("\n")}\n${edges.join("\n")}\n\`\`\``;
}

function renderPlan(plan: ChainPlan): string {
  const lines: string[] = [];
  lines.push(`# Prompt chain: ${plan.task}`);
  lines.push("");
  lines.push(`**Steps:** ${plan.steps.length}`);
  lines.push("");
  lines.push(renderMermaid(plan));
  lines.push("");
  for (const s of plan.steps) {
    lines.push(`## Step ${s.index}: ${s.name}`);
    lines.push(`**Role:** ${s.role}`);
    lines.push(`**Inputs:** ${s.inputs.join(", ") || "_(none)_"}`);
    lines.push("");
    lines.push("**Prompt:**");
    lines.push("```");
    lines.push(s.prompt);
    lines.push("```");
    lines.push(`**Output contract:** ${s.output_contract}`);
    lines.push(`**Validator:** ${s.validator}`);
    if (s.glue_to_next) lines.push(`**Glue to next:** ${s.glue_to_next}`);
    lines.push("");
  }
  if (plan.notes) {
    lines.push(`## Orchestration notes`);
    lines.push(plan.notes);
  }
  return lines.join("\n");
}

export const designChainTool = {
  name: "design_chain",
  title: "Design a prompt chain",
  description:
    "Decompose a complex task into a multi-step prompt chain, each step with input/output contracts and glue notes.",
  inputSchema,
  async handler(input: { task: string; max_steps?: number }) {
    const task = String(input.task ?? "").trim();
    if (!task) return { markdown: "Pass a `task` string.", structured: {} };
    if (!llmConfigured()) {
      return {
        markdown:
          "Cannot design chain: LLM is not configured. Set AZURE_OPENAI_* in `.env`.",
        structured: { error: "llm_not_configured" },
      };
    }
    const maxSteps = input.max_steps ?? 5;
    try {
      const out = await complete(SYSTEM, buildUser(task, maxSteps), {
        maxTokens: 12000,
        cacheKey: `chain:${task}:${maxSteps}`,
      });
      const plan = extractJson<ChainPlan>(out);
      return { markdown: renderPlan(plan), structured: plan };
    } catch (err) {
      const msg = err instanceof LlmError ? err.message : String(err);
      return {
        markdown: `Failed to design chain: ${msg}`,
        structured: { error: msg },
      };
    }
  },
};
