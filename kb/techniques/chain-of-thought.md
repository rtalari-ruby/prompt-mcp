---
id: chain-of-thought
title: "Chain of Thought (CoT)"
category: technique
tags: [reasoning, multi-step, cot]
sources:
  - https://www.promptingguide.ai/techniques/cot
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Multi-step reasoning, math, complex logic, planning, classification with
  hidden criteria. Anywhere the model would otherwise jump to an answer
  prematurely. Especially useful when you can't verify the final answer
  directly but need to inspect intermediate steps.
when_not_to_use: |
  Simple lookups, classification with clear categories, factual recall,
  formatting transforms. CoT adds tokens and latency; for tasks where the
  answer is one hop, it's pure overhead and can introduce errors.
claude_notes: |
  Wrap reasoning in <thinking></thinking> tags so it's separable from the
  final answer. For Claude Opus 4.7 and Sonnet 4.6, prefer the native
  extended-thinking feature (set thinking budget) over hand-rolled CoT —
  it's faster, doesn't consume the visible output budget, and the model
  is trained to reason there. Use hand-rolled <thinking> only when you
  need the trace in the assistant message itself (debugging) or are
  running on a model without extended thinking.
related: [self-consistency, tree-of-thoughts, extended-thinking, react]
---

# Chain of Thought (CoT)

## TL;DR
Ask the model to think step-by-step before producing an answer. Either
show it example reasoning chains (few-shot CoT, Wei et al. 2022), or
trigger zero-shot with "Let's think step by step" (Kojima et al. 2022).
Improves accuracy on multi-step problems by trading tokens for reliability.

## Pattern
```
You are a {{role}}.

<task>
{{the question or problem}}
</task>

Think through this step by step inside <thinking></thinking> tags. Then
give your final answer inside <answer></answer> tags.
```

## Example
```
<task>
A bat and a ball cost $1.10 total. The bat costs $1.00 more than the ball.
How much does the ball cost?
</task>

<thinking>
Let ball = b. Then bat = b + 1.00. Total: b + (b + 1.00) = 1.10.
2b + 1.00 = 1.10. 2b = 0.10. b = 0.05.
</thinking>

<answer>$0.05</answer>
```

## Failure modes
- **Padding without reasoning.** The model goes through the motions but
  doesn't actually reason. Mitigation: use few-shot CoT with high-quality
  example chains, or extended thinking on capable models.
- **Wrong starting frame.** CoT can lock in an early misinterpretation.
  Mitigation: pair with self-consistency (sample N, take majority).
- **Token bloat.** On simple tasks, CoT just costs more. Don't reach for
  it by default.

## See also
- [self-consistency](self-consistency.md) — sample many CoTs, vote.
- [tree-of-thoughts](tree-of-thoughts.md) — branching CoT with backtracking.
- [extended-thinking](../claude-specific/extended-thinking.md) — Claude's
  native version of this.
