---
id: automatic-reasoning-and-tool-use
title: Automatic Reasoning and Tool-use (ART)
category: techniques
tags: []
sources:
  - 'https://www.promptingguide.ai/techniques/art'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use ART for complex, multi-step tasks where the model must decide when to
  reason, decompose the problem, and call external tools such as search,
  calculators, code execution, or APIs. It is especially useful when you have a
  reusable library of task demonstrations and tool examples that can be
  retrieved for new tasks.
when_not_to_use: >-
  Avoid ART for simple single-step tasks where tool orchestration adds
  unnecessary latency, cost, and failure modes. Do not use it when tool outputs
  are unreliable, unsafe, or unavailable, or when you cannot constrain and
  validate the model's tool calls.
claude_notes: >-
  For Claude, define tools with structured tool/function calling where possible,
  and place task libraries, tool descriptions, and demonstrations in clear XML
  sections such as <tools>, <examples>, and <task>. For difficult
  decompositions, extended thinking can help Claude plan tool use before acting,
  while keeping tool outputs clearly separated from user instructions to reduce
  prompt-injection risk.
---
# Automatic Reasoning and Tool-use (ART)

Combining CoT prompting and tools in an interleaved manner has shown to be a strong and robust approach to address many tasks with LLMs. These approaches typically require hand-crafting task-specific demonstrations and carefully scripted interleaving of model generations with tool use. [Paranjape et al., (2023)](https://arxiv.org/abs/2303.09014) propose a new framework that uses a frozen LLM to automatically generate intermediate reasoning steps as a program.

ART works as follows:
- given a new task, it select demonstrations of multi-step reasoning and tool use from a task library 
- at test time, it pauses generation whenever external tools are called, and integrate their output before resuming generation

ART encourages the model to generalize from demonstrations to decompose a new task and
use tools in appropriate places, in a zero-shot fashion. In addition, ART is extensible as it also enables humans to fix mistakes in the reasoning steps or add new tools by simply updating the task and tool libraries. The process is demonstrated below:

Image Source: [Paranjape et al., (2023)](https://arxiv.org/abs/2303.09014)

ART substantially improves over few-shot prompting and automatic CoT on unseen tasks in the BigBench and MMLU benchmarks, and exceeds performance of hand-crafted CoT prompts when human feedback is incorporated. 

Below is a table demonstrating ART's performance on BigBench and MMLU tasks:

Image Source: [Paranjape et al., (2023)](https://arxiv.org/abs/2303.09014)

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master tool-use prompting, reasoning chains, and advanced techniques for complex tasks."
    href="https://academy.dair.ai/courses/introduction-prompt-engineering"
    level="Beginner"
    duration="2 hours"
  />
    tag="Course"
    tagColor="purple"
    title="Building Effective AI Agents"
    description="Learn to build effective AI agents with tool integration. Covers function calling and agentic systems."
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
