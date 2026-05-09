---
id: conflicting-examples
title: "Conflicting or contradictory examples"
category: failure-mode
tags: [examples, few-shot]
sources: []
severity: major
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  Examples are stronger than instructions. If your examples disagree
  with each other or with your instructions, examples win — and your
  output becomes unstable. Audit examples first when output is wrong
  and instructions look fine.
related: [missing-output-contract, multishot-examples]
---

# Conflicting examples

## Symptom
Output is high-quality on some examples-like inputs but inconsistent on
others. The instruction says X but examples occasionally show Y.

## Common patterns
- One labeling rubric in instructions, another implicit in examples.
- Examples drawn from different annotators with different conventions.
- An "edge case" example that contradicts the happy-path examples.

## Fix
- Pick one labeling rubric. Re-label all examples against it.
- Document the rubric explicitly inside the prompt, then point at it
  from each example: `<example rubric="v2">...`.
- Keep edge cases consistent with the rubric — if an edge case requires
  a different rule, name the rule.

## Catches
- For each example, write the implicit rule it follows. Are they the
  same rule across all examples?
- Try removing one example at a time and re-running. If output stability
  changes, that example was either load-bearing or contradictory.
