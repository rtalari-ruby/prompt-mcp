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

const inputSchema = {
  prompt: z.string().describe("The prompt to transform."),
  technique: z
    .enum(TECHNIQUES)
    .describe("Named technique to apply."),
  params: z
    .record(z.string(), z.any())
    .optional()
    .describe("Optional technique-specific parameters."),
};

export const applyTechniqueTool = {
  name: "apply_technique",
  title: "Apply a named prompting technique",
  description:
    "Apply a specific technique to a prompt: cot, few-shot, react, tot, self-consistency, prompt-chaining, rag, prefill, extended-thinking, xml-tags.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "apply_technique: not yet implemented (stub).",
      structured: { stub: true, tool: "apply_technique" },
    };
  },
};
