---
title: Test Suites
sidebar:
  order: 5
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/tutorials/test-suites.ipynb)

Learn how to group multiple scenarios into a suite class and run them
concurrently with a single `await`. By the end you'll have a reusable pattern
for organizing related tests.

## What you'll build

A suite class that holds two scenarios (greeting and error handling), runs them
with `asyncio.gather`, and produces a unified pass/fail report.

## Prerequisites

- Completed [Dynamic Scenarios](/oss/checks/tutorials/dynamic-scenarios/) or
  [Multi-Turn Scenarios](/oss/checks/tutorials/multi-turn/)
- Basic `async/await` knowledge

## Define a chatbot and two scenarios

Start with a simple chatbot and the two scenarios you want to run together:

```python
from giskard.checks import Scenario, from_fn


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
        from_fn(
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
        from_fn(
            lambda trace: "try again" in trace.last.outputs.lower(),
            name="handles_empty_input",
        )
    )
)
```

## Create a suite class

A suite is a plain Python class that holds scenarios and runs them with
`asyncio.gather`. There is no special `Suite` class — the pattern is idiomatic
Python:

```python
import asyncio


class ChatbotSuite:
    def __init__(self):
        self.greeting = greeting_scenario
        self.error_handling = error_handling_scenario

    async def run_all(self):
        return await asyncio.gather(
            self.greeting.run(),
            self.error_handling.run(),
        )
```

`asyncio.gather` runs both scenarios concurrently and returns a list of
`ScenarioResult` objects in the same order as the arguments.

## Run the suite

In a Jupyter notebook:

```python
results = await ChatbotSuite().run_all()
```

In a Python script:

```python
import asyncio

results = asyncio.run(ChatbotSuite().run_all())
```

## Inspect the results

`results` is a list of `ScenarioResult` objects. Iterate to count pass/fail and
print a report:

```python
scenarios = ["greeting", "empty_input"]
passed = sum(1 for r in results if r.passed)
total = len(results)

print(f"Results: {passed}/{total} passed")
for name, result in zip(scenarios, results):
    status = "PASS" if result.passed else "FAIL"
    print(f"  [{status}] {name}")
```

When a scenario fails, use `result.check_results` to see which check broke.

## Next step

You now know the basic suite pattern. For advanced usage — injecting the agent
through the constructor, running in pytest, or handling partial failures in CI —
see [Test Suites](/oss/checks/how-to/test-suites/) in the how-to guides.

## See also

- [Run in pytest](/oss/checks/how-to/run-in-pytest/) — integrate suites into CI
  with proper failure reporting
- [Dynamic Scenarios](/oss/checks/tutorials/dynamic-scenarios/) — build
  context-aware scenarios to use inside a suite
