---
title: Your First Test
sidebar:
  order: 1
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/tutorials/your-first-test.ipynb)

Write and run your first Giskard Checks test in under ten minutes — no API key
or LLM required.

## What you'll build

By the end of this tutorial you will have a `ScenarioResult` that shows a
passing check against a pure-Python function. This gives you the full
test-writing loop — define a scenario, run it, inspect the result — before
introducing any external services.

## Prerequisites

If you haven't installed Giskard Checks yet, see the
[Installation guide](/oss/checks/installation/) first.

## Write a function to test

You need something to test. Create a simple greeting function:

No LLM, no API calls — just a Python function that returns a predictable string.
Starting with a pure function removes all external dependencies so you can focus
entirely on the testing mechanics.

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

## Create a scenario

A `Scenario` chains together one or more interactions and checks. Each
`.interact()` call provides an input and the callable that produces the output.
Each `.check()` call asserts something about the result.

`Equals` compares the value at the trace path `trace.last.outputs` against
`expected_value`. If they match the check passes; otherwise it fails. Notice
that `trace.last.outputs` is a dot-separated path — this is how all built-in
checks address values stored in the trace, so you'll see this pattern throughout
the documentation.

```python
from giskard.checks import Scenario, Equals

scenario = (
    Scenario("greet_alice")
    .interact(
        inputs="Alice",
        outputs=lambda inputs: greet(inputs),
    )
    .check(
        Equals(
            name="correct_greeting",
            expected_value="Hello, Alice!",
            key="trace.last.outputs",
        )
    )
)
```

## Run it

### In a Jupyter notebook

Scenarios are async, so in a notebook you can `await` them directly.

```python
result = await scenario.run()
print(result.passed)  # True
```

### In a Python script

Outside a notebook there is no running event loop, so you wrap the call with
`asyncio.run`.

```python
import asyncio
from giskard.checks import Scenario, Equals


def greet(name: str) -> str:
    return f"Hello, {name}!"


scenario = (
    Scenario("greet_alice")
    .interact(
        inputs="Alice",
        outputs=lambda inputs: greet(inputs),
    )
    .check(
        Equals(
            name="correct_greeting",
            expected_value="Hello, Alice!",
            key="trace.last.outputs",
        )
    )
)

result = asyncio.run(scenario.run())
print(result.passed)  # True
```

## Read the result

`result` is a `ScenarioResult` with three useful attributes:

| Attribute                 | What it contains                                                    |
| ------------------------- | ------------------------------------------------------------------- |
| `result.passed`           | `True` if every check passed, `False` otherwise                     |
| `result.final_trace`      | The full `Trace` object with every interaction's inputs and outputs |
| `result.steps[0].results` | A list of individual `CheckResult` objects for the first step       |

Print check details to understand what passed or failed. When a scenario has
several checks, iterating over `result.steps[0].results` tells you exactly which
assertion succeeded or broke and why.

```python
for check_result in result.steps[0].results:
    status = "PASS" if check_result.passed else "FAIL"
    print(f"[{status}] {check_result.message}")
```

Expected output:

```
[PASS] correct_greeting: ...
```

## What a failing test looks like

Your function always returns the expected string, so the test always passes. To
see what a failure looks like, change `expected_value` to something that won't
match:

```python
scenario = (
    Scenario("greet_alice")
    .interact(
        inputs="Alice",
        outputs=lambda inputs: greet(inputs),
    )
    .check(
        Equals(
            name="correct_greeting",
            expected_value="Hi, Alice!",  # wrong — greet() returns "Hello, Alice!"
            key="trace.last.outputs",
        )
    )
)

result = await scenario.run()
print(result.passed)  # False
print(
    result.steps[0].results[0].message
)  # expected "Hi, Alice!" but got "Hello, Alice!"
```

Failures are descriptive — the message tells you the expected vs. actual value.

Reset `expected_value` back to `"Hello, Alice!"` before continuing.

## Next step

A real AI system is less predictable than a pure Python function — the next
tutorial shows you how to configure a generator and test an actual LLM call:

[Your First LLM Call](/oss/checks/tutorials/single-turn/)
