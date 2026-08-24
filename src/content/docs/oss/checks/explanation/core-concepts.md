---
title: Core Concepts
description: "The key primitives of Giskard Checks — Interaction, Trace, Check, and Scenario — and how they work together at runtime."
sidebar:
  order: 1
---

Giskard Checks is built around a few core primitives that work together:

- **Interaction**: A single turn of data exchange (inputs and outputs)
- **InteractionSpec**: A specification for generating interactions dynamically
- **Trace**: An immutable snapshot of all interactions in a scenario
- **Check**: A validation that runs on a trace and returns a result
- **Step**: A group of interaction specs followed by the checks that validate them
- **Scenario**: A list of steps executed sequentially against one shared trace

At runtime, the flow looks like this:

1.  A Scenario is created with a sequence of steps.
2.  For each step in order:
    1.  Every InteractionSpec in the step is driven as an async generator and
        appends **one or more** Interactions to the Trace. A single spec can
        yield several turns: a `UserSimulator` or an `LLMGenerator` produces up
        to `max_steps` messages before it stops.
    2.  Once every spec in the step has finished, each check in that step runs
        against the resulting Trace.
3.  If the step does not pass — a FAIL, an ERROR, or every check skipped —
    execution stops there. Every remaining step is still reported, with each of
    its checks marked SKIP and the message
    `Step N was skipped due to previous failure`.
4.  Results are returned as a ScenarioResult, one `TestCaseResult` per step.

The fluent API decides where the step boundaries are: `.check()` after
`.interact()` adds to the checks of the current step, and the next `.interact()`
opens a new step.

## Interaction

An `Interaction` represents a single turn of data exchange with the system under test. Interactions are computed at execution time by resolving `InteractionSpec` objects into the trace.

**Properties:**

- `inputs`: The input to your system (string, dict, Pydantic model, etc.)
- `outputs`: The output from your system (any serializable type)
- `metadata`: Optional dictionary for additional context (timings, model info, etc.)

Interactions are **immutable**, as they represent something that has already happened.

## InteractionSpec

An `InteractionSpec` describes _how_ to generate an interaction and is used to describe a scenario. When you call `.interact(...)` in the fluent API, it adds an interaction spec to the scenario sequence. Inputs and outputs can be static values or dynamic callables, and you can mix both.

`InteractionSpec` is the abstract base class. `Interact` is the main spec used by `.interact()`. Other subclasses generate interactions differently.

<!-- pyright-skip: schematic: generate_question and call_my_agent stand in for the reader's own callables -->

```python
from giskard.checks import Interact

spec = Interact(
    inputs=generate_question,  # value, callable, or input generator
    outputs=call_my_agent,  # value or callable, or MISSING to use the target
    metadata={"category": "math"},
)
```

A spec is not a single interaction. It is driven as an async generator during execution and can append several interactions to the trace before it stops, which is what makes multi-turn conversations possible from one `.interact()` call. See [Multi-Turn Scenarios](/oss/checks/tutorials/multi-turn) for practical examples.

## Trace

A `Trace` is an immutable snapshot of all data exchanged with the system under test. In its simplest form, it is a list of interactions.

```python
from giskard.checks import Trace, Interaction

trace = Trace(
    interactions=[
        Interaction(inputs="Hello", outputs="Hi there!"),
        Interaction(inputs="How are you?", outputs="I'm doing well, thanks!"),
    ]
)
```

Traces are typically created during scenario execution by resolving each `InteractionSpec` into a frozen interaction.

Each trace also carries optional **`annotations`**: a dictionary of scenario-level metadata (for example tenant id or experiment name). When you build a scenario, pass `annotations={...}`; the runner copies them onto the initial trace so checks and callables can read `trace.annotations` without attaching the same data to every interaction.

For a **custom trace type**, subclass `Trace` and pass `trace_type=YourTrace` on `Scenario`. `Trace` is a frozen Pydantic model, so the subclass must pass `frozen=True`. Use this when you want extra computed fields, helpers, or custom Rich rendering for the conversation history. See [Custom trace types](/oss/checks/how-to/custom-trace).

```python
from giskard.checks import Scenario, Trace


class MyTrace(Trace[str, str], frozen=True):
    pass


scenario = Scenario(
    "with_custom_trace",
    trace_type=MyTrace,
    annotations={"tenant": "acme"},
)
```

## Checks

A `Check` validates something about a trace and returns a `CheckResult`. Checks run once per **step**, after every interaction spec in that step has been applied, and can inspect any part of the trace — including outputs from earlier turns. When a step's spec generates several turns, the checks see only the trace as it stands after the last of them.

When referencing values in a trace, use JSONPath expressions that start with `trace.`. The `last` property is a shortcut for `interactions[-1]` and can be used in both JSONPath keys and Python code.

### Built-in check categories

Giskard provides several families of checks:

- **Rule-based** — `Equals`, `StringMatching`, `FnCheck`: exact values, keywords, or custom predicates. Fast, free, deterministic.
- **Semantic similarity** — `SemanticSimilarity`: compare meaning rather than exact text. Uses embeddings; good when phrasing varies.
- **LLM-as-judge** — `Groundedness`, `Conformity`, `LLMJudge`: qualitative evaluation (tone, policy compliance, reasoning). Uses an LLM call; more flexible but slower and non-deterministic.

For guidance on choosing the right check, see [When to Use Which Check](/oss/checks/explanation/when-to-use-which-check). For the full API, see the [Checks reference](/oss/checks/reference/checks). To build your own validation logic, see [Custom Checks](/oss/checks/how-to/custom-checks).

```python
from giskard.checks import Groundedness

check = Groundedness(
    target_key="trace.last.outputs",
    context="Giskard Checks is a testing framework for AI systems.",
)
```

## Scenario

A `Scenario` is a list of steps (interactions and checks) that are executed sequentially with a shared trace. Scenarios work for both single-turn and multi-turn tests.

```python
from giskard.checks import Equals, Scenario, StringMatching

check1 = Equals(expected_value="test output", target_key="trace.last.outputs")
check2 = StringMatching(keyword="output", target_key="trace.last.outputs")

test_scenario = (
    Scenario("test_with_checks")
    .interact(inputs="test input", outputs="test output")
    .check(check1)
    .check(check2)
)

result = await test_scenario.run()
```

`run()` is asynchronous. See [Async design & pytest](/oss/checks/explanation/async-and-pytest) for how to await it from a script, from pytest, and from a notebook.

## Fluent API mapping

The fluent API is the preferred user-facing entry point and maps directly to the core primitives above:

- `Scenario(name)` creates a scenario builder.
- `.interact(...)` adds an `InteractionSpec` to the current step, opening a new step if the current one already has checks.
- `.check(...)` adds a `Check` to the current step.
- `.run()` drives the specs, builds the `Trace`, runs the checks of each step, and returns a `ScenarioResult`.

The example above therefore has one step: two checks over a single interaction. Adding a second `.interact()` after `.check(check1)` would make two steps, and a failure in the first would leave the second reported as SKIP.

For a practical introduction to the fluent API, see [Quickstart](/oss/checks/quickstart).
