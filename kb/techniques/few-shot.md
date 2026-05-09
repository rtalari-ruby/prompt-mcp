---
id: few-shot
title: "Few-shot prompting"
category: technique
tags: [examples, in-context-learning]
sources:
  - https://www.promptingguide.ai/techniques/fewshot
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Tasks with implicit format, tone, or labeling rules. Anywhere a
  description is hard to write but examples are easy. 3–5 examples is
  usually optimal.
when_not_to_use: |
  Tasks the model already does zero-shot well. Tasks where examples
  would be longer than the input. Open-ended generation where the
  examples would over-constrain.
claude_notes: |
  Use the Claude-specific multishot pattern: wrap each pair in
  <example><input>...</input><output>...</output></example> and the
  whole block in <examples>. Always include one edge case and one
  negative example. See claude-specific/multishot-examples.
related: [chain-of-thought, multishot-examples, active-prompt]
---

# Few-shot prompting

## TL;DR
Show 3–5 input/output pairs in your prompt; the model learns the
pattern in-context. Beats prose description for any task with implicit
rules. Brown et al. (2020) is the canonical reference.

## Pattern
```
<examples>
<example>
  <input>{{x_1}}</input>
  <output>{{y_1}}</output>
</example>
... 2–4 more ...
</examples>

<task>
{{the actual input}}
</task>
```

## Failure modes
- **Examples disagree.** See failure-modes/conflicting-examples.
- **Cherry-picked happy paths.** Always include 1 edge case + 1
  out-of-scope example.
- **Order bias.** Most-representative example first. Worst-case last.

## See also
- [multishot-examples](../claude-specific/multishot-examples.md)
- [chain-of-thought](chain-of-thought.md)
