import { z } from "zod";

export const ManifestTypeSchema = z.enum(["coding", "bug-fix", "review", "feature", "other"]);
export type ManifestType = z.infer<typeof ManifestTypeSchema>;

/**
 * Manifest lifecycle. Linear-ish, with retries:
 *   draft  →  scoped  →  approved  →  in_flight  →  done | failed  →  archived
 *      ↑          ↓                                          ↓
 *      └──────────┘  (PM edits more before review)           └─→ scoped  (retry)
 *
 * `draft`     — being authored (default for any new manifest).
 * `scoped`    — PM submitted to engineering for review.
 * `approved`  — engineer validated; `forge.ready: true`; pipelineWorkflow may
 *               be triggered.
 * `in_flight` — atlas/Forge picked it up and is running.
 * `done`      — terminal success.
 * `failed`    — terminal failure attributable to the manifest (not a
 *               transient CI/deploy flake).
 * `archived`  — hidden from default views; kept for history.
 */
export const ManifestStatusSchema = z.enum([
  "draft",
  "scoped",
  "approved",
  "in_flight",
  "done",
  "failed",
  "archived",
]);
export type ManifestStatus = z.infer<typeof ManifestStatusSchema>;

export const ManifestInputSchema = z.object({
  name: z.string(),
  required: z.boolean().default(false),
  description: z.string().optional(),
});
export type ManifestInput = z.infer<typeof ManifestInputSchema>;

export const ManifestMetricsSchema = z.object({
  use_count: z.number().default(0),
  last_used: z.string().nullable().default(null),
  successes: z.number().default(0),
  failures: z.number().default(0),
});
export type ManifestMetrics = z.infer<typeof ManifestMetricsSchema>;

export const ManifestForgeSchema = z.object({
  ready: z.boolean().default(false),
  target_branch: z.string().default("dev"),
  prod_gate: z.enum(["required", "skip"]).default("required"),
});
export type ManifestForge = z.infer<typeof ManifestForgeSchema>;

export const ManifestFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: ManifestTypeSchema,
  status: ManifestStatusSchema.default("draft"),
  created: z.string(),
  updated: z.string(),
  repos: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  linked_manifests: z.array(z.string()).default([]),
  linked_skills: z.array(z.string()).default([]),
  inputs: z.array(ManifestInputSchema).default([]),
  metrics: ManifestMetricsSchema.default({
    use_count: 0,
    last_used: null,
    successes: 0,
    failures: 0,
  }),
  forge: ManifestForgeSchema.default({
    ready: false,
    target_branch: "dev",
    prod_gate: "required",
  }),
});
export type ManifestFrontmatter = z.infer<typeof ManifestFrontmatterSchema>;

export interface Manifest {
  frontmatter: ManifestFrontmatter;
  body: string;
  path: string;
}

export interface SearchHit {
  id: string;
  title: string;
  type: ManifestType;
  score: number;
  snippet: string;
  path: string;
}

export interface Template {
  type: ManifestType;
  title: string;
  body: string;
  defaultSkills: string[];
}
