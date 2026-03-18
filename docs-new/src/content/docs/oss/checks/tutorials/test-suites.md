---
title: Test Suites
sidebar:
  order: 5
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/tutorials/test-suites.ipynb)

Learn how to group multiple scenarios into a suite and run them with a single
`await`. By the end you'll have a reusable pattern for organizing related tests.

## What you'll build

A suite that holds two scenarios (greeting and error handling), runs them
together, and produces a unified pass/fail report.

## Prerequisites

- Completed [Dynamic Scenarios](/oss/checks/tutorials/dynamic-scenarios/) or
  [Multi-Turn Scenarios](/oss/checks/tutorials/multi-turn/)
- Basic `async/await` knowledge

## Define a chatbot and two scenarios

Start with a simple chatbot and the two scenarios you want to run together:

```python
from giskard.checks import Scenario, FnCheck


def chatbot(message: str) -> str:
    if not message.strip():
        return "I didn't receive a message. Could you please try again?"
    if message.lower().startswith("hello"):
        return "Hello! How can I help you today?"
    return "I'm not sure how to respond to that."


greeting_scenario = (
    Scenario("greeting")
    .interact(
        inputs="Hello there",
        outputs=lambda inputs: chatbot(inputs),
    )
    .check(
        FnCheck(fn=
            lambda trace: "Hello" in trace.last.outputs,
            name="responds_with_greeting",
        )
    )
)

error_handling_scenario = (
    Scenario("empty_input")
    .interact(
        inputs="",
        outputs=lambda inputs: chatbot(inputs),
    )
    .check(
        FnCheck(fn=
            lambda trace: "try again" in trace.last.outputs.lower(),
            name="handles_empty_input",
        )
    )
)
```

## Create a suite

Use the library's `Suite` class to group scenarios and run them together:

```python
from giskard.checks import Suite

suite = Suite(name="chatbot_suite")
suite.append(greeting_scenario)
suite.append(error_handling_scenario)
```

The suite runs scenarios serially and returns a `SuiteResult` with a unified
pass/fail summary.

## Run the suite

In a Jupyter notebook:

```python
result = await suite.run()
```

In a Python script:

```python
import asyncio

result = asyncio.run(suite.run())
```

## Inspect the results

`result` is a `SuiteResult` with `results` (list of `ScenarioResult`), `pass_rate`,
and `duration_ms`. Iterate to count pass/fail and print a report:

```python
scenarios = ["greeting", "empty_input"]
results = result.results
passed = sum(1 for r in results if r.passed)
total = len(results)

print(f"Results: {passed}/{total} passed (pass rate: {result.pass_rate:.0%})")
for name, r in zip(scenarios, results):
    status = "PASS" if r.passed else "FAIL"
    print(f"  [{status}] {name}")
```

```
Results: 2/2 passed (pass rate: 100%)
  [PASS] greeting
  [PASS] empty_input
```

When a scenario fails, use `(cr for step in r.steps for cr in step.results)` to see which check broke.

## Next step

You now know the basic suite pattern. For running suites in CI with pytest and
proper failure reporting, see [Run in pytest](/oss/checks/how-to/run-in-pytest/).

## See also

- [Run in pytest](/oss/checks/how-to/run-in-pytest/) — integrate suites into CI
  with proper failure reporting
- [Dynamic Scenarios](/oss/checks/tutorials/dynamic-scenarios/) — build
  context-aware scenarios to use inside a suite
