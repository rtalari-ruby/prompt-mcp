---
type: feature
default_skills:
  - karpathy-guidelines
  - superpowers:brainstorming
  - superpowers:writing-plans
  - superpowers:subagent-driven-development
  - superpowers:finishing-a-development-branch
---

# {{title}}

## Context
{{raw}}

**Repos:** {{repos_csv}}

## Problem
What is the user pain or product opportunity? Who feels it? How is it felt today?

## Outcome
A single, verifiable end-state. Not a list of tasks — a description of "done."

## Constraints (karpathy-guidelines)
- Build only what the outcome requires. No speculative scope.
- Surface every architectural assumption *before* writing code.
- Define how we will measure success: test, metric, demo.
- Three similar lines are fine; do not abstract for a hypothetical future.

## Brainstorm
Use this section to capture exploration before locking the plan. Approaches considered, why they were rejected, what trade-offs were chosen.

## Plan (writing-plans)
A bite-sized, file-level task list. Each task: exact files, exact code or pseudocode, exact verification command. No "TBD" or "TODO".

1. ...
2. ...

## Verification
- [ ] Plan complete and saved to `docs/superpowers/plans/`.
- [ ] Tests written and passing.
- [ ] UI tested end-to-end (if applicable).
- [ ] Performance / Core Web Vitals checked (if user-facing).
- [ ] Telemetry events emitted (if instrumented).

## Forge Instruction
Once `forge.ready: true` in frontmatter, the Forge operator pastes the block below to `pipelineWorkflow`:

```
Repo: {{repos_csv}}
Goal: {{title}}
Context: {{raw}}
Acceptance: <pasted from "Outcome" section above>
Designs: {{designs}}
Linked skills: karpathy-guidelines, superpowers:test-driven-development, superpowers:verification-before-completion
```

## References
- `karpathy-guidelines` — discipline.
- `superpowers:brainstorming` — explore intent before implementation.
- `superpowers:writing-plans` — turn a spec into bite-sized tasks.
- `superpowers:subagent-driven-development` — execute tasks one at a time with review.
- `superpowers:finishing-a-development-branch` — close the loop cleanly.

## Designs
{{designs}}

## Notes
{{notes}}
