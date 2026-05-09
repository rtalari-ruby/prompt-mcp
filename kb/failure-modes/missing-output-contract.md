---
id: missing-output-contract
title: "Missing output contract"
category: failure-mode
tags: [output, parsing]
sources: []
severity: blocker
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  If the next step in your pipeline parses the output, you need a
  contract. Specify the exact schema, give one example, and prefill the
  assistant turn (`{` for JSON, `<analysis>` for XML) to lock the shape.
related: [vague-instructions, prefilling]
---

# Missing output contract

## Symptom
Output format varies between runs. Pipeline parser breaks on edge runs.
Output sometimes wraps JSON in prose ("Here's the JSON: ...").

## Fix
- Specify the exact format: schema, field list, types.
- Provide ONE worked example.
- Prefill the assistant turn (`{` for JSON; `<output>` for XML).
- State explicitly: "Return ONLY the JSON object. No prose."

## Pattern
```
Return JSON matching this schema:
{
  "category": "billing" | "technical" | "account" | "other",
  "urgency": 1 | 2 | 3 | 4 | 5,
  "reasoning": string
}

Example:
{"category": "billing", "urgency": 3, "reasoning": "..."}

Return ONLY the JSON. No markdown fence, no prose.
```
Then prefill assistant turn with `{`.

## Catches
- Run the prompt 5 times with the same input. Diff the outputs. If they
  vary in shape, the contract is too loose.
- Hand the output to an actual parser. If it fails, your contract failed.
