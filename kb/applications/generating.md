---
id: generating
title: "Generating Data"
category: applications
tags: []
sources:
  - https://www.promptingguide.ai/applications/generating
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: TODO (run scripts/enrich-kb.ts to fill)
when_not_to_use: TODO
claude_notes: TODO
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
