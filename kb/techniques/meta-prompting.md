---
id: meta-prompting
title: Meta Prompting
category: techniques
tags: []
sources:
  - 'https://www.promptingguide.ai/techniques/meta-prompting'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use meta prompting when the task benefits from a reusable structure, solution
  pattern, or reasoning template rather than domain-specific examples. It is
  especially useful for math, coding, theoretical reasoning, and other complex
  tasks where you want zero-shot or token-efficient guidance.
when_not_to_use: >-
  Avoid it when the model lacks the underlying domain knowledge needed to solve
  the task, since structure alone will not supply missing facts. It can also be
  unnecessary overhead for simple requests or harmful for novel tasks where
  concrete examples are more important than abstract templates.
claude_notes: >-
  Claude responds well to meta prompts written with clear XML sections such as
  <task>, <structure>, <constraints>, and <output_format>. For complex
  reasoning, consider asking Claude to use extended thinking internally and
  provide only the final structured answer; you can also prefill the desired
  response skeleton when strict formatting matters.
---
# Meta Prompting

## Introduction

Meta Prompting is an advanced prompting technique that focuses on the structural and syntactical aspects of tasks and problems rather than their specific content details. This goal with meta prompting is to construct a more abstract, structured way of interacting with large language models (LLMs), emphasizing the form and pattern of information over traditional content-centric methods.

## Key Characteristics

According to [Zhang et al. (2024)](https://arxiv.org/abs/2311.11482), the key characteristics of meta prompting can be summarized as follows:

**1. Structure-oriented**: Prioritizes the format and pattern of problems and solutions over specific content.

**2. Syntax-focused**: Uses syntax as a guiding template for the expected response or solution.

**3. Abstract examples**: Employs abstracted examples as frameworks, illustrating the structure of problems and solutions without focusing on specific details.

**4. Versatile**: Applicable across various domains, capable of providing structured responses to a wide range of problems.

**5. Categorical approach**: Draws from type theory to emphasize the categorization and logical arrangement of components in a prompt.

## Advantages over Few-Shot Prompting

[Zhang et al., 2024](https://arxiv.org/abs/2311.11482) report that meta prompting and few-shot prompting are different in that it meta prompting focuses on a more structure-oriented approach as opposed to a content-driven approach which few-shot prompting emphasizes. 

The following example obtained from [Zhang et al. (2024)](https://arxiv.org/abs/2311.11482) demonstrates the difference between a structured meta prompt and a few-shot prompt for solving problems from the MATH benchmark:

!["Meta Prompting"](../../img/techniques/meta-prompting.png)

The advantages of Meta Prompting over few-shot promoting include:

**1. Token efficiency**: Reduces the number of tokens required by focusing on structure rather than detailed content.

**2. Fair comparison**: Provides a more fair approach for comparing different problem-solving models by minimizing the influence of specific examples.

**3. Zero-shot efficacy**: Can be viewed as a form of zero-shot prompting, where the influence of specific examples is minimized.

## Applications

By focusing on the structural patterns of problem-solving, Meta Prompting offers a clear roadmap for navigating complex topics, enhancing the reasoning capabilities of LLMs across various domains.

It's important to note that meta prompting also assumes that the LLM has innate knowledge about the specific task or problem being addressed. As LLMs can generalize to a unseen tasks, it is possible that they can be leveraged with meta prompting but performance might deteriorate with more unique and novel tasks as is the case with zero-shot prompting. 

Applications where meta prompting can be beneficial include but not limited to complex reasoning tasks, mathematical problem-solving, coding challenges, theoretical queries.

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master meta prompting, structure-oriented techniques, and advanced methods for complex reasoning."
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
