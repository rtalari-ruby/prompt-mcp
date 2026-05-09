import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { KbCategory, KbDoc } from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));

function defaultKbRoot(): string {
  // dist/kb/loader.js → ../../kb ; src/kb/loader.ts → ../../kb
  const env = process.env.PROMPT_MCP_KB_PATH;
  if (env) return resolve(env);
  return resolve(here, "..", "..", "kb");
}

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e);
    const s = statSync(full);
    if (s.isDirectory()) yield* walk(full);
    else if (e.endsWith(".md")) yield full;
  }
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

function normCategory(raw: string): KbCategory {
  switch (raw) {
    case "techniques":
    case "technique":
      return "technique";
    case "claude-specific":
      return "claude-specific";
    case "failure-mode":
    case "failure-modes":
      return "failure-mode";
    case "checklist":
    case "checklists":
      return "checklist";
    case "applications":
      return "applications";
    case "risks":
      return "risks";
    default:
      return "technique";
  }
}

export function loadKb(rootOverride?: string): KbDoc[] {
  const root = rootOverride ?? defaultKbRoot();
  const docs: KbDoc[] = [];
  for (const file of walk(root)) {
    let raw: string;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    let parsed: ReturnType<typeof matter>;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }
    const fm = parsed.data as Record<string, unknown>;
    const id = String(fm.id ?? "").trim();
    if (!id) continue;
    const doc: KbDoc = {
      id,
      title: String(fm.title ?? id),
      category: normCategory(String(fm.category ?? "")),
      tags: asArray(fm.tags),
      sources: asArray(fm.sources),
      whenToUse: String(fm.when_to_use ?? "").trim(),
      whenNotToUse: String(fm.when_not_to_use ?? "").trim(),
      claudeNotes: String(fm.claude_notes ?? "").trim(),
      related: asArray(fm.related),
      body: parsed.content.trim(),
      rawText: parsed.content.toLowerCase(),
      path: file,
    };
    docs.push(doc);
  }
  return docs;
}
