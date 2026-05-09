---
id: graph-prompting
title: GraphPrompts
category: techniques
tags: []
sources:
  - 'https://www.promptingguide.ai/techniques/graph'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use GraphPrompts when working with graph-structured data such as nodes, edges,
  molecular graphs, knowledge graphs, or social networks and you want a
  prompt-based way to adapt a model to downstream graph tasks. It is most
  relevant for graph ML settings like node classification, link prediction, or
  graph classification where structure matters.
when_not_to_use: >-
  Do not use it for ordinary text-only prompting tasks where there is no
  meaningful graph structure. It may be unnecessary overhead if a simpler GNN,
  retrieval method, or direct natural-language prompt is sufficient.
claude_notes: >-
  For Claude, serialize graph inputs clearly using XML tags or structured
  formats such as adjacency lists, edge tables, or JSON. Put graph data before
  the task instructions when the graph is long, and ask Claude to reason over
  explicit nodes, edges, and labels rather than inferring hidden structure.
---
# GraphPrompts

[Liu et al., 2023](https://arxiv.org/abs/2302.08043) introduces GraphPrompt, a new prompting framework for graphs to improve performance on downstream tasks.

More coming soon!

<CoursesSection title="Related Learning">
    tag="Course"
    tagColor="blue"
    title="Prompt Engineering for LLMs"
    description="Master graph prompting and advanced techniques for specialized domains."
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
