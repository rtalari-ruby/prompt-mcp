// Optional KB enrichment pass. Reads every kb/**/*.md, finds files where
// when_to_use / when_not_to_use / claude_notes are still "TODO", and asks
// the LLM to fill them based on the file body. Writes results in place.
//
// Run: npm run enrich
// Cost: one LLM call per file. Cached on disk; re-runs are cheap.
//
// Skips files that already have non-TODO values.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { loadEnv } from "../src/llm/env.js";
import { complete, llmConfigured, extractJson } from "../src/llm/client.js";

loadEnv();

const here = dirname(fileURLToPath(import.meta.url));
const KB = resolve(here, "..", "kb");

type EnrichResponse = {
  when_to_use: string;
  when_not_to_use: string;
  claude_notes: string;
};

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) yield* walk(full);
    else if (entry.endsWith(".md")) yield full;
  }
}

function needsEnrich(fm: Record<string, unknown>): boolean {
  const v = (k: string) => String(fm[k] ?? "");
  return (
    v("when_to_use").startsWith("TODO") ||
    v("when_not_to_use").startsWith("TODO") ||
    v("claude_notes").startsWith("TODO")
  );
}

const SYSTEM = `You are a senior prompt-engineering editor. Given a Markdown body about
a prompting technique or concept, you produce three short fields:

- when_to_use: 1–3 sentences. Concrete, decision-oriented.
- when_not_to_use: 1–3 sentences. Calls out cases where the technique
  is overhead or harmful.
- claude_notes: 1–3 sentences. Any Claude-specific advice — XML tags,
  prefilling, extended thinking, document-first ordering — applicable
  to this technique. If none, say "No Claude-specific notes."

Return strict JSON, no prose, no fences:
{"when_to_use": "...", "when_not_to_use": "...", "claude_notes": "..."}`;

function buildUser(title: string, body: string): string {
  return `Title: ${title}\n\n---\n\n${body.slice(0, 8000)}`;
}

async function enrichOne(path: string): Promise<"skip" | "ok" | "fail"> {
  const raw = readFileSync(path, "utf8");
  const parsed = matter(raw);
  if (!needsEnrich(parsed.data)) return "skip";
  const title = String(parsed.data.title ?? parsed.data.id ?? path);
  try {
    const out = await complete(SYSTEM, buildUser(title, parsed.content), {
      maxTokens: 4096,
      cacheKey: `enrich:${path}`,
    });
    const json = extractJson<EnrichResponse>(out);
    parsed.data.when_to_use = json.when_to_use;
    parsed.data.when_not_to_use = json.when_not_to_use;
    parsed.data.claude_notes = json.claude_notes;
    writeFileSync(path, matter.stringify(parsed.content, parsed.data));
    return "ok";
  } catch (err) {
    process.stderr.write(`[enrich] FAIL ${path}: ${(err as Error).message}\n`);
    return "fail";
  }
}

async function main() {
  if (!llmConfigured()) {
    process.stderr.write(
      "[enrich] LLM not configured. Set AZURE_OPENAI_* in .env. Aborting.\n",
    );
    process.exit(1);
  }
  let ok = 0, skip = 0, fail = 0;
  for (const f of walk(KB)) {
    const r = await enrichOne(f);
    if (r === "ok") ok++;
    else if (r === "skip") skip++;
    else fail++;
    process.stderr.write(`[enrich] ${r} ${f.replace(KB + "/", "")}\n`);
  }
  process.stderr.write(`[enrich] done: ok=${ok} skip=${skip} fail=${fail}\n`);
  if (fail > 0) process.exit(1);
}

main();
