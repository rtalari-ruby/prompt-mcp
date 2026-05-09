---
id: role-prompting
title: "Role prompting via system prompt"
category: claude-specific
tags: [system-prompt, persona, claude]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Whenever a task benefits from domain framing — legal review, code review,
  data extraction, support triage. The role is a strong, cheap accuracy
  lever and helps Claude pick the right register.
when_not_to_use: |
  Generic Q&A where a role would just bias the answer. Tasks where the
  user's request already specifies the framing.
claude_notes: |
  Put the role in the `system` field, NOT in the first user turn. The
  system field is the right channel for persistent identity and rules.
  A good role specifies: profession + seniority + relevant constraints.
  ("You are a senior FP&A analyst at a mid-market SaaS company. You
  always cite the source line for any number you quote.") Don't waste
  the system prompt on flowery persona prose — Claude doesn't need it.
related: [xml-tags, prefilling]
---

# Role prompting

## TL;DR
Set Claude's role with one or two crisp sentences in the `system` field.
Profession + seniority + decision rules > persona theatre.

## Pattern (API)
```python
client.messages.create(
    model="claude-sonnet-4-6",
    system=(
        "You are a senior security reviewer. "
        "You flag risks even when the code 'looks fine' and you cite line numbers. "
        "If you're unsure, you say 'unsure' rather than guess."
    ),
    messages=[...]
)
```

## What goes in `system` vs user turns
- `system`: identity, persistent rules, output contract that applies to
  every response.
- `user`: the specific input, examples, the actual question.

## Failure modes
- **Putting the role in user.** It works, but the model treats it as
  contextual not persistent — easier to override.
- **Persona theatre.** "You are an enthusiastic 25-year-old expert who
  loves..." → no measurable improvement; potential bias.
- **Conflicting roles.** System says "concise"; user says "give me a
  detailed essay." Document the priority.

## See also
- [xml-tags](xml-tags.md)
- [prefilling](prefilling.md)
