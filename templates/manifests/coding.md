---
type: coding
default_skills:
  - karpathy-guidelines
  - superpowers:test-driven-development
  - superpowers:verification-before-completion
---

# {{title}}

## Context
{{raw}}

**Repos:** {{repos_csv}}

## Goal
Define one verifiable success state for this work.

## Constraints (karpathy-guidelines)
- Make surgical changes; do not refactor surrounding code unless it is in scope.
- Surface assumptions before writing code. List them here.
- Define a verifiable success criterion. Vague goals are bugs.
- No speculative abstractions. Three similar lines is fine; premature factoring is not.
- Comments only where the *why* is non-obvious.

## Approach (TDD where it fits)
1. Write the failing test that captures the success state.
2. Implement the minimum that turns it green.
3. Verify lint + typecheck + the rest of the suite.

## Verification checklist
- [ ] Failing test reproduces the gap.
- [ ] Test passes after change.
- [ ] Lint + typecheck green.
- [ ] No collateral diffs outside scope.
- [ ] Manual smoke on the affected surface.

## References
- `karpathy-guidelines` — behavioural discipline (surgical, surface assumptions, verifiable).
- `superpowers:test-driven-development` — outer TDD loop.
- `superpowers:verification-before-completion` — never claim done without verifying.

## Designs
{{designs}}

## Notes
{{notes}}
