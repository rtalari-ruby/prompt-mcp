---
id: missing-escape-hatch
title: "Missing escape hatch"
category: failure-mode
tags: [robustness, hallucination]
sources: []
severity: major
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  Without explicit "what to do when stuck", the model improvises. That's
  hallucination by design. Specify the off-ramp: low-confidence flag,
  "I don't know", explicit refusal, or escalation.
related: [missing-output-contract, vague-instructions]
---

# Missing escape hatch

## Symptom
On weird inputs (empty, off-topic, adversarial, partial), the model
guesses confidently instead of flagging. You discover this in production.

## Fix
Explicitly tell Claude what to do when:
- Input is missing required information
- Input is off-topic
- Input is ambiguous between two equally valid interpretations
- Confidence is low

## Pattern
```
If <input> is empty, off-topic, or ambiguous, return:
{"category": "other", "confidence": "low", "reason": <one sentence>}

Never guess silently. If you'd give the same answer to two very different
inputs, return the low-confidence form.
```

## Catches
- Test with empty input, gibberish, an instruction-injection attempt, and
  an adjacent-but-wrong-domain input. Does the model flag any of them?
- If the model never returns the escape value across a 20-case eval,
  either your inputs are too clean or the escape hatch is too narrow.
