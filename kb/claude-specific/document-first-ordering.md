---
id: document-first-ordering
title: "Document-first ordering for long context"
category: claude-specific
tags: [long-context, rag, ordering, claude]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Any prompt with >5k tokens of input documents. Especially when the
  model must reason over the docs (summarize, extract, answer). Standard
  for RAG.
when_not_to_use: |
  Short prompts, or prompts where the document is one of many minor
  inputs. The ordering benefit is negligible below ~3k tokens of context.
claude_notes: |
  Order: <documents> first → instructions / question last. Index each
  document with attributes so Claude can cite: <document index="1"
  source="...">. Claude is trained to look back to the most recent
  instructions, so putting them after the documents keeps them salient.
  This pattern also makes prompt caching effective — the document block
  becomes the cacheable prefix while only the trailing question changes.
related: [xml-tags, rag]
---

# Document-first ordering

## TL;DR
Put the documents at the top, the question at the bottom. Tag each
document with an index and source so Claude can cite. Helps recall on
long context AND makes the prefix cacheable.

## Pattern
```
<documents>
<document index="1" source="brand-guidelines-2024.pdf#p3">
{{full text}}
</document>
<document index="2" source="customer-feedback-q1.csv">
{{full text}}
</document>
</documents>

<task>
Using only the content in <documents>, list the top 3 customer pain
points and cite the source index for each.
</task>
```

## Why this order
- **Salience of instructions.** Instructions just before the assistant
  turn are more attended-to than instructions buried before 50k tokens.
- **Cache friendliness.** Documents at the top → stable prefix →
  cache hit. Question at the bottom → small variable suffix.
- **Citation discipline.** Indexing documents lets you ask for cites,
  which catches hallucination.

## Failure modes
- **Question buried mid-prompt.** Recall drops noticeably.
- **Documents without indices.** No way to get citations; harder to
  audit.
- **Re-ordering on every call.** Breaks cache hits.

## See also
- [xml-tags](xml-tags.md)
- [../techniques/rag.md](../techniques/rag.md)
