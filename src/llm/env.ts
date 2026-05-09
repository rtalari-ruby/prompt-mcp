// Light env loader: reads .env (KEY=VALUE per line, # comments, no quoting magic)
// from the project root before the LLM client reads process.env.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/llm/env.js → ../../  ; src/llm/env.ts → ../../
  const candidates = [resolve(here, "../../.env"), resolve(here, "../.env"), resolve(process.cwd(), ".env")];
  const path = candidates.find((p) => existsSync(p));
  if (!path) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
