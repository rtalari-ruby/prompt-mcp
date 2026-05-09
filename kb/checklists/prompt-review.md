---
id: prompt-review
title: "Prompt review checklist"
category: checklist
tags: [review, critique]
sources: []
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  Used by the critique_prompt tool. Each item maps to a failure mode in
  kb/failure-modes/. Severity levels: blocker (output will be wrong),
  major (quality will degrade), minor (style), nit (preference).
related: [eval-design]
---

# Prompt review checklist

## Structure
- [ ] Has a clear role in the system prompt (or first user turn).
  → severity major if missing.
- [ ] Uses XML tags to delimit document, examples, task, output schema
  when more than one section is present.
  → severity major if missing.
- [ ] Documents at the top, instructions/question at the bottom for any
  prompt over ~3k tokens.
  → severity minor.

## Clarity
- [ ] Every verb is concrete (no "analyze", "improve", "summarize"
  without specifics).
  → severity blocker if vague.
  → ref: failure-modes/vague-instructions.
- [ ] No ambiguous pronouns ("this", "it", "above") referencing
  multiple possible antecedents.
  → severity minor.
  → ref: failure-modes/ambiguous-pronouns.

## Output
- [ ] Output format specified explicitly (schema, length, shape).
  → severity blocker if missing for parsed output.
  → ref: failure-modes/missing-output-contract.
- [ ] Worked example of the output provided.
  → severity major if missing for non-trivial output.
- [ ] Prefill or "Return ONLY ..." discipline present for parsed output.
  → severity major.

## Examples
- [ ] 3+ examples for tasks where format/edge handling matters.
  → severity major if missing.
- [ ] At least one edge case among examples.
  → severity major if missing.
- [ ] At least one negative / "doesn't apply" example.
  → severity major if missing.
- [ ] Examples are consistent with each other and with the instructions.
  → severity major if conflicting.
  → ref: failure-modes/conflicting-examples.

## Robustness
- [ ] Escape hatch defined for empty / off-topic / ambiguous input.
  → severity major if missing.
  → ref: failure-modes/missing-escape-hatch.
- [ ] Conflicting instructions resolved (or priority documented).
  → severity major.

## Reasoning
- [ ] Multi-step or ambiguous task uses extended thinking OR explicit
  CoT structure (`<thinking>` + `<answer>`).
  → severity major if missing on hard tasks.
  → ref: claude-specific/extended-thinking; techniques/chain-of-thought.

## Style
- [ ] No persona theatre.
  → severity nit.
- [ ] No instructions that just describe what NOT to do without saying
  what to do.
  → severity minor.
