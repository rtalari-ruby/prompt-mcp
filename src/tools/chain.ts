import { z } from "zod";

const inputSchema = {
  task: z.string().describe("Complex task to decompose into a prompt chain."),
  max_steps: z
    .number()
    .int()
    .min(2)
    .max(10)
    .optional()
    .describe("Maximum number of chain steps (default 5)."),
};

export const designChainTool = {
  name: "design_chain",
  title: "Design a prompt chain",
  description:
    "Decompose a complex task into a multi-step prompt chain, each step with input/output contracts and glue notes.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "design_chain: not yet implemented (stub).",
      structured: { stub: true, tool: "design_chain", steps: [] },
    };
  },
};
