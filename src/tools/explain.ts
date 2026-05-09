import { z } from "zod";

const inputSchema = {
  concept: z
    .string()
    .describe(
      "Concept id or fuzzy name, e.g. 'extended-thinking', 'react', 'xml-tags'.",
    ),
};

export const explainConceptTool = {
  name: "explain_concept",
  title: "Explain a prompting concept",
  description:
    "Look up a technique or concept in the prompt-engineering KB and return a concise reference card: TL;DR, when to use, when not to use, Claude notes, pattern, example, related concepts.",
  inputSchema,
  async handler(_input: any) {
    return {
      markdown: "explain_concept: not yet implemented (stub).",
      structured: { stub: true, tool: "explain_concept" },
    };
  },
};
