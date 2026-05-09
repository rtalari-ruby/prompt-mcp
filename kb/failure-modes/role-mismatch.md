---
id: role-mismatch
title: "Role / task mismatch"
category: failure-mode
tags: [system-prompt, role]
sources: []
severity: major
when_to_use: N/A
when_not_to_use: N/A
claude_notes: |
  System role is a tone and authority lever. If the role doesn't match
  the task, output drifts: a "friendly chat assistant" doing a SOC2
  control audit will produce hand-wavy output; a "senior security
  reviewer" doing a marketing rewrite will sound stiff.
related: [role-prompting, vague-instructions]
---

# Role / task mismatch

## Symptom
Output tone is wrong (too casual, too formal, too cautious, too
opinionated) or output skips the technical depth the task needs.

## Common patterns
- Default helpful-assistant role for a domain-specific task.
- Generic "expert" role for a niche task ("expert" → who?).
- Role hardcoded for one task being reused across many tasks.

## Fix
- Match the role to the task: profession + seniority + specific decision
  rules ("You always cite line numbers", "You flag risks even when code
  looks fine").
- For a multi-task agent, scope the role tighter or split prompts.

## Pattern
```
[system]
You are a senior FP&A analyst at a mid-market SaaS company. You always
trace numbers to source rows. If a number can't be traced, you say so.
You prefer flagging variance over hiding it.
```

## Catches
- Read the role aloud. Does it commit Claude to the kind of output you
  actually want? Or is it generic enough to fit any task?
