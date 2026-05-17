import {
  type Manifest,
  type ManifestFrontmatter,
  type ManifestType,
  type SearchHit,
} from "./types.js";
import { loadTemplate, renderTemplateBody } from "./templates.js";
import { manifestIdFor, manifestPathFor, todayIso } from "./manifest.js";
import { searchManifests, type Kb } from "./kb.js";

export interface ScaffoldArgs {
  raw: string;
  type?: ManifestType;
  title?: string;
  repos?: string[];
  tags?: string[];
  figmaUrls?: string[];
  designUrls?: string[];
  notes?: string;
  today?: string;
}

export interface ScaffoldResult {
  manifest: Manifest;
  similar: SearchHit[];
}

const BUG_RE = /\b(bug|fix|broken|error|crash|regression|hotfix|incident)\b/i;
const REVIEW_RE = /\b(review|pr |pull request|critique|audit)\b/i;
const FEATURE_RE = /\b(feature|add|build|ship|launch|new|introduce|implement)\b/i;

export function inferType(raw: string): ManifestType {
  if (BUG_RE.test(raw)) return "bug-fix";
  if (REVIEW_RE.test(raw)) return "review";
  if (FEATURE_RE.test(raw)) return "feature";
  return "coding";
}

export function deriveTitle(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").slice(0, 10);
  const joined = words.join(" ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function formatDesigns(figma: string[] = [], design: string[] = []): string {
  const lines: string[] = [];
  for (const f of figma) lines.push(`- Figma: ${f}`);
  for (const d of design) lines.push(`- Claude Design: ${d}`);
  return lines.length ? lines.join("\n") : "_None yet._";
}

export function scaffoldPrompt(args: ScaffoldArgs, kb?: Kb): ScaffoldResult {
  const type = args.type ?? inferType(args.raw);
  const title = args.title ?? deriveTitle(args.raw);
  const today = args.today ?? todayIso();
  const id = manifestIdFor(title, today);
  const repos = args.repos ?? [];
  const tags = args.tags ?? [];

  const template = loadTemplate(type);
  const body = renderTemplateBody(template, {
    title,
    raw: args.raw,
    repos_csv: repos.join(", ") || "_none_",
    designs: formatDesigns(args.figmaUrls, args.designUrls),
    notes: args.notes ?? "",
  });

  const frontmatter: ManifestFrontmatter = {
    id,
    title,
    type,
    status: "draft",
    created: today,
    updated: today,
    repos,
    tags,
    linked_manifests: [],
    linked_skills: template.defaultSkills,
    inputs: [],
    metrics: { use_count: 0, last_used: null, successes: 0, failures: 0 },
    forge: { ready: false, target_branch: "dev", prod_gate: "required" },
  };

  const manifest: Manifest = {
    frontmatter,
    body,
    path: manifestPathFor(id),
  };

  const similar = kb ? searchManifests(kb, args.raw, { limit: 5 }) : [];

  return { manifest, similar };
}
