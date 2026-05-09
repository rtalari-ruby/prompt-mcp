---
id: directional-stimulus-prompting
title: Directional Stimulus Prompting
category: techniques
tags: []
sources:
  - 'https://www.promptingguide.ai/techniques/dsp'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use directional stimulus prompting when you can provide concise hints,
  keywords, constraints, or an auxiliary model-generated “stimulus” that should
  steer the model toward a specific output, especially for summarization or
  controlled generation. It is most useful when standard prompting is too
  underspecified and you have repeatable tasks where optimizing or curating
  hints is worthwhile.
when_not_to_use: >-
  Do not use it for simple one-off prompts where manually adding hints creates
  unnecessary overhead. Avoid it when the hints may bias the model toward
  unsupported content, reduce faithfulness, or when you cannot validate the
  quality of the stimulus generator.
claude_notes: >-
  For Claude, place hints in clear XML tags such as <hints> or
  <directional_stimulus> and keep source documents separately tagged, preferably
  before the task instruction for document-heavy workflows. Explicitly tell
  Claude whether hints are mandatory constraints or optional guidance, and
  instruct it not to invent facts beyond the provided source.
---
# Directional Stimulus Prompting

[Li et al., (2023)](https://arxiv.org/abs/2302.11520) proposes a new prompting technique to better guide the LLM in generating the desired summary.

A tuneable policy LM is trained to generate the stimulus/hint. Seeing more use of RL to optimize LLMs.

The figure below shows how Directional Stimulus Prompting compares with standard prompting. The policy LM can be small and optimized to generate the hints that guide a black-box frozen LLM.

Image Source: [Li et al., (2023)](https://arxiv.org/abs/2302.11520)

Full example coming soon!

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master directional stimulus prompting and advanced techniques for guiding LLM outputs."
    href="https://academy.dair.ai/courses/introduction-prompt-engineering"
    level="Beginner"
    duration="2 hours"
  />
    tag="Course"
    tagColor="purple"
    title="Building Effective AI Agents"
    description="Learn to build effective AI agents. Covers function calling, tool integration, and debugging agentic systems."
    href="https://academy.dair.ai/courses/building-effective-ai-agents"
    level="Intermediate"
    duration="5 hours"
  />

  title="Explore All Courses"
  description="Discover our full catalog of AI and prompt engineering courses. From beginners to advanced practitioners."
  href="https://academy.dair.ai/"
  buttonText="Browse Academy"
  promoCode="PROMPTING20"
/>
