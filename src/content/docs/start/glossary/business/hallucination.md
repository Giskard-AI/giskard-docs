---
title: "Hallucination & Misinformation"
description: "Learn about LLM hallucination vulnerabilities and how to detect and prevent models from generating false or misleading information."
sidebar:
  order: 5
---

Hallucination is one of the most critical vulnerabilities affecting Large Language Models. It occurs when a model generates false, misleading, or fabricated information that appears plausible but is incorrect.

## What are Hallucinations?

**Hallucination** refers to the phenomenon where an LLM generates content that:

- Sounds convincing and authoritative
- Is factually incorrect or fabricated
- May mix real information with false details
- Can be difficult to detect without domain expertise

This vulnerability is particularly dangerous because the generated content often appears credible and can mislead users who trust the AI system.

## Types of Hallucination

**Factual Hallucination**

Models inventing facts, dates, statistics, or events that never occurred.

**Source Hallucination**

Models claiming to reference sources that don't exist or misattributing information.

**Context Hallucination**

Models misunderstanding context and providing inappropriate or irrelevant responses.

**Logical Hallucination**

Models making logical errors or drawing incorrect conclusions from given information.

## Business Impact

Hallucination can have severe business consequences:

- **Customer Trust**: Users lose confidence in AI-powered services
- **Legal Risk**: False information could lead to compliance issues
- **Operational Errors**: Incorrect information affecting business decisions
- **Brand Damage**: Reputation harm from spreading misinformation

## Test Hallucination with Giskard

Giskard provides comprehensive tools to test and prevent hallucination vulnerabilities. You can use either the Hub UI or the Python SDK to create test datasets and run evaluations.

- [Hub UI - Business Dataset Creation](/hub/ui/datasets/knowledge-base): Use the Hub interface to generate document-based test cases for hallucination detection. The UI automatically generates queries based on your knowledge base and evaluates responses for factual accuracy.
- [Annotate test cases with test rules](/hub/ui/annotate/overview): Annotate test cases with test rules to help the model understand the business boundaries.

**Using Giskard Metrics for Hallucination Testing**

Giskard provides built-in evaluation checks that are essential for detecting hallucination:

- **Correctness Checks**: Verify that model responses match expected reference answers
- **Groundedness Checks**: Ensure responses are based on provided context and knowledge base
- **Semantic Similarity**: Compare responses against verified information to detect deviations
- **Source Validation**: Check if cited sources exist and contain the claimed information

These metrics help quantify how well your models provide accurate, grounded responses and avoid generating false or misleading information.

## Examples of Hallucination & Misinformation in AI

:::tip
You can find examples of business vulnerabilities in our [RealPerformance dataset ↗](https://realperformance.giskard.ai/?taxonomy=Omission%2CAddition+of+information%2CContradiction).
:::

**Example 1: Invented Facts**

_User Query_: "What was the population of Paris in 2020?"
_Model Response_: "The population of Paris in 2020 was approximately 2.2 million people."
_Reality_: The actual population was closer to 2.1 million.

**Example 2: Fake Sources**

_User Query_: "What does the latest IPCC report say about renewable energy costs?"
_Model Response_: "According to the IPCC's 2024 Special Report on Renewable Energy, solar costs have decreased by 89% since 2010."
_Reality_: No such IPCC report exists.

**Example 3: Logical Errors**

_User Query_: "If a company's revenue increased by 20% and costs decreased by 10%, what happened to profit?"
_Model Response_: "Profit increased by 30% because 20% + 10% = 30%."
_Reality_: This calculation is mathematically incorrect.
