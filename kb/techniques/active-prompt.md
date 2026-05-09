---
id: active-prompt
title: Active-Prompt
category: techniques
tags: []
sources:
  - 'https://www.promptingguide.ai/techniques/activeprompt'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use Active-Prompt when you have a pool of task-specific questions, a budget
  for human annotation, and need better few-shot chain-of-thought exemplars than
  generic examples. It is most useful for high-value tasks where selecting the
  right examples can materially improve accuracy.
when_not_to_use: >-
  Do not use it for one-off prompts, tasks without an unlabeled question pool,
  or situations where human annotation is unavailable. It may be unnecessary
  overhead when a strong zero-shot or simple few-shot prompt already performs
  well.
claude_notes: >-
  Use XML tags to separate candidate questions, sampled answers, uncertainty
  scores, and final annotated exemplars. For Claude, place long task documents
  or datasets before instructions, and ask for concise reasoning summaries
  rather than full hidden chain-of-thought unless extended thinking is
  explicitly needed.
---
# Active-Prompt

Chain-of-thought (CoT) methods rely on a fixed set of human-annotated exemplars. The problem with this is that the exemplars might not be the most effective examples for the different tasks. To address this, [Diao et al., (2023)](https://arxiv.org/pdf/2302.12246.pdf) recently proposed a new prompting approach called Active-Prompt to adapt LLMs to different task-specific example prompts (annotated with human-designed CoT reasoning).

Below is an illustration of the approach. The first step is to query the LLM with or without a few CoT examples. *k* possible answers are generated for a set of training questions. An uncertainty metric is calculated based on the *k* answers (disagreement used). The most uncertain questions are selected for annotation by humans. The new annotated exemplars are then used to infer each question. 

Image Source: [Diao et al., (2023)](https://arxiv.org/pdf/2302.12246.pdf)

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master Active-Prompt, chain-of-thought, and advanced prompting techniques for better LLM performance."
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
