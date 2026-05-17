import type { ManifestType, SearchHit } from "./types.js";
import {
  searchManifests as kbSearchManifests,
  type Kb,
  type SearchOptions,
} from "./kb.js";

/**
 * Pluggable search backend. Today we ship `LikeRanker` (BM25-ish over a
 * lower-cased concatenation column with title/tag weights). Tomorrow,
 * when search recall starts to hurt, swap in `HybridRanker(LikeRanker,
 * VectorRanker)` — same interface, no caller changes.
 *
 * The path documented in `promptforge/STRATEGY.md` (the embeddings
 * section) is: add a `vectors` table or libsql `F32_BLOB` column next to
 * `manifests`, embed at write-time (text-embedding-3-small or voyage-3),
 * and compose this `Searcher` over BM25 + cosine via reciprocal-rank
 * fusion. The whole point of this interface is that nothing above the
 * search layer has to know which backend is live.
 */
export interface Searcher {
  /** Human-readable id surfaced in healthchecks and logs. */
  readonly name: string;

  /** Score and rank manifests for a free-text query. */
  search(kb: Kb, query: string, opts?: SearchOptions): Promise<SearchHit[]>;
}

/** Default backend. LIKE-based ranking over the existing index column. */
export class LikeRanker implements Searcher {
  readonly name = "like";

  async search(kb: Kb, query: string, opts?: SearchOptions): Promise<SearchHit[]> {
    return kbSearchManifests(kb, query, opts ?? {});
  }
}

let activeSearcher: Searcher = new LikeRanker();

export function getSearcher(): Searcher {
  return activeSearcher;
}

/**
 * Swap the active backend. Intended for tests and for the future
 * `HybridRanker` to be wired in from app bootstrap. Returns the previous
 * searcher so call sites can restore (test fixtures).
 */
export function setSearcher(next: Searcher): Searcher {
  const prev = activeSearcher;
  activeSearcher = next;
  return prev;
}

/**
 * Convenience: route through the active searcher. Most call sites prefer
 * this to dealing with the Searcher object directly.
 */
export async function search(
  kb: Kb,
  query: string,
  opts?: { type?: ManifestType; repo?: string; limit?: number },
): Promise<SearchHit[]> {
  return activeSearcher.search(kb, query, opts ?? {});
}
