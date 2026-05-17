import matter from "gray-matter";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  ManifestFrontmatterSchema,
  type Manifest,
  type ManifestFrontmatter,
} from "./types.js";
import { manifestsDir } from "./paths.js";

export function slugifyTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function manifestIdFor(title: string, isoDate: string): string {
  return `${isoDate}-${slugifyTitle(title)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseManifest(raw: string, path: string): Manifest {
  const parsed = matter(raw);
  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    throw new Error(`Missing frontmatter in ${path}`);
  }
  const fm = ManifestFrontmatterSchema.parse(parsed.data);
  return { frontmatter: fm, body: parsed.content, path };
}

export function renderManifest(fm: ManifestFrontmatter, body: string): string {
  return matter.stringify(body, fm as unknown as Record<string, unknown>);
}

export function readManifestFile(path: string): Manifest {
  const raw = readFileSync(path, "utf8");
  return parseManifest(raw, path);
}

export function writeManifestFile(m: Manifest): string {
  const raw = renderManifest(m.frontmatter, m.body);
  writeFileSync(m.path, raw, "utf8");
  return m.path;
}

export function manifestPathFor(id: string): string {
  return join(manifestsDir(), `${id}.md`);
}

export function listManifestFiles(): string[] {
  return readdirSync(manifestsDir())
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(manifestsDir(), f));
}
