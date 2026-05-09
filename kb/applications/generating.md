---
id: generating
title: Generating Data
category: applications
tags: []
sources:
  - 'https://www.promptingguide.ai/applications/generating'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use this when you need quick synthetic examples, seed datasets, test cases, or
  class-balanced samples for prototyping, evaluation design, or prompt
  experiments. Specify labels, counts, format, constraints, and diversity
  requirements to make outputs consistent and usable.
when_not_to_use: >-
  Do not use LLM-generated data as a substitute for validated real-world data
  when accuracy, representativeness, or regulatory compliance matters. Avoid it
  for final model training or benchmarking unless you audit, deduplicate, and
  label-check the generated examples for bias, leakage, and factual errors.
claude_notes: >-
  Claude responds well to explicit schemas and XML tags such as <format>,
  <labels>, and <constraints> for structured synthetic data generation. Put long
  source documents or label definitions before the generation instruction, and
  ask Claude to output only the requested examples if you need clean
  machine-readable data.
---
# Generating Data

LLMs have strong capabilities to generate coherent text. Using effective prompt strategies can steer the model to produce better, consistent, and more factual responses. LLMs can also be especially useful for generating data which is really useful to run all sorts of experiments and evaluations. For example, we can use it to generate quick samples for a sentiment classifier like so:

*Prompt:*
```
Produce 10 exemplars for sentiment analysis. Examples are categorized as either positive or negative. Produce 2 negative examples and 8 positive examples. Use this format for the examples:
Q: <sentence>
A: <sentiment>
```

*Output:*
```
Q: I just got the best news ever!
A: Positive

Q: We just got a raise at work!
A: Positive

Q: I'm so proud of what I accomplished today.
A: Positive

Q: I'm having the best day ever!
A: Positive

Q: I'm really looking forward to the weekend.
A: Positive

Q: I just got the best present ever!
A: Positive

Q: I'm so happy right now.
A: Positive

Q: I'm so blessed to have such an amazing family.
A: Positive

Q: The weather outside is so gloomy.
A: Negative

Q: I just got some terrible news.
A: Negative
```

This is very useful. We actually use this example for a different test in another section of the guides.

Learn more about advanced prompting methods in our new AI courses. [Join now!](https://academy.dair.ai/)
Use code PROMPTING20 to get an extra 20% off.
