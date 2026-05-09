---
id: finetuning-gpt4o
title: Fine-Tuning with GPT-4o Models
category: applications
tags: []
sources:
  - 'https://www.promptingguide.ai/applications/finetuning-gpt4o'
scraped_from: dair-ai/Prompt-Engineering-Guide
scraped_sha: 57673726396dd94acb23bdb1e67f27c78ee85a8e
when_to_use: >-
  Use fine-tuning when you need consistent behavior at scale for a narrow task,
  such as classification, extraction, domain-specific formatting, tone control,
  or repeated adherence to specialized instructions. It is most useful after you
  have a stable dataset of high-quality examples and baseline prompting or RAG
  is not reliable enough.
when_not_to_use: >-
  Do not use fine-tuning for one-off tasks, rapidly changing requirements, or
  cases where missing knowledge should be supplied through retrieval instead. It
  can add cost, evaluation burden, and maintenance risk if your training data is
  small, noisy, biased, or likely to become outdated.
claude_notes: >-
  For Claude, first try strong prompt design with XML tags, clear rubrics,
  few-shot examples, and document-first ordering before pursuing model
  customization. Extended thinking can help with complex reasoning tasks, while
  prefilling can improve output format control without fine-tuning.
---
# Fine-Tuning with GPT-4o Models

OpenAI recently [announced](https://openai.com/index/gpt-4o-fine-tuning/) the availability of fine-tuning for its latest models, GPT-4o and GPT-4o mini. This new capability enables developers to customize the GPT-4o models for specific use cases, enhancing performance and tailoring outputs. 

## Fine-Tuning Details and Costs

Developers can now access the `GPT-4o-2024-08-06` checkpoint for fine-tuning through the dedicated [fine-tuning dashboard](https://platform.openai.com/finetune). This process allows for customization of response structure, tone, and adherence to complex, domain-specific instructions. 

The cost for fine-tuning GPT-4o is \$25 per million tokens for training and \$3.75 per million input tokens and \$15 per million output tokens for inference. This feature is exclusively available to developers on paid usage tiers.

## Free Training Tokens for Experimentation

To encourage exploration of this new feature, OpenAI is offering a limited-time promotion until September 23rd.  Developers can access 1 million free training tokens per day for GPT-4o and 2 million free training tokens per day for GPT-4o mini. This provides a good opportunity to experiment and discover innovative applications for fine-tuned models.

## Use Case: Emotion Classification

<iframe width="100%"
  height="415px"
  src="https://www.youtube.com/embed/UJ7ry7Qp2Js?si=ZU3K0ZVNfQjnlZgo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  />

In the above guide, we showcase a practical example of fine-tuning which involves training a model for emotion classification. Using a [JSONL formatted dataset](https://github.com/dair-ai/datasets/tree/main/openai) containing text samples labeled with corresponding emotions, GPT-4o mini can be fine-tuned to classify text based on emotional tone.

This demonstration highlights the potential of fine-tuning in enhancing model performance for specific tasks, achieving significant improvements in accuracy compared to standard models.

## Accessing and Evaluating Fine-Tuned Models

Once the fine-tuning process is complete, developers can access and evaluate their custom models through the OpenAI playground. The playground allows for interactive testing with various inputs and provides insights into the model's performance. For more comprehensive evaluation, developers can integrate the fine-tuned model into their applications via the OpenAI API and conduct systematic testing.

OpenAI's introduction of fine-tuning for GPT-4o models unlocks new possibilities for developers seeking to leverage the power of LLMs for specialized tasks.

Learn more about advanced methods in our new AI courses. [Join now!](https://academy.dair.ai/)
Use code PROMPTING20 to get an extra 20% off.
