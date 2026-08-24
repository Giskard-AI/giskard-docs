---
title: "Programming Benchmarks"
description: "Benchmarks that evaluate LLMs' ability to write, debug, and understand code across various programming languages and problem domains."
sidebar:
  order: 4
---

Programming benchmarks evaluate LLMs' ability to write, debug, and understand code across various programming languages and problem domains. These benchmarks test coding skills, algorithmic thinking, and software development capabilities.

## Overview

These benchmarks assess how well LLMs can:

- Generate functional code from specifications
- Debug and fix existing code
- Understand and explain code functionality
- Solve algorithmic problems
- Work with multiple programming languages
- Follow coding best practices and standards

## Key Benchmarks

### HumanEval

**Purpose**: Evaluates code generation capabilities through function completion tasks

**Description**: HumanEval presents LLMs with function signatures and docstrings, asking them to complete the function implementation. The benchmark tests the model's ability to understand requirements and generate working code.

**Key Features**:

- 164 hand-written Python problems
- Function signature and docstring as the prompt
- Unit tests for functional correctness
- pass@k scoring
- Small enough to run cheaply and often

**Use Cases**: Code generation evaluation, comparing base and instruction-tuned models, and sanity-checking a coding assistant.

**Resources**: [HumanEval dataset ↗](https://github.com/openai/human-eval) | [HumanEval Paper ↗](https://arxiv.org/abs/2107.03374)

### MBPP (Mostly Basic Python Programming)

**Purpose**: Tests basic Python programming skills and problem-solving abilities

**Description**: MBPP consists of 974 programming problems that test fundamental Python concepts, data structures, and algorithms. The benchmark evaluates both code correctness and solution efficiency.

**Key Features**:

- Around 974 short Python tasks
- Natural language problem statements
- Three test cases per problem
- Focus on basic data structures and standard library use
- Crowd-sourced and human-verified

**Use Cases**: Entry-level code generation testing, few-shot prompting experiments, and evaluating small models.

**Resources**: [MBPP dataset ↗](https://github.com/google-research/google-research/tree/master/mbpp) | [MBPP Paper ↗](https://arxiv.org/abs/2108.07732)

### CodeContests

**Purpose**: Evaluates competitive programming and algorithmic problem-solving skills

**Description**: CodeContests presents programming challenges similar to those found in competitive programming competitions. The benchmark tests an LLM's ability to solve complex algorithmic problems efficiently.

**Key Features**:

- Problems collected from competitive programming sites
- Multiple correct and incorrect reference solutions
- Extensive generated test cases to catch false positives
- Difficulty and time-limit metadata
- Solutions in several languages

**Use Cases**: Algorithmic reasoning evaluation, program synthesis research, and stress-testing solution correctness.

**Resources**: [CodeContests dataset ↗](https://github.com/deepmind/code_contests) | [CodeContests Paper ↗](https://arxiv.org/abs/2202.07917)

### SWE-bench

**Purpose**: Evaluates the ability to resolve real software engineering issues in existing repositories

**Description**: SWE-bench is built from real GitHub issues and their merged pull requests in popular Python projects. Given the issue text and the repository at the parent commit, a model must produce a patch; the patch is scored by running the project's own test suite. A human-validated subset, SWE-bench Verified, filters out problems that are underspecified or impossible to solve from the issue alone.

**Key Features**:

- Real issues and repositories rather than synthetic puzzles
- Repository-scale context, not single functions
- Evaluation by the project's existing tests
- Patch generation instead of function completion
- A human-validated subset for cleaner comparison

**Use Cases**: Coding agent evaluation, repository-level code editing research, and comparing tool-using agents on maintenance work.

**Resources**: [SWE-bench dataset ↗](https://github.com/SWE-bench/SWE-bench) | [SWE-bench Paper ↗](https://arxiv.org/abs/2310.06770)

Coding tasks are also included in other benchmarks such as BigBench, which covers various reasoning types including programming and algorithmic problem-solving.

## Reading the results

Programming benchmarks score functional correctness — whether the generated code passes the supplied tests — and nothing else. They say little about readability, efficiency, or whether the code is safe to run, and a solution that passes three test cases can still fail on inputs the tests never exercise. Because HumanEval and MBPP problems have circulated on the public web for years, high scores on them are also the ones most likely to reflect training-data contamination; repository-level benchmarks such as SWE-bench are harder to memorise but far more expensive to run. As with every benchmark in this section, a model that codes well in the abstract can still misbehave inside your application, which is what an agent-level test suite is for.

## Related Topics

- [Math Problems](/start/glossary/llm-benchmarks/math-problems)
- [Reasoning and Language Understanding](/start/glossary/llm-benchmarks/reasoning-and-language)
