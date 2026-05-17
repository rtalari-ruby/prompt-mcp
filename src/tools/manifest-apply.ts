import { z } from "zod";
import { openKb, closeKb } from "../manifests/kb.js";
import { applyPrompt } from "../manifests/apply.js";

const inputSchema = {
  id: z.string().describe("Manifest id (slugified ISO date + title)."),
};

type Input = { id: string };

export const applyManifestTool = {
  name: "pf_apply_prompt",
  title: "Apply a stored manifest",
  description:
    "Returns the rendered body of a stored manifest, ready to inject into the calling session as a prompt block. Increments use_count.",
  inputSchema,
  handler: async (input: Input) => {
    const kb = openKb();
    try {
      const r = applyPrompt(kb, input.id);
      return {
        markdown: r.rendered,
        structured: { id: r.id, title: r.title, path: r.path },
      };
    } finally {
      closeKb(kb);
    }
  },
};
