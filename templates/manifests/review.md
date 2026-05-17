---
type: review
default_skills:
  - karpathy-guidelines
  - superpowers:requesting-code-review
  - superpowers:receiving-code-review
---

# {{title}}

## Context
{{raw}}

**Repos:** {{repos_csv}}

## What changed
Summarise the diff at one level above the code: what behaviour or interface changes? What was deliberately *not* changed?

## Reviewer's eye (karpathy-guidelines)
- Are the changes surgical, or is there scope creep?
- Are stated assumptions actually true?
- Is the success criterion verifiable from the diff alone?
- Any premature abstractions, dead branches, or fallbacks for impossible states?
- Comments: do they explain *why*, or restate *what*?

## Review checklist
- [ ] Tests cover the new behaviour and at least one failure mode.
- [ ] No incidental refactors mixed into the change.
- [ ] No `console.log` / `print` debugging left behind.
- [ ] No secrets, env vars, or absolute personal paths committed.
- [ ] Public API / migrations are backward-compatible OR a deliberate break is documented.
- [ ] Performance: any new N+1, unbounded loop, or sync I/O in a hot path?
- [ ] Security: input validation at boundaries, escaping in templates, no `eval`-shaped code.

## Feedback format (receiving-code-review)
Take comments at face value. Push back only with evidence. Group fixes by file and commit in one fixup. Re-request review once green.

## References
- `karpathy-guidelines` — what to look for.
- `superpowers:requesting-code-review` — how to ask.
- `superpowers:receiving-code-review` — how to respond.

## Designs
{{designs}}

## Notes
{{notes}}
