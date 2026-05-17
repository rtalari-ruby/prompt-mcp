import { z } from "zod";
import { writeManifestFile } from "../manifests/manifest.js";
import { openKb, closeKb, upsertManifest } from "../manifests/kb.js";
import { scaffoldPrompt } from "../manifests/scaffold.js";

const inputSchema = {
  raw: z.string(),
  repos: z.array(z.string()).optional(),
  figma_urls: z.array(z.string()).optional(),
  design_urls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  write: z.boolean().default(true),
};

type Input = {
  raw: string;
  repos?: string[];
  figma_urls?: string[];
  design_urls?: string[];
  tags?: string[];
  write?: boolean;
};

export const scopeFeatureTool = {
  name: "pf_scope_feature",
  title: "Scope a feature (for atlas/Forge handoff)",
  description:
    "Like pf_create_prompt but always type=feature and includes a ## Forge Instruction section ready to copy into pipelineWorkflow. Sets forge.ready=false until the operator marks it true. Output is the canonical handoff packet atlas/Forge consumes.",
  inputSchema,
  handler: async (input: Input) => {
    const write = input.write ?? true;
    const kb = openKb();
    try {
      const result = scaffoldPrompt(
        {
          raw: input.raw,
          type: "feature",
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
      const md = [
        `**Scoped feature:** \`${fm.id}\``,
        `**Title:** ${fm.title}`,
        `**Repos:** ${fm.repos.join(", ") || "_none_"}`,
        `**Forge ready:** ${fm.forge.ready ? "yes" : "**no** — operator must flip frontmatter.forge.ready: true to hand off"}`,
        `**Path:** ${write ? result.manifest.path : "_dry run_"}`,
        "",
        "Once approved, the **Forge Instruction** section of the manifest is the prompt to paste into atlas's `pipelineWorkflow`.",
      ].join("\n");
      return {
        markdown: md,
        structured: {
          id: fm.id,
          title: fm.title,
          path: result.manifest.path,
          written: write,
          forge_ready: fm.forge.ready,
          similar: result.similar,
        },
      };
    } finally {
      closeKb(kb);
    }
  },
};
