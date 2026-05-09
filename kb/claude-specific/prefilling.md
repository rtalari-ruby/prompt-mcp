---
id: prefilling
title: "Prefill the assistant turn"
category: claude-specific
tags: [output-control, json, claude]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  When you need to constrain the start of Claude's reply: force JSON,
  skip preamble, lock a specific format, or set a persona's first words.
  Cheap and reliable.
when_not_to_use: |
  When you want Claude to choose freely (open writing, brainstorming).
  Prefilling cuts off variance you may want.
claude_notes: |
  Pass an assistant turn at the end of your `messages` array with the
  characters Claude should continue from. Common patterns: prefill `{`
  to force JSON, prefill `<analysis>` to force XML structure, prefill
  the first sentence of an answer to skip "I'd be happy to..." preamble.
  Don't end the prefill with whitespace — Claude is trained to continue
  the literal token stream.
related: [xml-tags, multishot-examples]
---

# Prefilling the assistant turn

## TL;DR
Send the assistant's first few characters as part of the request.
Claude continues from there. Forces output shape with one or two tokens
of prompt overhead.

## Pattern (API)
```python
messages = [
    {"role": "user", "content": "Return product info as JSON."},
    {"role": "assistant", "content": "{"}     # prefill — Claude continues
]
```
Result: Claude's reply will be valid JSON, no preamble, no markdown fence.

## Common prefills
| Goal | Prefill |
|---|---|
| Force JSON object | `{` |
| Force JSON array | `[` |
| Force XML structure | `<analysis>` |
| Skip preamble in answer | First word of expected answer |
| Force a persona's voice | `Aye, captain — ` |

## Failure modes
- **Prefill ends in whitespace.** Tokenization mismatch; Claude may
  rewrite or ignore. Trim trailing whitespace.
- **Prefill is too long / opinionated.** Over-constrains; the model
  contorts the answer to fit.
- **Prefill conflicts with the user instruction.** The user asked for
  prose; you prefilled `{`. Claude has to break one. Don't.

## See also
- [xml-tags](xml-tags.md)
- [multishot-examples](multishot-examples.md)
