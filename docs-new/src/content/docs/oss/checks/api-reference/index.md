---
title: Overview
sidebar:
  order: 1
---

Complete API documentation for Giskard Checks.

<div class="toctree" maxdepth="2">

core builtin-checks scenarios testing

</div>

## Introduction

Giskard Checks provides a comprehensive API for testing and evaluating
AI applications. The library is organized into several key modules:

- **Core**: Fundamental types and base classes (Check, Trace,
  Interaction)
- **Built-in Checks**: Ready-to-use checks for common scenarios
- **Scenarios**: Multi-step workflow testing (Scenario, TestCase)
- **Testing**: Utilities for testing and debugging

## Quick Reference

**Most Common Imports**

``` python
from giskard.checks import (
    # Core types
    Check,
    CheckResult,
    CheckStatus,
    Interaction,
    Trace,

    # Interaction specs
    InteractionSpec,
    BaseInteractionSpec,

    # Scenarios
    Scenario,
    TestCase,

    # Built-in checks
    from_fn,
    StringMatching,
    Equals,
    NotEquals,
    LesserThan,
    GreaterThan,
    LesserThanEquals,
    GreaterEquals,
    Groundedness,
    Conformity,
    LLMJudge,
    SemanticSimilarity,
    BaseLLMCheck,
    LLMCheckResult,

    # Configuration
    set_default_generator,
    get_default_generator,
)
```

## Package Structure

``` text
giskard.checks/
├── core/
│   ├── check.py          # Check base class
│   ├── trace.py          # Trace and Interaction
│   ├── interaction.py    # InteractionSpec
│   ├── result.py         # CheckResult, CheckStatus
│   ├── scenario.py       # Scenario
│   ├── testcase.py       # TestCase
│   └── extraction.py     # Extractors
│
├── builtin/
│   ├── fn.py             # from_fn
│   ├── string_matching.py
│   ├── comparison.py
│   ├── groundedness.py
│   ├── conformity.py
│   ├── judge.py          # LLMJudge
│   └── semantic_similarity.py
│
├── scenarios/
│   └── runner.py         # ScenarioRunner
│
└── testing/
    ├── runner.py         # TestCaseRunner
    └── spy.py            # WithSpy
```
