---
title: Core
sidebar:
  order: 2
---

Core types and base classes for building tests and checks.

<div class="currentmodule">

giskard.checks

</div>

## Check

<div class="autoclass" members="" undoc-members="" show-inheritance=""
special-members="__init__">

Check

</div>

Base class for all checks. Subclass and register with
`@Check.register("kind")` to create custom checks.

**Example:**

``` python
from giskard.checks import Check, CheckResult, Trace

@Check.register("my_check")
class MyCheck(Check):
    threshold: float = 0.8

    async def run(self, trace: Trace) -> CheckResult:
        # Your check logic
        return CheckResult.success("Check passed")
```

## CheckResult

<div class="autoclass" members="" undoc-members="" show-inheritance="">

CheckResult

</div>

Result of a check execution with status, message, and optional metrics.

**Example:**

``` python
# Success
result = CheckResult.success(
    message="Check passed",
    metrics={"score": 0.95}
)

# Failure
result = CheckResult.failure(
    message="Check failed",
    details={"reason": "threshold not met"}
)
```

## CheckStatus

<div class="autoclass" members="" undoc-members="">

CheckStatus

</div>

Enumeration of possible check statuses: `PASSED`, `FAILED`, `ERROR`.

## Interaction

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Interaction

</div>

A single exchange between inputs and outputs.

**Example:**

``` python
from giskard.checks import scenario

# Interactions are created through the fluent builder
test_case = (
    scenario("example")
    .interact(
        inputs="What is 2+2?",
        outputs="4",
        metadata={"model": "gpt-4", "tokens": 5}
    )
)
```

## Trace

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Trace

</div>

Immutable history of all interactions in a scenario.

**Example:**

``` python
from giskard.checks import scenario

# Create a scenario with multiple interactions
test_scenario = (
    scenario("example_trace")
    .interact(inputs="Hello", outputs="Hi!")
    .interact(inputs="How are you?", outputs="I'm well!")
)

# After running, access the trace
result = await test_scenario.run()
last = result.trace.last
```

## InteractionSpec

<div class="autoclass" members="" undoc-members="" show-inheritance="">

InteractionSpec

</div>

Declarative specification for generating interactions.

**Example:**

``` python
from giskard.checks import scenario

# Static values
test_case = (
    scenario("static_example")
    .interact(
        inputs="test input",
        outputs="test output"
    )
)

# Callable outputs
test_case = (
    scenario("dynamic_example")
    .interact(
        inputs="test",
        outputs=lambda inputs: my_function(inputs)
    )
)
```

## BaseInteractionSpec

<div class="autoclass" members="" undoc-members="" show-inheritance="">

BaseInteractionSpec

</div>

Base class for custom interaction specifications.

## Scenario

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Scenario

</div>

Ordered sequence of interaction specs and checks with shared trace.

**Example:**

``` python
from giskard.checks import scenario, from_fn

test_scenario = (
    scenario("test_flow")
    .interact(inputs="hello", outputs="hi")
    .check(from_fn(lambda trace: True, name="check1"))
    .interact(inputs="bye", outputs="goodbye")
)

result = await test_scenario.run()
```

## TestCase

<div class="autoclass" members="" undoc-members="" show-inheritance="">

TestCase

</div>

> [!NOTE]
> **Internal Implementation Detail**: `TestCase` is an internal
> implementation detail. Users should always use `scenario()` to create
> scenarios, which internally uses TestCase. The `scenario()` function
> creates a Scenario (a list of steps) and is the primary user-facing
> API.

**Example using scenario() (recommended):**

``` python
from giskard.checks import scenario, from_fn

test_scenario = (
    scenario("my_test")
    .interact(inputs="test", outputs="result")
    .check(from_fn(lambda trace: True, name="check1"))
    .check(from_fn(lambda trace: True, name="check2"))
)

result = await test_scenario.run()
```

## Extractors

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Extractor

</div>

Base class for extracting values from traces.

<div class="autoclass" members="" undoc-members="" show-inheritance="">

JsonPathExtractor

</div>

Extract values using JSONPath expressions.

**Example:**

``` python
from giskard.checks import JsonPathExtractor

extractor = JsonPathExtractor(key="trace.last.outputs.answer")
value = extractor.extract(trace)
```

## Configuration

<div class="autofunction">

set_default_generator

</div>

Set the default LLM generator for LLM-based checks.

**Example:**

``` python
from giskard.agents.generators import Generator
from giskard.checks import set_default_generator

set_default_generator(Generator(model="openai/gpt-5-mini"))
```

<div class="autofunction">

get_default_generator

</div>

Get the currently configured default generator.

## ScenarioRunner

<div class="autoclass" members="" undoc-members="" show-inheritance="">

ScenarioRunner

</div>

Low-level runner for executing scenarios.
