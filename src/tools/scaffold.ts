import { z } from "zod";

const inputSchema = {
  task: z.string().describe("One-line task description for the prompt to handle."),
  inputs: z
    .array(z.string())
    .optional()
    .describe("Named inputs the prompt should accept, e.g. ['page_text']."),
  output_format: z
    .enum(["json", "markdown", "xml", "text"])
    .optional()
    .describe("Required output format."),
  model_hint: z
    .enum(["opus", "sonnet", "haiku"])
    .optional()
    .describe("Model size hint."),
  techniques: z
    .array(z.string())
    .optional()
    .describe("Optional technique override list, e.g. ['few-shot', 'xml-tags']."),
};

export const scaffoldPromptTool = {
  name: "scaffold_prompt",
  title: "Scaffold a Claude-native prompt",
  description:
    "Generate a structured prompt from a one-line task description, applying Claude's best practices (XML tags, role, examples, output contract).",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "scaffold_prompt: not yet implemented (stub).",
      structured: { stub: true, tool: "scaffold_prompt" },
    };
  },
};
