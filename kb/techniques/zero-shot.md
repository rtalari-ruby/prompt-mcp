---
id: zero-shot
title: "Zero-shot prompting"
category: technique
tags: [baseline]
sources:
  - https://www.promptingguide.ai/techniques/zeroshot
when_to_use: |
  Always start here. Tasks Claude can do from instructions alone, no
  examples needed: classification with clear categories, summarization
  to a stated length, simple extraction, translation, formatting.
when_not_to_use: |
  Tasks with implicit format, tone, or labeling rules. Tasks where
  output stability matters and varies across runs without examples.
claude_notes: |
  Modern Claude (Opus 4.7, Sonnet 4.6, Haiku 4.5) is strong zero-shot.
  Try zero-shot first; only add few-shot when output stability or
  format adherence demands it. The win: less context, faster, cheaper.
related: [few-shot, chain-of-thought]
---
# Zero-Shot Prompting

<iframe width="100%"
  height="415px"
  src="https://www.youtube.com/embed/ZTaHqdkxUMs?si=EDLjgAxuFxFcrSM3" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  />

Large language models (LLMs) today, such as GPT-3.5 Turbo, GPT-4, and Claude 3, are tuned to follow instructions and are trained on large amounts of data. Large-scale training makes these models capable of performing some tasks in a "zero-shot" manner. Zero-shot prompting means that the prompt used to interact with the model won't contain examples or demonstrations. The zero-shot prompt directly instructs the model to perform a task without any additional examples to steer it.

We tried a few zero-shot examples in the previous section. Here is one of the examples (ie., text classification) we used:

*Prompt:*
```
Classify the text into neutral, negative or positive. 

Text: I think the vacation is okay.
Sentiment:
```

*Output:*
```
Neutral
```

Note that in the prompt above we didn't provide the model with any examples of text alongside their classifications, the LLM already understands "sentiment" -- that's the zero-shot capabilities at work. 

Instruction tuning has been shown to improve zero-shot learning [Wei et al. (2022)](https://arxiv.org/pdf/2109.01652.pdf). Instruction tuning is essentially the concept of finetuning models on datasets described via instructions. Furthermore, [RLHF](https://arxiv.org/abs/1706.03741) (reinforcement learning from human feedback) has been adopted to scale instruction tuning wherein the model is aligned to better fit human preferences. This recent development powers models like ChatGPT. We will discuss all these approaches and methods in upcoming sections.

When zero-shot doesn't work, it's recommended to provide demonstrations or examples in the prompt which leads to few-shot prompting. In the next section, we demonstrate few-shot prompting.

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master zero-shot, few-shot, and advanced prompting techniques to unlock the full potential of large language models."
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
