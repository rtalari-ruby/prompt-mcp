import { z } from "zod";
import { writeManifestFile } from "../manifests/manifest.js";
import { openKb, closeKb, upsertManifest } from "../manifests/kb.js";
import { scaffoldPrompt } from "../manifests/scaffold.js";
import { ManifestTypeSchema } from "../manifests/types.js";

const inputSchema = {
  raw: z.string().describe("Free-text description of the task or ask."),
  type: ManifestTypeSchema.optional().describe(
    "Override inferred type (coding | bug-fix | review | feature | other).",
  ),
  title: z.string().optional(),
  repos: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  figma_urls: z.array(z.string()).optional(),
  design_urls: z.array(z.string()).optional(),
  write: z.boolean().default(true).describe("If false, scaffold but do not store."),
};

type Input = {
  raw: string;
  type?: z.infer<typeof ManifestTypeSchema>;
  title?: string;
  repos?: string[];
  tags?: string[];
  figma_urls?: string[];
  design_urls?: string[];
  write?: boolean;
};

export const createManifestTool = {
  name: "pf_create_prompt",
  title: "Create or recall a prompt manifest",
  description:
    "Turn a free-text ask into a structured manifest scoped with karpathy-guidelines + superpowers references. Searches the personal KB for near-duplicates first. Writes to disk and indexes unless write=false. KB location: $PROMPTFORGE_HOME (default ~/.promptforge/kb).",
  inputSchema,
  handler: async (input: Input) => {
    const write = input.write ?? true;
    const kb = openKb();
    try {
      const result = scaffoldPrompt(
        {
          raw: input.raw,
          type: input.type,
          title: input.title,
          repos: input.repos ?? [],
          tags: input.tags ?? [],
          figmaUrls: input.figma_urls ?? [],
          designUrls: input.design_urls ?? [],
        },
        kb,
      );
      if (write) {
        writeManifestFile(result.manifest);
        upsertManifest(kb, result.manifest);
      }
      const fm = result.manifest.frontmatter;
      const lines = [
        `**Manifest:** \`${fm.id}\``,
        `**Title:** ${fm.title}`,
        `**Type:** ${fm.type}`,
        `**Repos:** ${fm.repos.join(", ") || "_none_"}`,
        `**Linked skills:** ${fm.linked_skills.join(", ")}`,
        `**Written:** ${write ? result.manifest.path : "_dry run_"}`,
      ];
      if (result.similar.length > 0) {
        lines.push("", "**Near-duplicates in KB (review before reusing):**");
        for (const s of result.similar.slice(0, 5)) {
          lines.push(`- \`${s.id}\` (score ${s.score}) — ${s.title}`);
        }
      }
      return {
        markdown: lines.join("\n"),
        structured: {
          id: fm.id,
          title: fm.title,
          type: fm.type,
          path: result.manifest.path,
          written: write,
          similar: result.similar,
        },
      };
    } finally {
      closeKb(kb);
    }
  },
};
