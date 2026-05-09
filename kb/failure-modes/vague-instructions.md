---
id: vague-instructions
title: "Vague instructions"
category: failure-mode
tags: [clarity, common]
sources: []
severity: blocker
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  Most prompts that "don't work" actually have this. Cut the vague
  verbs ("analyze", "improve", "summarize") and replace with concrete
  ones ("list", "rate 1-5 against criteria X, Y, Z", "rewrite in ≤3
  bullet points each ≤15 words").
related: [missing-output-contract, ambiguous-pronouns]
---

# Vague instructions

## Symptom
Output is on-topic but generic, misses the point, or varies wildly
across runs.

## Common phrases that smell wrong
- "Analyze this..." → analyze for what?
- "Summarize..." → length? audience? what's important?
- "Improve..." → on what axis?
- "Help me..." → with what specifically?

## Fix
Replace abstract verbs with measurable ones. Specify the criteria, the
shape, and the length.

**Before**: "Analyze this support ticket."
**After**: "Classify the ticket into one of: billing, technical,
account, other. Rate urgency 1–5. List the 3 specific phrases that
drove your classification."

## Catches
- Read your prompt aloud. Anywhere a junior could ask "what do you mean?"
  is a place to add specificity.
- Try producing the output yourself by hand from the prompt alone.
  If you couldn't, neither can Claude.
