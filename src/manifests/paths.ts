import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const promptMcpRoot = resolve(here, "..", "..");

/**
 * Personal manifest KB root.
 *
 * - Override with `PROMPTFORGE_HOME` (preferred).
 * - Falls back to `~/.promptforge/kb` so the same KB is shared across
 *   any session that mounts prompt-mcp, regardless of where the repo
 *   lives on disk.
 */
export function kbRoot(): string {
  const envRoot = process.env.PROMPTFORGE_HOME;
  if (envRoot) return resolve(envRoot);
  return join(homedir(), ".promptforge", "kb");
}

export function manifestsDir(): string {
  const p = join(kbRoot(), "manifests");
  mkdirp(p);
  return p;
}

export function sessionsDir(): string {
  const p = join(kbRoot(), "sessions");
  mkdirp(p);
  return p;
}

export function indexPath(): string {
  mkdirp(kbRoot());
  return join(kbRoot(), "index.sqlite");
}

/** Manifest templates ship inside prompt-mcp under templates/manifests/. */
export function templatesDir(): string {
  return join(promptMcpRoot, "templates", "manifests");
}

function mkdirp(p: string): void {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}
