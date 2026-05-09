---
id: xml-tags
title: "XML tags for structuring prompts"
category: claude-specific
tags: [structure, claude, attention]
sources:
  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
when_to_use: |
  Whenever a prompt has more than one logical part — instructions, input
  document, examples, role, schema, output format. XML tags let Claude
  attend to each section without confusing roles.
when_not_to_use: |
  Single-line, single-purpose prompts ("translate this: ..."). Adding XML
  there is just noise.
claude_notes: |
  Claude is specifically trained on XML-tagged prompts. Use tags as
  attention anchors: <document>, <example>, <task>, <thinking>, <answer>,
  <criteria>, <persona>. Tag names matter less than consistency — pick a
  vocabulary and stick to it across the prompt. You can refer to a tagged
  region by name later in the prompt: "Using only the content in
  <document>, ..."
related: [multishot-examples, document-first-ordering, prefilling]
---

# XML tags

## TL;DR
Use XML-style tags to delimit semantic regions of a prompt. Claude is
trained to treat them as structure, not noise. Tag the document, the
examples, the role, the output schema — and refer to them by tag name in
your instructions.

## Pattern
```
You are a {{role}}.

<document>
{{the input}}
</document>

<task>
{{what to do with the document}}
</task>

<output_format>
JSON with fields: ...
</output_format>
```

## Example — extraction
```
<document>
SKU 4521 — "Cotton crew tee, navy, M". $24.99. In stock.
</document>

<task>
Extract product attributes from <document>. Return JSON only.
</task>

<output_schema>
{ "sku": str, "name": str, "color": str, "size": str, "price": float, "in_stock": bool }
</output_schema>
```

## Anti-patterns
- Inventing tags mid-prompt. Define your vocabulary once at the top.
- Mixing tags and triple-backtick fences for the same purpose. Pick one.
- Tagging at the wrong granularity (one tag per word, or one tag for the
  whole prompt).

## See also
- [multishot-examples](multishot-examples.md)
- [document-first-ordering](document-first-ordering.md)
- [prefilling](prefilling.md)
