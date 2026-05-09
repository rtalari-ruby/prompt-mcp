---
id: extended-thinking
title: "Extended thinking (Claude native CoT)"
category: claude-specific
tags: [reasoning, claude, opus, sonnet]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Hard reasoning, math, planning, multi-hop research, long agent loops.
  Anywhere you'd reach for chain-of-thought. Available on Claude Opus 4.7,
  Sonnet 4.6, and (partial) Haiku 4.5.
when_not_to_use: |
  Simple, single-hop tasks (classification, extraction, formatting). It
  costs reasoning tokens that don't show up in the output but do show up
  on your bill. Not useful when you need a sub-300ms response.
claude_notes: |
  Set `thinking: { type: "enabled", budget_tokens: N }` on the request.
  Budget is upper-bound, not target — Claude often uses less. Start at
  4000 for moderate problems, 16000+ for hard ones. Reasoning happens in
  a hidden block; only the visible message reaches your assistant turn.
  Don't combine extended thinking with hand-rolled <thinking> tags —
  pick one. Extended thinking is preferred when the model supports it.
related: [chain-of-thought, self-consistency]
---

# Extended thinking

## TL;DR
Claude's native, trained-in version of chain-of-thought. You hand it a
token budget; it spends them in a hidden reasoning block before producing
its visible answer. Better quality and lower latency than hand-rolled
`<thinking>` tags on supported models.

## Pattern (API)
```python
response = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=4096,
    thinking={"type": "enabled", "budget_tokens": 16000},
    messages=[...]
)
```

## When to bump the budget
- Multi-step math or proof: 8k–32k.
- Strategy / planning over a long doc: 16k–64k.
- Routine classification: don't enable thinking.

## Failure modes
- **Combined with hand-rolled CoT.** The model double-thinks. Drop the
  `<thinking>` tags.
- **Budget too small.** Model truncates mid-reasoning and produces a
  weak visible answer. Bump the budget.
- **Budget too large on a small task.** You pay for tokens the model
  didn't need. Tune via eval.

## See also
- [chain-of-thought](../techniques/chain-of-thought.md)
