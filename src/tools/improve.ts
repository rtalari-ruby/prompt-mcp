import { z } from "zod";

const inputSchema = {
  prompt: z.string().describe("The existing prompt to improve."),
  focus: z
    .array(z.enum(["clarity", "structure", "examples", "contract"]))
    .optional()
    .describe("Aspects to focus the rewrite on."),
};

export const improvePromptTool = {
  name: "improve_prompt",
  title: "Improve an existing prompt",
  description:
    "Rewrite an existing prompt to apply Claude best practices: directness, XML structure, multishot examples, output contract, optional <thinking> wrapping.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "improve_prompt: not yet implemented (stub).",
      structured: { stub: true, tool: "improve_prompt" },
    };
  },
};
