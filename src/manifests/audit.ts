import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { kbRoot } from "./paths.js";
import type { ManifestStatus } from "./types.js";
import type { Role } from "./transitions.js";

export interface AuditEvent {
  ts: string;
  actor_id: string; // token-derived identity (token name / hash prefix)
  actor_role: Role;
  action:
    | "create"
    | "scope"
    | "approve"
    | "transition"
    | "log_session"
    | "apply"
    | "delete";
  manifest_id?: string;
  from_status?: ManifestStatus;
  to_status?: ManifestStatus;
  detail?: string;
}

function auditDir(): string {
  const d = join(kbRoot(), "audit");
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  return d;
}

function logFileFor(date: Date): string {
  const yyyyMm = date.toISOString().slice(0, 7); // YYYY-MM
  return join(auditDir(), `${yyyyMm}.jsonl`);
}

/**
 * Append a single audit event as a JSON line. Synchronous on purpose —
 * if the audit log can't be written we want the caller to fail fast,
 * not silently lose the audit trail.
 */
export function auditLog(event: Omit<AuditEvent, "ts">): void {
  const full: AuditEvent = { ts: new Date().toISOString(), ...event };
  appendFileSync(logFileFor(new Date()), JSON.stringify(full) + "\n", "utf8");
}
