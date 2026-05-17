import { readManifestFile } from "./manifest.js";
import { getManifestRow, incrementUse, type Kb } from "./kb.js";

export interface ApplyResult {
  id: string;
  title: string;
  rendered: string;
  path: string;
}

/**
 * Materialize a stored manifest for use in a fresh Claude Code session.
 * The "rendered" string is meant to be injected as a prompt block.
 */
export function applyPrompt(kb: Kb, id: string): ApplyResult {
  const row = getManifestRow(kb, id);
  if (!row) throw new Error(`Manifest not found: ${id}`);
  const m = readManifestFile(row.path);
  incrementUse(kb, id);

  const rendered = [
    `# Reusing manifest: ${m.frontmatter.title}`,
    "",
    `**ID:** ${m.frontmatter.id}`,
    `**Type:** ${m.frontmatter.type}`,
    `**Repos:** ${m.frontmatter.repos.join(", ") || "_none_"}`,
    `**Skills:** ${m.frontmatter.linked_skills.join(", ") || "_none_"}`,
    "",
    "---",
    "",
    m.body.trim(),
  ].join("\n");

  return { id, title: m.frontmatter.title, rendered, path: m.path };
}
