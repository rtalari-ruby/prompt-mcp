import type { ManifestStatus } from "./types.js";

export type Role = "pm" | "engineer" | "operator";

export interface Transition {
  from: ManifestStatus;
  to: ManifestStatus;
  /** Lowest role that can execute this transition. operator > engineer > pm. */
  minRole: Role;
}

/**
 * Allowed manifest status transitions + minimum role.
 *
 * Operator is a superset of engineer is a superset of pm.
 * Anything not in this table is rejected by `assertTransition`.
 */
export const TRANSITIONS: readonly Transition[] = [
  // Author workflow
  { from: "draft", to: "scoped", minRole: "pm" },
  { from: "scoped", to: "draft", minRole: "pm" },

  // Engineering review
  { from: "scoped", to: "approved", minRole: "engineer" },
  { from: "scoped", to: "archived", minRole: "engineer" },
  { from: "approved", to: "scoped", minRole: "engineer" }, // revoke

  // Pipeline lifecycle (atlas / forge-console sets these)
  { from: "approved", to: "in_flight", minRole: "operator" },
  { from: "in_flight", to: "done", minRole: "operator" },
  { from: "in_flight", to: "failed", minRole: "operator" },

  // Post-terminal
  { from: "failed", to: "scoped", minRole: "engineer" }, // retry
  { from: "done", to: "archived", minRole: "engineer" },
  { from: "failed", to: "archived", minRole: "engineer" },

  // Universal archive
  { from: "draft", to: "archived", minRole: "operator" },
  { from: "approved", to: "archived", minRole: "operator" },
  { from: "in_flight", to: "archived", minRole: "operator" },
] as const;

const ROLE_RANK: Record<Role, number> = { pm: 1, engineer: 2, operator: 3 };

export function roleCovers(actor: Role, required: Role): boolean {
  return ROLE_RANK[actor] >= ROLE_RANK[required];
}

export function findTransition(
  from: ManifestStatus,
  to: ManifestStatus,
): Transition | null {
  return TRANSITIONS.find((t) => t.from === from && t.to === to) ?? null;
}

export class TransitionError extends Error {
  constructor(
    public readonly from: ManifestStatus,
    public readonly to: ManifestStatus,
    message: string,
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

export function assertTransition(
  from: ManifestStatus,
  to: ManifestStatus,
  actor: Role,
): void {
  if (from === to) {
    throw new TransitionError(from, to, `noop transition ${from} → ${to}`);
  }
  const t = findTransition(from, to);
  if (!t) {
    throw new TransitionError(from, to, `transition ${from} → ${to} is not defined`);
  }
  if (!roleCovers(actor, t.minRole)) {
    throw new TransitionError(
      from,
      to,
      `transition ${from} → ${to} requires role '${t.minRole}', actor is '${actor}'`,
    );
  }
}

export function nextStates(from: ManifestStatus, actor: Role): ManifestStatus[] {
  return TRANSITIONS.filter((t) => t.from === from && roleCovers(actor, t.minRole)).map(
    (t) => t.to,
  );
}
