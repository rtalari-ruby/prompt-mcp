---
id: be-clear-and-direct
title: "Be clear, direct, and detailed"
category: claude-specific
tags: [clarity, instructions, claude]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Always. This is the default. Every other technique compounds with this
  one — you can't fix vagueness with XML tags or examples.
when_not_to_use: |
  Never skip; only the level of detail varies with task complexity.
claude_notes: |
  Tell Claude what to do, not what not to do. Specify: who you are
  (system), the situation, the input, the constraints, the output
  format, the escape hatch when uncertain. Treat Claude as a smart but
  new contractor — they need the brief, not the lore. Re-read your
  prompt: would a sharp human know exactly what to produce? If not,
  cut, clarify, then add examples.
related: [xml-tags, role-prompting, multishot-examples]
---

# Be clear, direct, and detailed

## TL;DR
Specify the situation, the inputs, the constraints, the output, and what
to do when uncertain. Examples are great, but they don't substitute for
clear instructions; they reinforce them.

## Checklist
- **Role**: who is Claude? (system prompt)
- **Context**: what's the situation? (one sentence)
- **Input**: what data is being supplied?
- **Task**: what should be done with it?
- **Constraints**: format, length, tone, must-not-include.
- **Output contract**: schema or example.
- **Escape hatch**: what to do when input is ambiguous, off-topic, or
  unsupported. Never leave this implicit.

## Pattern
```
You are a {{role}}. [system]

Context: {{one-sentence situation}}.

<input>
{{the data}}
</input>

Do: {{specific instruction}}.

Output format: {{schema or shape}}.

If <input> is ambiguous or off-topic, return {{escape value}}.
```

## Failure modes
- **Negative-only instructions.** "Don't be too long" → undefined target.
  Instead: "≤ 3 sentences."
- **Implicit format.** "Give me a summary" → free-form. Instead: "3
  bullet points, ≤15 words each."
- **Missing escape hatch.** Forces the model to guess on weird inputs.
  Always specify what to do when the input is bad.

## See also
- [xml-tags](xml-tags.md)
- [role-prompting](role-prompting.md)
- [multishot-examples](multishot-examples.md)
