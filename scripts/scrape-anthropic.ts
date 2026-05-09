// One-shot scraper for Anthropic prompt-engineering docs.
// docs.claude.com serves clean markdown when you append `.md` to a doc path.
// The historical per-topic URLs (use-xml-tags, multishot-prompting, etc.) all
// now redirect to a unified "claude-prompting-best-practices" master doc.
// We:
//   - Fetch the canonical master doc as the single big file.
//   - Fetch the still-distinct overview and prefill docs.
//   - Fetch the engineering blog "effective context engineering" essay (HTML → text).
//   - Validate content-type and skip anything that returns HTML for the .md path.
//
// Run: npm run scrape:anthropic
// Re-run quarterly. Update DOCS / ESSAYS if Anthropic restructures.

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { load as loadHtml } from "cheerio";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, "..");
const KB = resolve(REPO_ROOT, "kb");
const OUT_DIR = resolve(KB, "claude-specific");

type MdDoc = { id: string; title: string; url: string };
type EssayDoc = { id: string; title: string; url: string; selector: string };

const DOCS: MdDoc[] = [
  {
    id: "claude-prompting-best-practices",
    title: "Claude prompting best practices (master doc)",
    url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices",
  },
  {
    id: "overview",
    title: "Prompt engineering overview",
    url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview",
  },
  // Note: per-topic URLs (use-xml-tags, multishot-prompting, prefill-claudes-response,
  // chain-of-thought, system-prompts, etc.) all redirect to the consolidated
  // claude-prompting-best-practices doc above. Hand-written reference cards live
  // in kb/claude-specific/ and cite that master doc.
];

const ESSAYS: EssayDoc[] = [
  {
    id: "context-engineering-for-agents",
    title: "Effective context engineering for AI agents",
    url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    selector: "article",
  },
];

async function fetchMarkdown(doc: MdDoc): Promise<string> {
  const mdUrl = `${doc.url}.md`;
  const res = await fetch(mdUrl, {
    redirect: "follow",
    headers: { "User-Agent": "prompt-mcp-scraper/0.1" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("markdown")) {
    throw new Error(`unexpected content-type: ${ct}`);
  }
  return await res.text();
}

async function fetchEssay(doc: EssayDoc): Promise<string> {
  const res = await fetch(doc.url, {
    redirect: "follow",
    headers: { "User-Agent": "prompt-mcp-scraper/0.1" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = loadHtml(html);
  // Strip script/style/nav/footer noise.
  $("script, style, nav, footer, header, aside").remove();
  const main =
    $(doc.selector).first().text() ||
    $("main").first().text() ||
    $("body").text();
  return main.replace(/\n{3,}/g, "\n\n").trim();
}

function render(args: { id: string; title: string; url: string; body: string; kind: "doc" | "essay" }): string {
  const fm = [
    "---",
    `id: ${args.id}`,
    `title: ${JSON.stringify(args.title)}`,
    "category: claude-specific",
    "tags: []",
    "sources:",
    `  - ${args.url}`,
    `scraped_from: ${args.kind === "doc" ? "docs.claude.com" : "anthropic.com/engineering"}`,
    "when_to_use: TODO (run scripts/enrich-kb.ts to fill)",
    "when_not_to_use: TODO",
    "claude_notes: TODO",
    "---",
    "",
  ].join("\n");
  return fm + args.body.trim() + "\n";
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  let okCount = 0;
  let failCount = 0;

  for (const doc of DOCS) {
    try {
      const body = await fetchMarkdown(doc);
      writeFileSync(
        resolve(OUT_DIR, `${doc.id}.md`),
        render({ id: doc.id, title: doc.title, url: doc.url, body, kind: "doc" }),
      );
      process.stderr.write(`[anthropic] ok ${doc.id} (${body.length}B)\n`);
      okCount++;
    } catch (err) {
      process.stderr.write(`[anthropic] FAIL ${doc.id}: ${(err as Error).message}\n`);
      failCount++;
    }
  }

  for (const essay of ESSAYS) {
    try {
      const body = await fetchEssay(essay);
      if (body.length < 500) throw new Error(`body too short (${body.length}B)`);
      writeFileSync(
        resolve(OUT_DIR, `${essay.id}.md`),
        render({ id: essay.id, title: essay.title, url: essay.url, body, kind: "essay" }),
      );
      process.stderr.write(`[anthropic] ok ${essay.id} (${body.length}B)\n`);
      okCount++;
    } catch (err) {
      process.stderr.write(`[anthropic] FAIL ${essay.id}: ${(err as Error).message}\n`);
      failCount++;
    }
  }

  process.stderr.write(`[anthropic] done: ${okCount} ok, ${failCount} fail\n`);
  if (failCount > 0) process.exit(1);
}

main();
