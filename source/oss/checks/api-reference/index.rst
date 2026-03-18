=============
API Reference
=============

Complete API documentation for Giskard Checks.


Overview
--------

Giskard Checks provides a comprehensive API for testing and evaluating AI applications. The library is organized into several key modules:

* **Core**: Fundamental types and base classes (Check, Trace, Interaction)
* **Built-in Checks**: Ready-to-use checks for common scenarios
* **Scenarios**: Multi-step workflow testing (Scenario, TestCase)
* **Testing**: Utilities for testing and debugging


Quick Reference
---------------

**Most Common Imports**

.. code-block:: python

   from giskard.checks import (
       # Core types
       Check,
       CheckResult,
       CheckStatus,
       Interaction,
       Trace,
       Metric,

       # Interaction specs
       InteractionSpec,
       Interact,

       # Scenarios
       Scenario,
       ScenarioResult,
       Suite,
       SuiteResult,
       Step,
       TestCase,

       # Built-in checks
       from_fn,
       StringMatching,
       RegexMatching,
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

       # Generators
       UserSimulator,

       # Configuration
       set_default_generator,
       get_default_generator,
   )


Package Structure
-----------------

.. code-block:: text

   giskard.checks/
   ├── core/
   │   ├── check.py          # Check base class
   │   ├── interaction/      # Trace, Interaction, Interact, InteractionSpec
   │   ├── result.py         # CheckResult, CheckStatus, Metric, ScenarioResult
   │   ├── scenario.py      # Scenario, Step
   │   ├── testcase.py       # TestCase
   │   └── extraction.py     # Extractors
   │
   ├── builtin/
   │   ├── fn.py             # from_fn
   │   ├── text_matching.py  # StringMatching, RegexMatching
   │   ├── comparison.py
   │   ├── semantic_similarity.py
   │   └── ...
   │
   ├── judges/
   │   ├── groundedness.py
   │   ├── conformity.py
   │   └── judge.py          # LLMJudge
   │
   ├── generators/
   │   └── user.py           # UserSimulator
   │
   ├── scenarios/
   │   ├── suite.py          # Suite
   │   └── runner.py         # ScenarioRunner
   │
   └── testing/
       ├── runner.py         # TestCaseRunner
       └── spy.py            # WithSpy
