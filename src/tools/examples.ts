import { z } from "zod";

const inputSchema = {
  task: z.string().describe("Task description for which to generate examples."),
  n: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Number of examples (default 4)."),
  include_edge_case: z
    .boolean()
    .optional()
    .describe("Include at least one edge-case example (default true)."),
  include_negative: z
    .boolean()
    .optional()
    .describe("Include at least one negative example (default true)."),
};

export const generateExamplesTool = {
  name: "generate_examples",
  title: "Generate multishot examples",
  description:
    "Generate 3–5 multishot examples for a given task, including edge cases and negative examples, formatted in XML.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "generate_examples: not yet implemented (stub).",
      structured: { stub: true, tool: "generate_examples", examples: [] },
    };
  },
};
