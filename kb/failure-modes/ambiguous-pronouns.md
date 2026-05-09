---
id: ambiguous-pronouns
title: "Ambiguous pronouns and references"
category: failure-mode
tags: [clarity, language]
sources: []
severity: minor
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  "It", "this", "the document", "the above" all become ambiguous when
  the prompt has multiple possible antecedents. Replace pronouns with
  XML-tagged references: `<document index="2">` instead of "the second one".
related: [vague-instructions, xml-tags]
---

# Ambiguous pronouns

## Symptom
Output references the wrong document, the wrong example, or the wrong
prior step. The model picked one valid interpretation; you wanted the
other.

## Common offenders
- "Summarize this." (Which "this"?)
- "Use the example above to..." (Which example, if there are 3?)
- "Apply the same rule to it." (Same rule? It?)

## Fix
- Tag every referable region with an explicit name: `<rubric_v1>`,
  `<example index="2">`, `<input>`.
- Refer to regions by tag, never by position ("above", "earlier") — the
  model's notion of "above" is fuzzier than yours.

## Pattern
```
<rubric>
{{the rules}}
</rubric>

<input>
{{data}}
</input>

Apply <rubric> to <input>. Return ...
```

## Catches
- Search your prompt for "this", "it", "that", "above", "below". Each one
  is a candidate ambiguity. Replace with explicit tag references.
