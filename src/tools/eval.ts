import { z } from "zod";

const inputSchema = {
  prompt: z.string().describe("The prompt to build an eval suite for."),
  n_cases: z
    .number()
    .int()
    .min(3)
    .max(40)
    .optional()
    .describe("Number of cases (default 12)."),
  metric: z
    .enum(["exact_match", "rubric", "llm_judge"])
    .optional()
    .describe("Scoring metric (default rubric)."),
};

export const buildEvalTool = {
  name: "build_eval",
  title: "Build an eval suite for a prompt",
  description:
    "Generate a 10–20 case eval set (rubric + cases YAML) for a prompt, covering happy path, edge, adversarial, and ambiguous inputs.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "build_eval: not yet implemented (stub).",
      structured: { stub: true, tool: "build_eval", cases: [] },
    };
  },
};
