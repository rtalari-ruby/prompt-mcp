import { DatabaseSync } from "node:sqlite";
import type { Manifest, SearchHit, ManifestType } from "./types.js";
import { indexPath } from "./paths.js";

export type Kb = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS manifests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created TEXT NOT NULL,
  updated TEXT NOT NULL,
  repos TEXT NOT NULL,
  tags TEXT NOT NULL,
  linked_skills TEXT NOT NULL,
  path TEXT NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL,
  search_blob TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS manifests_type_idx ON manifests(type);
CREATE INDEX IF NOT EXISTS manifests_status_idx ON manifests(status);
CREATE INDEX IF NOT EXISTS manifests_updated_idx ON manifests(updated DESC);
`;

export function openKb(path?: string): Kb {
  const db = new DatabaseSync(path ?? indexPath());
  db.exec(SCHEMA);
  return db;
}

export function closeKb(db: Kb): void {
  db.close();
}

function buildSearchBlob(m: Manifest): string {
  const fm = m.frontmatter;
  return [
    fm.title,
    fm.title,
    fm.title,
    fm.tags.join(" "),
    fm.tags.join(" "),
    fm.repos.join(" "),
    fm.linked_skills.join(" "),
    m.body,
  ]
    .join(" \n ")
    .toLowerCase();
}

export function upsertManifest(db: Kb, m: Manifest): void {
  const fm = m.frontmatter;
  const stmt = db.prepare(`
    INSERT INTO manifests (id, title, type, status, created, updated, repos, tags, linked_skills, path, use_count, body, search_blob)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      type=excluded.type,
      status=excluded.status,
      updated=excluded.updated,
      repos=excluded.repos,
      tags=excluded.tags,
      linked_skills=excluded.linked_skills,
      path=excluded.path,
      body=excluded.body,
      search_blob=excluded.search_blob
  `);
  stmt.run(
    fm.id,
    fm.title,
    fm.type,
    fm.status,
    fm.created,
    fm.updated,
    JSON.stringify(fm.repos),
    JSON.stringify(fm.tags),
    JSON.stringify(fm.linked_skills),
    m.path,
    fm.metrics.use_count,
    m.body,
    buildSearchBlob(m),
  );
}

export function getManifestRow(db: Kb, id: string): ManifestRow | null {
  const row = db.prepare(`SELECT * FROM manifests WHERE id = ?`).get(id);
  return row ? (row as unknown as ManifestRow) : null;
}

export interface ManifestRow {
  id: string;
  title: string;
  type: ManifestType;
  status: string;
  created: string;
  updated: string;
  repos: string;
  tags: string;
  linked_skills: string;
  path: string;
  use_count: number;
  body: string;
  search_blob: string;
}

export interface SearchOptions {
  type?: ManifestType;
  repo?: string;
  limit?: number;
}

export function searchManifests(
  db: Kb,
  query: string,
  opts: SearchOptions = {},
): SearchHit[] {
  const limit = opts.limit ?? 10;
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const conds: string[] = [];
  const params: (string | number)[] = [];
  for (const t of terms) {
    conds.push(`search_blob LIKE ?`);
    params.push(`%${t}%`);
  }
  if (opts.type) {
    conds.push(`type = ?`);
    params.push(opts.type);
  }
  if (opts.repo) {
    conds.push(`repos LIKE ?`);
    params.push(`%"${opts.repo}"%`);
  }
  const sql = `SELECT id, title, type, body, path, updated, search_blob FROM manifests WHERE ${conds.join(" AND ")} ORDER BY updated DESC LIMIT ?`;
  params.push(limit * 4);
  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    title: string;
    type: ManifestType;
    body: string;
    path: string;
    updated: string;
    search_blob: string;
  }>;

  const scored: SearchHit[] = rows.map((r) => {
    let score = 0;
    const lower = r.search_blob;
    const titleLower = r.title.toLowerCase();
    for (const t of terms) {
      if (titleLower.includes(t)) score += 3;
      let idx = 0;
      while ((idx = lower.indexOf(t, idx)) !== -1) {
        score += 1;
        idx += t.length;
      }
    }
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      score,
      snippet: snippetFor(r.body, terms),
      path: r.path,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function snippetFor(body: string, terms: string[]): string {
  const lower = body.toLowerCase();
  for (const t of terms) {
    const idx = lower.indexOf(t);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(body.length, idx + t.length + 80);
      return (start > 0 ? "…" : "") + body.slice(start, end).replace(/\s+/g, " ") + (end < body.length ? "…" : "");
    }
  }
  return body.slice(0, 140).replace(/\s+/g, " ");
}

export interface ListOptions {
  type?: ManifestType;
  repo?: string;
  limit?: number;
}

export function listManifests(db: Kb, opts: ListOptions = {}): ManifestRow[] {
  const conds: string[] = [];
  const params: (string | number)[] = [];
  if (opts.type) {
    conds.push(`type = ?`);
    params.push(opts.type);
  }
  if (opts.repo) {
    conds.push(`repos LIKE ?`);
    params.push(`%"${opts.repo}"%`);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const sql = `SELECT * FROM manifests ${where} ORDER BY updated DESC LIMIT ?`;
  params.push(opts.limit ?? 50);
  return db.prepare(sql).all(...params) as unknown as ManifestRow[];
}

export function incrementUse(db: Kb, id: string): void {
  db.prepare(`UPDATE manifests SET use_count = use_count + 1 WHERE id = ?`).run(id);
}

export function countManifests(db: Kb): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM manifests`).get() as { n: number };
  return row.n;
}
