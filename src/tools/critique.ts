import { z } from "zod";

const inputSchema = {
  prompt: z.string().describe("The prompt to critique."),
};

export const critiquePromptTool = {
  name: "critique_prompt",
  title: "Critique a prompt",
  description:
    "Review a prompt against a Claude-aware checklist of failure modes: vague instructions, missing examples or output contract, missing role, ambiguous pronouns, conflicting instructions.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "critique_prompt: not yet implemented (stub).",
      structured: { stub: true, tool: "critique_prompt", findings: [] },
    };
  },
};
