---
title: Core Concepts
sidebar:
  order: 2
---

Understanding the key concepts in Giskard Checks will help you write
effective tests for your AI applications.

## Introduction

Giskard Checks is built around a few core primitives that work together:

- **Interaction**: A single turn of data exchange (inputs and outputs)
- **InteractionSpec**: A specification for generating interactions
  dynamically
- **Trace**: An immutable snapshot of all interactions in a scenario
- **Check**: A validation that runs on a trace and returns a result
- **Scenario**: A list of steps (interactions and checks) executed
  sequentially

At runtime, the flow looks like this:

1.  A Scenario is created with a sequence of steps.
2.  For each step in order:
    1.  Each InteractionSpec is resolved into a concrete Interaction.
    2.  The Interaction is appended to the Trace.
    3.  Checks run against the current Trace.
3.  Results are returned as a ScenarioResult.

## Interaction

An `Interaction` represents a single turn of data exchange with the
system under test. Interactions are computed at execution time by
resolving `InteractionSpec` objects into the trace.

**Properties:**

- `inputs`: The input to your system (string, dict, Pydantic model,
  etc.)
- `outputs`: The output from your system (any serializable type)
- `metadata`: Optional dictionary for additional context (timings, model
  info, etc.)

Interactions are **immutable**, as they represent something that has
already happened.

## InteractionSpec

An `InteractionSpec` describes *how* to generate an interaction and is
used to describe a scenario. When you call `.interact(...)` in the
fluent API, it adds an `InteractionSpec` to the scenario sequence.
Inputs and outputs can be static values or dynamic callables, and you
can mix both.

``` python
from giskard.checks import InteractionSpec
from openai import OpenAI
import random

def generate_random_question() -> str:
    return f"What is 2 + {random.randint(0, 10)}?"

def generate_answer(inputs: str) -> str:
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": inputs}],
    )
    return response.choices[0].message.content

spec = InteractionSpec(
    inputs=generate_random_question,
    outputs=generate_answer,
    metadata={
        "category": "math",
        "difficulty": "easy"
    }
)
```

Specs are resolved into interactions during scenario execution. This is
common in multi-turn scenarios, where inputs and outputs are generated
based on previous interactions. See `multi-turn` for practical examples.

## Trace

A `Trace` is an immutable snapshot of all data exchanged with the system
under test. In its simplest form, it is a list of interactions.

``` python
from giskard.checks import Trace, Interaction

trace = Trace(interactions=[
    Interaction(inputs="Hello", outputs="Hi there!"),
    Interaction(inputs="How are you?", outputs="I'm doing well, thanks!")
])
```

Traces are typically created during scenario execution by resolving each
`InteractionSpec` into a frozen interaction.

## Checks

A `Check` validates something about a trace and returns a `CheckResult`.
There's a library of built-in checks, but you can also create your own.

When referencing values in a trace, use JSONPath expressions that start
with `trace.`. The `last` property is a shortcut for `interactions[-1]`
and can be used in both JSONPath keys and Python code.

``` python
from giskard.checks import Groundedness, Trace

check = Groundedness(
     answer_key="trace.last.outputs",
     context="Giskard Checks is a testing framework for AI systems."
)
```

## Scenario

A `Scenario` is a list of steps (interactions and checks) that are
executed sequentially with a shared trace. Scenarios work for both
single-turn and multi-turn tests.

``` python
from giskard.checks import Scenario

test_scenario = (
    Scenario("test_with_checks")
    .interact(inputs="test input", outputs="test output")
    .check(check1)
    .check(check2)
)

result = await test_scenario.run()
```

:::note
The `run()` method is asynchronous. When running in a script, use `asyncio.run()`:

``` python
import asyncio

async def main():
    result = await test_scenario.run()
    return result

result = asyncio.run(main())
```

In async contexts (like pytest with `@pytest.mark.asyncio`), you can  use `await` directly.
:::
This will give us a result object with the results of the checks.

## Fluent API Mapping

The fluent API is the preferred user-facing entry point and maps
directly to the core primitives above:

- `Scenario(name)` creates a scenario builder.
- `.interact(...)` adds an `InteractionSpec` to the scenario sequence.
- `.check(...)` adds a `Check` to the scenario sequence.
- `.run()` resolves specs to interactions, builds the `Trace`, runs
  checks, and returns a `ScenarioResult`.

For example, we can test a simple conversation flow with two turns:

``` python
from giskard.checks import Scenario, Conformity

test_scenario = (
    Scenario("conversation_flow")
    .interact(inputs="Hello", outputs=generate_answer)
    .check(Conformity(key="trace.last.outputs", rule="response should be a friendly greeting"))
    .interact(inputs="Who invented the HTML?", outputs=generate_answer)
    .check(Conformity(key="trace.last.outputs", rule="response should mention Tim Berners-Lee as the inventor of HTML"))
)

# Run with asyncio.run() if in a script
import asyncio
result = await test_scenario.run()  # or: result = asyncio.run(test_scenario.run())
```

For a practical introduction to the fluent API, see [Quickstart](/oss/checks/quickstart/).
