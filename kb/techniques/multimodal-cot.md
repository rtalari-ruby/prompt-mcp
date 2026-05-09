---
id: multimodal-cot
title: Multimodal CoT Prompting
category: techniques
tags: []
sources:
  - 'https://www.promptingguide.ai/techniques/multimodalcot'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use multimodal CoT when a task requires reasoning over both images and text,
  such as visual science questions, chart interpretation, diagrams, screenshots,
  or document images. It is especially useful when intermediate visual
  observations can improve answer accuracy.
when_not_to_use: >-
  Do not use it for simple image labeling, OCR-only tasks, or straightforward
  questions where a direct answer is sufficient. Avoid it when latency, cost, or
  verbosity matter more than reasoning quality, or when generated rationales
  could amplify visual misinterpretations.
claude_notes: >-
  With Claude, provide the image or document before the question and ask for key
  visual evidence plus a concise answer rather than full hidden
  chain-of-thought. XML tags can separate <image_context>, <question>, and
  <answer_format>; for hard visual reasoning, consider extended thinking if
  available.
---
# Multimodal CoT Prompting

[Zhang et al. (2023)](https://arxiv.org/abs/2302.00923) recently proposed a multimodal chain-of-thought prompting approach. Traditional CoT focuses on the language modality. In contrast, Multimodal CoT incorporates text and vision into a two-stage framework. The first step involves rationale generation based on multimodal information. This is followed by the second phase, answer inference, which leverages the informative generated rationales.

The multimodal CoT model (1B) outperforms GPT-3.5 on the ScienceQA benchmark.

Image Source: [Zhang et al. (2023)](https://arxiv.org/abs/2302.00923)

Further reading:
- [Language Is Not All You Need: Aligning Perception with Language Models](https://arxiv.org/abs/2302.14045) (Feb 2023)

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master multimodal prompting, chain-of-thought, and advanced reasoning techniques."
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
