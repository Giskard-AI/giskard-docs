---
title: "Mathematical Reasoning Benchmarks"
description: "Benchmarks that evaluate LLMs' ability to solve mathematical problems, from basic arithmetic to complex calculus and mathematical reasoning."
sidebar:
  order: 3
---

Mathematical reasoning benchmarks evaluate LLMs' ability to solve mathematical problems, from basic arithmetic to complex calculus and mathematical reasoning. These benchmarks test the model's numerical understanding, problem-solving skills, and ability to apply mathematical concepts.

## Overview

These benchmarks assess how well LLMs can:

- Perform basic arithmetic operations
- Solve algebraic equations and inequalities
- Handle calculus and advanced mathematics
- Apply mathematical reasoning to word problems
- Generate step-by-step mathematical solutions
- Verify mathematical correctness

## Key Benchmarks

### GSM8K (Grade School Math 8K)

**Purpose**: Evaluates step-by-step mathematical problem-solving abilities

**Description**: GSM8K consists of 8,500 grade school math word problems that require multi-step reasoning. The benchmark tests an LLM's ability to break down complex problems into manageable steps and arrive at correct solutions.

**Key Features**:

- 8,500 grade school word problems
- Multi-step arithmetic reasoning
- Human-written natural language solutions
- Separate train and test splits
- Answer-level scoring

**Use Cases**: Chain-of-thought evaluation, reasoning-step analysis, and comparing small models on basic quantitative reasoning.

**Resources**: [GSM8K dataset ↗](https://github.com/openai/grade-school-math) | [GSM8K Paper ↗](https://arxiv.org/abs/2110.14168)

### MATH

**Purpose**: Tests mathematical problem-solving across various difficulty levels

**Description**: The MATH benchmark covers mathematics from elementary school through high school, including algebra, geometry, calculus, and statistics. It presents problems in LaTeX format and evaluates both answer correctness and solution quality.

**Key Features**:

- 12,500 competition mathematics problems
- Five difficulty levels
- Subjects from algebra and geometry to number theory and precalculus
- LaTeX-formatted problems and worked solutions
- Full step-by-step reference solutions

**Use Cases**: Advanced mathematical reasoning evaluation, difficulty-stratified analysis, and solution-quality assessment.

**Resources**: [MATH dataset ↗](https://github.com/hendrycks/math) | [MATH Paper ↗](https://arxiv.org/pdf/2103.03874)

Mathematical reasoning tasks are also included in other benchmarks such as BigBench, which covers various reasoning types including mathematical problem-solving, and MMLU, which tests mathematical knowledge as part of its multi-subject evaluation.

## Reading the results

Math benchmarks are among the easiest to over-read. Scores are sensitive to prompting: the same model can gain many points from being asked to reason step by step, or from a self-consistency setup that samples several solutions and takes the majority answer, so two published numbers are only comparable when the evaluation setup matches. Grading is usually on the final answer alone, which means a correct result reached through faulty reasoning still counts as a pass — inspect the worked solutions, not just the score, when the reasoning is what you care about. Because these problem sets are public and widely mirrored, contamination of training data is a real risk, and a strong benchmark result does not guarantee the same accuracy on the arithmetic your own application performs.

## Related Topics

- [Reasoning and Language Understanding](/start/glossary/llm-benchmarks/reasoning-and-language)
- [Coding](/start/glossary/llm-benchmarks/coding)
- [Domain-Specific](/start/glossary/llm-benchmarks/domain-specific)
