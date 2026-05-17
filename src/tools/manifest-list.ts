import { z } from "zod";
import { openKb, closeKb, listManifests } from "../manifests/kb.js";
import { ManifestTypeSchema } from "../manifests/types.js";

const inputSchema = {
  type: ManifestTypeSchema.optional(),
  repo: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
};

type Input = {
  type?: z.infer<typeof ManifestTypeSchema>;
  repo?: string;
  limit?: number;
};

export const listManifestsTool = {
  name: "pf_list_prompts",
  title: "List prompt manifests",
  description:
    "Browse the personal manifest KB. Sorted by last update. Optional type/repo filters.",
  inputSchema,
  handler: async (input: Input) => {
    const kb = openKb();
    try {
      const rows = listManifests(kb, {
        type: input.type,
        repo: input.repo,
        limit: input.limit ?? 50,
      });
      const md = rows.length
        ? rows
            .map(
              (r) =>
                `- \`${r.id}\` (${r.type}, status ${r.status}, used ${r.use_count}x) — ${r.title}`,
            )
            .join("\n")
        : "_KB empty._";
      return {
        markdown: md,
        structured: {
          manifests: rows.map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            status: r.status,
            updated: r.updated,
            use_count: r.use_count,
            path: r.path,
          })),
          count: rows.length,
        },
      };
    } finally {
      closeKb(kb);
    }
  },
};
