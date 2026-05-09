---
id: eval-design
title: "Eval suite design checklist"
category: checklist
tags: [eval, testing]
sources: []
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  Used by the build_eval tool. A good eval set is: small enough to run
  fast, big enough to catch regression, and biased toward the failure
  cases you actually care about.
related: [prompt-review]
---

# Eval suite design checklist

## Coverage
- [ ] Happy path: 5–7 representative inputs.
- [ ] Edge cases: 3–5 inputs that test boundary conditions (empty,
  truncated, multilingual, very long, very short).
- [ ] Adversarial: 2–3 inputs that try to misuse, inject, or confuse.
- [ ] Ambiguous: 2–3 inputs that have two equally valid answers — test
  the escape hatch.

## Scoring
- [ ] Metric chosen: exact_match (parseable structured output), rubric
  (multi-criterion judge), llm_judge (open-ended).
- [ ] Per-case expected output OR expected criteria written down.
- [ ] Scoring is reproducible (same input → same score).

## Rubric (when metric=rubric)
- [ ] 3–6 criteria, each scored 0/1 or 0–3.
- [ ] Each criterion has concrete pass/fail definitions, not "good".
- [ ] Total score interpretable (>X = ship; <Y = block).

## LLM judge (when metric=llm_judge)
- [ ] Judge prompt scoped to one decision (don't ask one judge to score
  five criteria at once).
- [ ] Judge has access to expected criteria.
- [ ] Spot-check 5 cases by hand to verify the judge agrees with you.

## Operations
- [ ] Eval can run in <2 minutes for fast iteration.
- [ ] Failures are surfaced one-by-one with input/output/expected.
- [ ] Eval is versioned (so you can compare prompt v1 vs v2 fairly).
