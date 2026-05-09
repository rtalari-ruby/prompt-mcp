import { z } from "zod";

export const TECHNIQUES = [
  "cot",
  "few-shot",
  "react",
  "tot",
  "self-consistency",
  "prompt-chaining",
  "rag",
  "prefill",
  "extended-thinking",
  "xml-tags",
] as const;
type Technique = (typeof TECHNIQUES)[number];

const inputSchema = {
  prompt: z.string().describe("The prompt to transform."),
  technique: z.enum(TECHNIQUES).describe("Named technique to apply."),
  params: z
    .record(z.string(), z.any())
    .optional()
    .describe("Optional technique-specific parameters."),
};

type TransformResult = {
  before: string;
  after: string;
  technique: Technique;
  notes: string[];
};

function transformXmlTags(prompt: string): TransformResult {
  const trimmed = prompt.trim();
  const notes: string[] = [];
  // If the prompt already has XML tags, leave it alone.
  if (/<[a-z_][a-z0-9_-]*>/i.test(trimmed)) {
    notes.push("Prompt already contains XML tags. No-op.");
    return { before: prompt, after: prompt, technique: "xml-tags", notes };
  }
  // Heuristic: split on the first blank line to separate instructions from input.
  const parts = trimmed.split(/\n\s*\n/);
  let after: string;
  if (parts.length >= 2) {
    const [head, ...rest] = parts;
    after = `${head.trim()}\n\n<input>\n${rest.join("\n\n").trim()}\n</input>`;
    notes.push("Wrapped trailing block in <input>.");
  } else {
    after = `<task>\n${trimmed}\n</task>`;
    notes.push("Wrapped whole prompt in <task>.");
  }
  return { before: prompt, after, technique: "xml-tags", notes };
}

function transformCoT(prompt: string): TransformResult {
  const trimmed = prompt.trim();
  if (/<thinking>/i.test(trimmed)) {
    return {
      before: prompt,
      after: prompt,
      technique: "cot",
      notes: ["Prompt already contains <thinking>. No-op."],
    };
  }
  const after =
    `${trimmed}\n\n` +
    `Think through your reasoning step by step inside <thinking></thinking> tags. ` +
    `Then put your final answer inside <answer></answer> tags.`;
  return {
    before: prompt,
    after,
    technique: "cot",
    notes: [
      "Appended <thinking> + <answer> instruction.",
      "On Claude Opus 4.7 / Sonnet 4.6, prefer extended-thinking over hand-rolled CoT.",
    ],
  };
}

function transformExtendedThinking(prompt: string, params: Record<string, unknown>): TransformResult {
  const budget = Number(params.budget_tokens ?? 16000);
  const stripped = prompt.replace(/Think through.*<answer><\/answer>\s*tags\.\s*$/is, "").trim();
  const note = stripped !== prompt.trim() ? "Removed conflicting hand-rolled CoT instruction." : null;
  const apiConfig = `// API call config (Python):
client.messages.create(
    model="claude-opus-4-7",
    max_tokens=4096,
    thinking={"type": "enabled", "budget_tokens": ${budget}},
    messages=[{"role": "user", "content": <prompt>}],
)`;
  const after =
    `${stripped}\n\n` +
    `--- run with extended thinking ---\n${apiConfig}\n` +
    `--- end config ---`;
  return {
    before: prompt,
    after,
    technique: "extended-thinking",
    notes: [
      "Appended extended-thinking API config block.",
      `budget_tokens=${budget} (override with params.budget_tokens).`,
      ...(note ? [note] : []),
    ],
  };
}

function transformPrefill(prompt: string, params: Record<string, unknown>): TransformResult {
  const prefill = String(params.prefill ?? guessPrefill(prompt));
  const after =
    `${prompt.trim()}\n\n` +
    `--- usage ---\n` +
    `Send this prompt as a user turn, then send an assistant turn with content:\n` +
    `  ${JSON.stringify(prefill)}\n` +
    `Claude will continue from that prefix.`;
  return {
    before: prompt,
    after,
    technique: "prefill",
    notes: [
      `Prefill suggested: ${JSON.stringify(prefill)}`,
      "Trim trailing whitespace from the prefill — token alignment matters.",
    ],
  };
}

function guessPrefill(prompt: string): string {
  if (/return.*json|valid json|json.*only/i.test(prompt)) return "{";
  if (/<analysis>|return.*xml/i.test(prompt)) return "<analysis>";
  if (/list of|bulleted|bullets/i.test(prompt)) return "- ";
  return "{";
}

function transformReact(prompt: string): TransformResult {
  const after =
    `You can use tools to act and observe. For each step, produce:\n\n` +
    `Thought: <reasoning about what to do next>\n` +
    `Action: <tool name and input>\n` +
    `Observation: <the result>\n\n` +
    `Repeat until you can give a final answer:\n\n` +
    `Final Answer: <answer>\n\n` +
    `--- task ---\n${prompt.trim()}`;
  return {
    before: prompt,
    after,
    technique: "react",
    notes: [
      "Restructured as Thought / Action / Observation loop.",
      "On Claude, prefer native tool use (tool_use / tool_result blocks) over prompt-only ReAct.",
    ],
  };
}

function transformToT(prompt: string, params: Record<string, unknown>): TransformResult {
  const branches = Number(params.branches ?? 3);
  const depth = Number(params.depth ?? 3);
  const after =
    `${prompt.trim()}\n\n` +
    `Explore this as a tree of thoughts:\n` +
    `1. At each step, generate ${branches} candidate next-thoughts.\n` +
    `2. Evaluate each candidate (sure / maybe / impossible).\n` +
    `3. Expand the best 1–2 candidates to depth ${depth}.\n` +
    `4. Return the path to the best leaf.\n\n` +
    `Use <thoughts><candidate>...</candidate></thoughts> to lay out branches.`;
  return {
    before: prompt,
    after,
    technique: "tot",
    notes: [
      `Branches=${branches}, depth=${depth}.`,
      "ToT typically requires multi-call orchestration; this prompt structures one pass.",
    ],
  };
}

function transformSelfConsistency(prompt: string, params: Record<string, unknown>): TransformResult {
  const n = Number(params.n ?? 5);
  const after =
    `${prompt.trim()}\n\n` +
    `--- usage ---\n` +
    `Run this prompt ${n} times with temperature ~0.7. Take the majority\n` +
    `final answer (not the majority chain). For ties, prefer the most\n` +
    `consistent reasoning across samples.`;
  return {
    before: prompt,
    after,
    technique: "self-consistency",
    notes: [
      `n=${n} samples (override with params.n).`,
      "Each call is a separate API request — cost is N×.",
    ],
  };
}

function transformPromptChaining(prompt: string): TransformResult {
  const after =
    `${prompt.trim()}\n\n` +
    `--- chain ---\n` +
    `This task is a candidate for prompt chaining. Use the design_chain\n` +
    `tool to decompose it into N steps with explicit input/output contracts.\n`;
  return {
    before: prompt,
    after,
    technique: "prompt-chaining",
    notes: ["Wrapper. For the actual decomposition, call design_chain."],
  };
}

function transformRag(prompt: string): TransformResult {
  const after =
    `<documents>\n` +
    `<document index="1" source="{{source}}">\n` +
    `{{retrieved_chunk_1}}\n` +
    `</document>\n` +
    `<!-- additional <document> entries here -->\n` +
    `</documents>\n\n` +
    `${prompt.trim()}\n\n` +
    `Use only the content in <documents>. Cite each fact by document index.\n` +
    `If <documents> does not contain the answer, return:\n` +
    `  {"answer": null, "reason": "not in provided documents"}.`;
  return {
    before: prompt,
    after,
    technique: "rag",
    notes: [
      "Inserted document-first scaffold.",
      "Replace {{source}} and {{retrieved_chunk_1}} at runtime.",
      "Stable document prefix → enables prompt caching.",
    ],
  };
}

function transformFewShot(prompt: string, params: Record<string, unknown>): TransformResult {
  const examples = (params.examples as Array<{ input: string; output: string }> | undefined) ?? [];
  if (examples.length === 0) {
    const after =
      `<examples>\n` +
      `<example>\n  <input>{{x_1}}</input>\n  <output>{{y_1}}</output>\n</example>\n` +
      `<example>\n  <input>{{x_edge_case}}</input>\n  <output>{{y_edge_case}}</output>\n</example>\n` +
      `<example>\n  <input>{{x_negative}}</input>\n  <output>{{y_negative}}</output>\n</example>\n` +
      `</examples>\n\n` +
      `${prompt.trim()}`;
    return {
      before: prompt,
      after,
      technique: "few-shot",
      notes: [
        "Inserted empty examples scaffold (3 slots: representative, edge, negative).",
        "Use generate_examples to fill these from the task description.",
      ],
    };
  }
  const block = examples
    .map(
      (e) =>
        `<example>\n  <input>${e.input}</input>\n  <output>${e.output}</output>\n</example>`,
    )
    .join("\n");
  const after = `<examples>\n${block}\n</examples>\n\n${prompt.trim()}`;
  return {
    before: prompt,
    after,
    technique: "few-shot",
    notes: [`Inserted ${examples.length} examples.`],
  };
}

function applyOne(
  prompt: string,
  technique: Technique,
  params: Record<string, unknown>,
): TransformResult {
  switch (technique) {
    case "xml-tags":
      return transformXmlTags(prompt);
    case "cot":
      return transformCoT(prompt);
    case "extended-thinking":
      return transformExtendedThinking(prompt, params);
    case "prefill":
      return transformPrefill(prompt, params);
    case "react":
      return transformReact(prompt);
    case "tot":
      return transformToT(prompt, params);
    case "self-consistency":
      return transformSelfConsistency(prompt, params);
    case "prompt-chaining":
      return transformPromptChaining(prompt);
    case "rag":
      return transformRag(prompt);
    case "few-shot":
      return transformFewShot(prompt, params);
  }
}

function renderResult(r: TransformResult): string {
  return [
    `# apply_technique: \`${r.technique}\``,
    "",
    "## Notes",
    r.notes.map((n) => `- ${n}`).join("\n"),
    "",
    "## After",
    "```",
    r.after,
    "```",
  ].join("\n");
}

export const applyTechniqueTool = {
  name: "apply_technique",
  title: "Apply a named prompting technique",
  description:
    "Apply a specific technique to a prompt: cot, few-shot, react, tot, self-consistency, prompt-chaining, rag, prefill, extended-thinking, xml-tags.",
  inputSchema,
  async handler(input: { prompt: string; technique: Technique; params?: Record<string, unknown> }) {
    const result = applyOne(input.prompt ?? "", input.technique, input.params ?? {});
    return {
      markdown: renderResult(result),
      structured: {
        technique: result.technique,
        before: result.before,
        after: result.after,
        notes: result.notes,
      },
    };
  },
};
