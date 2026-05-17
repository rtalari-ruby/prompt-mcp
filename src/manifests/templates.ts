import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { templatesDir } from "./paths.js";
import { ManifestTypeSchema, type ManifestType, type Template } from "./types.js";

const TEMPLATE_FILES: Record<ManifestType, string> = {
  coding: "coding.md",
  "bug-fix": "bug-fix.md",
  review: "review.md",
  feature: "feature.md",
  other: "coding.md",
};

export function loadTemplate(type: ManifestType): Template {
  const file = join(templatesDir(), TEMPLATE_FILES[type]);
  if (!existsSync(file)) {
    throw new Error(`Template not found for type "${type}" at ${file}`);
  }
  const raw = readFileSync(file, "utf8");
  const parsed = matter(raw);
  const data = parsed.data as { type?: string; default_skills?: string[] };
  if (data.type) ManifestTypeSchema.parse(data.type);
  return {
    type,
    title: "{{title}}",
    body: parsed.content,
    defaultSkills: Array.isArray(data.default_skills) ? data.default_skills : [],
  };
}

export function renderTemplateBody(
  template: Template,
  vars: Record<string, string>,
): string {
  return template.body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return vars[key] ?? "";
  });
}
