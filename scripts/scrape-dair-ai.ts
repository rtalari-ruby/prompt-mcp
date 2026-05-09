// One-shot scraper for dair-ai/Prompt-Engineering-Guide.
// Clones (or reuses) /tmp/peg, walks pages/{techniques,applications,risks,agents}/*.en.mdx,
// strips Nextra/JSX imports, and emits kb/<category>/<slug>.md with our frontmatter.
//
// Run: npm run scrape:dair-ai
// Re-run quarterly. Pin /tmp/peg to a known-good commit if format drifts.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, "..");
const KB = resolve(REPO_ROOT, "kb");

const PEG_REPO = "https://github.com/dair-ai/Prompt-Engineering-Guide";
const PEG_PATH = "/tmp/peg";
const PEG_PIN = process.env.DAIR_AI_PIN || ""; // optional commit SHA

// dair-ai dir → our category. Anything outside this map is skipped.
const SECTIONS: Record<string, "techniques" | "applications" | "risks" | "techniques"> = {
  techniques: "techniques",
  applications: "applications",
  risks: "risks",
  agents: "techniques", // dair-ai puts agentic patterns under agents/
};

// dair-ai slug → our preferred id (where they differ).
const SLUG_MAP: Record<string, string> = {
  cot: "chain-of-thought",
  fewshot: "few-shot",
  zeroshot: "zero-shot",
  consistency: "self-consistency",
  knowledge: "generated-knowledge",
  tot: "tree-of-thoughts",
  ape: "automatic-prompt-engineer",
  art: "automatic-reasoning-and-tool-use",
  pal: "program-aided-language",
  dsp: "directional-stimulus-prompting",
  rag: "rag",
  react: "react",
  reflexion: "reflexion",
  graph: "graph-prompting",
  multimodalcot: "multimodal-cot",
  activeprompt: "active-prompt",
  prompt_chaining: "prompt-chaining",
  "meta-prompting": "meta-prompting",
};

function ensurePeg() {
  if (existsSync(PEG_PATH)) {
    process.stderr.write(`[dair-ai] reusing ${PEG_PATH}\n`);
    return;
  }
  process.stderr.write(`[dair-ai] cloning ${PEG_REPO} → ${PEG_PATH}\n`);
  execSync(`git clone --depth 1 ${PEG_REPO} ${PEG_PATH}`, { stdio: "inherit" });
  if (PEG_PIN) {
    execSync(`git -C ${PEG_PATH} checkout ${PEG_PIN}`, { stdio: "inherit" });
  }
}

function pegHeadSha(): string {
  try {
    return execSync(`git -C ${PEG_PATH} rev-parse HEAD`).toString().trim();
  } catch {
    return "unknown";
  }
}

function stripNextra(body: string): string {
  // Remove import statements (Nextra/JSX).
  return body
    .split("\n")
    .filter((line) => !/^import\s+.+from\s+['"].+['"]/.test(line.trim()))
    .filter(
      (line) =>
        !/<Screenshot\b/.test(line) &&
        !/<\/Screenshot>/.test(line) &&
        !/<Bleed\b/.test(line) &&
        !/<\/Bleed>/.test(line) &&
        !/<CoursePromo\b/.test(line) &&
        !/<\/?CoursesSection>/.test(line) &&
        !/<\/?CourseCard\b/.test(line) &&
        !/<Callout\b/.test(line) &&
        !/<\/Callout>/.test(line),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstHeading(body: string, fallback: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function slugify(name: string): string {
  return name
    .replace(/\.en\.mdx$/, "")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

type ScrapeResult = { slug: string; title: string; section: string; body: string; sourceUrl: string };

function scrapeSection(
  dairDir: string,
  category: "techniques" | "applications" | "risks",
  outDir: string,
  pegSha: string,
): ScrapeResult[] {
  const dirPath = resolve(PEG_PATH, "pages", dairDir);
  if (!existsSync(dirPath)) {
    process.stderr.write(`[dair-ai] skip missing ${dirPath}\n`);
    return [];
  }
  const out: ScrapeResult[] = [];
  for (const entry of readdirSync(dirPath)) {
    if (!entry.endsWith(".en.mdx")) continue;
    const rawSlug = slugify(entry);
    const id = SLUG_MAP[rawSlug] ?? rawSlug;
    const raw = readFileSync(resolve(dirPath, entry), "utf8");
    const body = stripNextra(raw);
    const title = firstHeading(body, id);
    const sourceUrl = `https://www.promptingguide.ai/${dairDir === "techniques" ? "techniques/" : dairDir === "risks" ? "risks/" : dairDir === "applications" ? "applications/" : "agents/"}${rawSlug}`;
    const md = renderKbFile({ id, title, category, sourceUrl, pegSha, body });
    const outPath = resolve(outDir, `${id}.md`);
    writeFileSync(outPath, md);
    out.push({ slug: id, title, section: dairDir, body, sourceUrl });
  }
  return out;
}

function renderKbFile(args: {
  id: string;
  title: string;
  category: "techniques" | "applications" | "risks";
  sourceUrl: string;
  pegSha: string;
  body: string;
}): string {
  const { id, title, category, sourceUrl, pegSha, body } = args;
  const fm = [
    "---",
    `id: ${id}`,
    `title: ${JSON.stringify(title)}`,
    `category: ${category}`,
    "tags: []",
    "sources:",
    `  - ${sourceUrl}`,
    "scraped_from: dair-ai/Prompt-Engineering-Guide",
    `scraped_sha: ${pegSha}`,
    "when_to_use: TODO (run scripts/enrich-kb.ts to fill)",
    "when_not_to_use: TODO",
    "claude_notes: TODO",
    "---",
    "",
  ].join("\n");
  return fm + body + "\n";
}

function main() {
  ensurePeg();
  const sha = pegHeadSha();
  for (const dir of ["techniques", "applications", "risks", "agents"]) {
    const cat =
      SECTIONS[dir as keyof typeof SECTIONS] ??
      ("techniques" as "techniques" | "applications" | "risks");
    const outDir = resolve(KB, cat);
    mkdirSync(outDir, { recursive: true });
    const results = scrapeSection(
      dir,
      cat as "techniques" | "applications" | "risks",
      outDir,
      sha,
    );
    process.stderr.write(`[dair-ai] ${dir} → kb/${cat}: ${results.length} files\n`);
  }
  process.stderr.write(`[dair-ai] done (sha=${sha})\n`);
}

main();
