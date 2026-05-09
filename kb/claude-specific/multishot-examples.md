---
id: multishot-examples
title: "Multishot examples (few-shot for Claude)"
category: claude-specific
tags: [examples, few-shot, claude]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Whenever output format, tone, or edge-case handling matters. Examples
  beat description for anything where the contract is implicit. 3–5
  examples is usually the sweet spot.
when_not_to_use: |
  Tasks with no consistent output format (open-ended writing) or where the
  examples would be longer than the actual task. Also skip for tasks
  Claude already does well zero-shot — the examples can constrain it
  unnecessarily.
claude_notes: |
  Wrap each example in <example><input>...</input><output>...</output></example>.
  Wrap the whole block in <examples>. Always include at least one edge
  case (ambiguous input) and at least one negative example (input where
  the right answer is "I don't know" or to refuse). Claude is sensitive
  to example ordering; put the most representative one first.
related: [xml-tags, few-shot]
---

# Multishot examples

## TL;DR
Show, don't tell. Provide 3–5 input/output pairs in XML, including at
least one edge case and one "doesn't apply" case. Claude generalizes from
the patterns; the examples define the contract more reliably than prose.

## Pattern
```
<examples>
<example>
  <input>{{representative input #1}}</input>
  <output>{{ideal output #1}}</output>
</example>
<example>
  <input>{{edge case — ambiguous, partial, or weird input}}</input>
  <output>{{principled handling — defer, mark uncertain, etc.}}</output>
</example>
<example>
  <input>{{out-of-scope input}}</input>
  <output>{{the explicit "doesn't apply" response}}</output>
</example>
</examples>

<task>
{{the actual input}}
</task>
```

## Example — sentiment with confidence
```
<examples>
<example>
  <input>Best purchase ever, 10/10</input>
  <output>{"sentiment": "positive", "confidence": "high"}</output>
</example>
<example>
  <input>It works.</input>
  <output>{"sentiment": "neutral", "confidence": "medium"}</output>
</example>
<example>
  <input>asdfghjkl</input>
  <output>{"sentiment": "unknown", "confidence": "low"}</output>
</example>
</examples>
```

## Failure modes
- **Examples that disagree.** Mitigation: enforce one labeling rubric.
- **Too many examples** — past ~5, marginal value drops; you're just
  burning context. Use eval to find the actual optimum for your task.
- **Cherry-picked happy paths only.** Without an edge case, Claude won't
  know how to fail gracefully. Always include one.

## See also
- [xml-tags](xml-tags.md)
- [../techniques/few-shot.md](../techniques/few-shot.md)
