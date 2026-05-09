import { loadKb } from "./loader.js";
import type { KbCategory, KbDoc, KbSearchHit } from "./types.js";

let cached: KbDoc[] | null = null;

function ensureLoaded(): KbDoc[] {
  if (!cached) cached = loadKb();
  return cached;
}

/** Force reload (used by tests). */
export function reloadKb(): KbDoc[] {
  cached = loadKb();
  return cached;
}

export function allDocs(): KbDoc[] {
  return ensureLoaded();
}

export function lookup(id: string): KbDoc | undefined {
  const docs = ensureLoaded();
  const exact = docs.find((d) => d.id === id);
  if (exact) return exact;
  // fuzzy: case-insensitive id match, then alias by title
  const lower = id.toLowerCase().replace(/[\s_]/g, "-");
  return (
    docs.find((d) => d.id.toLowerCase() === lower) ??
    docs.find((d) => d.title.toLowerCase().includes(lower))
  );
}

export function byCategory(cat: KbCategory): KbDoc[] {
  return ensureLoaded().filter((d) => d.category === cat);
}

export function byTag(tag: string): KbDoc[] {
  const t = tag.toLowerCase();
  return ensureLoaded().filter((d) => d.tags.some((x) => x.toLowerCase() === t));
}

/**
 * Keyword search: scores by id/title/tag/body matches. Cheap and good enough
 * for ~100 docs. We can swap in embeddings later if precision drops.
 */
export function search(query: string, opts: { limit?: number; tags?: string[] } = {}): KbSearchHit[] {
  const docs = ensureLoaded();
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  const tagFilter = opts.tags?.map((t) => t.toLowerCase());

  const hits: KbSearchHit[] = [];
  for (const d of docs) {
    if (tagFilter && !tagFilter.every((t) => d.tags.map((x) => x.toLowerCase()).includes(t))) {
      continue;
    }
    let score = 0;
    if (d.id.toLowerCase() === q) score += 100;
    if (d.id.toLowerCase().includes(q)) score += 30;
    if (d.title.toLowerCase().includes(q)) score += 20;
    for (const t of tokens) {
      if (d.id.toLowerCase().includes(t)) score += 8;
      if (d.title.toLowerCase().includes(t)) score += 5;
      if (d.tags.some((x) => x.toLowerCase().includes(t))) score += 4;
      // body score: small per occurrence, capped
      const occ = countOccurrences(d.rawText, t);
      score += Math.min(occ, 5);
    }
    if (score > 0) hits.push({ doc: d, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, opts.limit ?? 10);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}
