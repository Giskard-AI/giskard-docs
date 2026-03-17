---
title: Test Suites
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/test-suites.ipynb)

For the basic suite pattern, see the
[Test Suites tutorial](/oss/checks/tutorials/test-suites/). This guide covers
advanced usage: injecting the agent through the constructor, running in pytest,
and handling partial failures in CI.

Organizing scenarios into a suite class lets you run a group of related tests
concurrently and get a unified pass/fail report from a single `await`.

## Why a suite?

A suite is a plain Python class that holds multiple `Scenario` instances and
runs them with `asyncio.gather`. There is no special `Suite` class to import —
the pattern is just idiomatic Python. The benefit is that all scenarios run
concurrently and you get a unified pass/fail report.

## Define your scenarios

Before building the suite class, define the chatbot and the scenarios it will
cover. Inject the agent through the constructor so you can swap in a different
model version without touching the scenario definitions:

```python
import asyncio
from giskard.checks import Scenario, from_fn


class ChatbotSuite:
    def __init__(self, agent):
        self.greeting = (
            Scenario("greeting")
            .interact(
                inputs="Hello there",
                outputs=lambda inputs: agent(inputs),
            )
            .check(
                from_fn(
                    lambda trace: "Hello" in trace.last.outputs,
                    name="responds_with_greeting",
                )
            )
        )
        self.error_handling = (
            Scenario("empty_input")
            .interact(
                inputs="",
                outputs=lambda inputs: agent(inputs),
            )
            .check(
                from_fn(
                    lambda trace: "try again" in trace.last.outputs.lower(),
                    name="handles_empty_input",
                )
            )
        )

    async def run_all(self):
        return await asyncio.gather(
            self.greeting.run(),
            self.error_handling.run(),
        )
```

`asyncio.gather` runs both scenarios concurrently and returns a list of
`ScenarioResult` objects in the same order as the arguments.

## Run the suite

With the suite class defined, running all scenarios is a single call. In a
Jupyter notebook you can `await` directly:

```python
def chatbot(message: str) -> str:
    if not message.strip():
        return "I didn't receive a message. Could you please try again?"
    if message.lower().startswith("hello"):
        return "Hello! How can I help you today?"
    return "I'm not sure how to respond to that."


results = await ChatbotSuite(chatbot).run_all()
```

In a Python script:

```python
import asyncio

results = asyncio.run(ChatbotSuite(chatbot).run_all())
```

## Summarise results

`results` is a plain list, so you can process it with standard Python. Iterate
over the results list to count pass/fail and print a report — the `zip` keeps
scenario names and results aligned because `asyncio.gather` preserves argument
order:

```python
scenarios = ["greeting", "empty_input"]

passed = sum(1 for r in results if r.passed)
total = len(results)

print(f"\nResults: {passed}/{total} passed")
print("-" * 40)

for name, result in zip(scenarios, results):
    status = "PASS" if result.passed else "FAIL"
    print(f"  [{status}] {name}")
    if not result.passed:
        for check_result in result.check_results:
            if not check_result.passed:
                print(f"         {check_result.name}: {check_result.message}")
```

Example output:

```
Results: 2/2 passed
----------------------------------------
  [PASS] greeting
  [PASS] empty_input
```

Notice that individual check messages appear only for failing scenarios, keeping
the output concise when everything is healthy but giving you the detail you need
when something breaks.

## Handling partial failures

When `asyncio.gather` returns, some results may have passed and others may have
failed. Inspect them individually rather than treating the whole suite as a
single pass/fail:

```python
results = await ChatbotSuite(chatbot).run_all()
scenarios = ["greeting", "empty_input"]

for name, result in zip(scenarios, results):
    if not result.passed:
        print(f"FAIL: {name}")
        for check_result in result.check_results:
            if not check_result.passed:
                print(f"  {check_result.name}: {check_result.message}")
    else:
        print(f"PASS: {name}")
```

The key insight is that `result.passed` is `False` when **any** check in that
scenario failed. Use `result.check_results` to find the specific assertion that
broke. When running in CI, you can raise an exception if any scenario fails:

```python
failed = [name for name, r in zip(scenarios, results) if not r.passed]
if failed:
    raise AssertionError(f"Suite failed: {failed}")
```

## Next step

The suite pattern works in any Python script or notebook. To run it in CI with
pytest and get proper failure reporting, see:

[Run in pytest](/oss/checks/how-to/run-in-pytest/)

## See also

- [Async and pytest](/oss/checks/explanation/async-and-pytest/) — why scenarios
  are async and how pytest handles them
- [Dynamic Scenarios](/oss/checks/tutorials/dynamic-scenarios/) — build
  context-aware scenarios to use inside a suite
