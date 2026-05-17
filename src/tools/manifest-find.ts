import { z } from "zod";
import { openKb, closeKb, searchManifests } from "../manifests/kb.js";
import { ManifestTypeSchema } from "../manifests/types.js";

const inputSchema = {
  query: z.string(),
  type: ManifestTypeSchema.optional(),
  repo: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
};

type Input = {
  query: string;
  type?: z.infer<typeof ManifestTypeSchema>;
  repo?: string;
  limit?: number;
};

export const findManifestTool = {
  name: "pf_find_prompt",
  title: "Search prompt manifests",
  description:
    "Search the personal manifest KB ($PROMPTFORGE_HOME) by free-text query. Optional type/repo filters. Returns ranked hits with snippets. LIKE-based ranking — title and tag matches weigh higher than body matches.",
  inputSchema,
  handler: async (input: Input) => {
    const kb = openKb();
    try {
      const hits = searchManifests(kb, input.query, {
        type: input.type,
        repo: input.repo,
        limit: input.limit ?? 10,
      });
      const md = hits.length
        ? hits
            .map(
              (h) =>
                `- \`${h.id}\` (${h.type}, score ${h.score}) — ${h.title}\n  > ${h.snippet}`,
            )
            .join("\n")
        : "_No matches in the KB._";
      return { markdown: md, structured: { hits, count: hits.length } };
    } finally {
      closeKb(kb);
    }
  },
};
