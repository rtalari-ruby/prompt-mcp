---
type: bug-fix
default_skills:
  - karpathy-guidelines
  - superpowers:systematic-debugging
  - superpowers:test-driven-development
---

# {{title}}

## Context
{{raw}}

**Repos:** {{repos_csv}}

## Symptom
What is observed? What is expected? Smallest reproduction?

## Goal
Fix the root cause, not the symptom. The failing case becomes a permanent test.

## Constraints (karpathy-guidelines)
- Surgical change. Do not refactor adjacent code.
- Surface assumptions about *why* this breaks before patching.
- Define what "fixed" means in a verifiable way (test, metric, log line).
- Do not add error-swallowing fallbacks to make the symptom go away.

## Investigation (systematic-debugging)
1. Reproduce locally with the smallest input.
2. Bisect: where does the value first go wrong?
3. State the hypothesis. Predict what each next observation should show.
4. Confirm the hypothesis with one targeted check before changing code.

## Approach
1. Write a failing test that asserts the fixed behaviour.
2. Patch the root cause.
3. Confirm the test passes and nothing else regressed.

## Verification checklist
- [ ] Reproduction is captured as a test (not a script).
- [ ] Test fails on `main`, passes on the fix branch.
- [ ] Lint + typecheck green.
- [ ] No `// removed` / `// TODO` cruft left behind.
- [ ] Postmortem note in this manifest if it was non-trivial.

## References
- `karpathy-guidelines` — discipline.
- `superpowers:systematic-debugging` — reproduce → hypothesise → confirm → fix.
- `superpowers:test-driven-development` — the failing test must come first.

## Designs
{{designs}}

## Notes
{{notes}}
