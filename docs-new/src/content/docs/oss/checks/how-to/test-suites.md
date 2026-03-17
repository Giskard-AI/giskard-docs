---
title: Test Suites
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/test-suites.ipynb)

For the basic suite pattern, see the
[Test Suites tutorial](/oss/checks/tutorials/test-suites/). This guide covers
advanced usage: injecting the agent through the constructor, running in pytest,
and handling partial failures in CI.

Organizing scenarios into a suite lets you run a group of related tests and
get a unified pass/fail report from a single `await`.

## Why a suite?

The library's `Suite` class holds multiple `Scenario` instances and runs them
serially. Use it when you want a single `SuiteResult` with `pass_rate` and
aggregated results. For concurrent execution, use `asyncio.gather` (see below).

## Define your scenarios and suite

Define the chatbot and build a suite with scenarios. Inject the agent through a
factory so you can swap in a different model without touching the scenario
definitions:

```python
from giskard.checks import Suite, Scenario, from_fn


def make_chatbot_suite(agent):
    suite = Suite(name="chatbot_suite")
    suite.append(
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
    suite.append(
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
    return suite
```

## Run the suite

With the suite built, running all scenarios is a single call. In a Jupyter
notebook you can `await` directly:

```python
def chatbot(message: str) -> str:
    if not message.strip():
        return "I didn't receive a message. Could you please try again?"
    if message.lower().startswith("hello"):
        return "Hello! How can I help you today?"
    return "I'm not sure how to respond to that."


result = await make_chatbot_suite(chatbot).run()
```

In a Python script:

```python
import asyncio

result = asyncio.run(make_chatbot_suite(chatbot).run())
```

## Summarise results

`result` is a `SuiteResult` with `results` (list of `ScenarioResult`), `pass_rate`,
and `duration_ms`. Iterate over `result.results` to count pass/fail and print a report:

```python
scenarios = ["greeting", "empty_input"]
results = result.results

passed = sum(1 for r in results if r.passed)
total = len(results)

print(f"\nResults: {passed}/{total} passed (pass rate: {result.pass_rate:.0%})")
print("-" * 40)

for name, r in zip(scenarios, results):
    status = "PASS" if r.passed else "FAIL"
    print(f"  [{status}] {name}")
    if not r.passed:
        for check_result in (cr for step in r.steps for cr in step.results):
            if not check_result.passed:
                print(f"         {check_result.details.get('check_name', 'Unknown')}: {check_result.message}")
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

When the suite returns, some results may have passed and others may have
failed. Inspect them individually rather than treating the whole suite as a
single pass/fail:

```python
result = await make_chatbot_suite(chatbot).run()
scenarios = ["greeting", "empty_input"]
results = result.results

for name, r in zip(scenarios, results):
    if not r.passed:
        print(f"FAIL: {name}")
        for check_result in (cr for step in r.steps for cr in step.results):
            if not check_result.passed:
                print(f"  {check_result.details.get('check_name', 'Unknown')}: {check_result.message}")
    else:
        print(f"PASS: {name}")
```

The key insight is that `r.passed` is `False` when **any** check in that
scenario failed. Use `(cr for step in r.steps for cr in step.results)` to
find the specific assertion that broke. When running in CI, raise an exception
if any scenario fails:

```python
failed = [name for name, r in zip(scenarios, results) if not r.passed]
if failed:
    raise AssertionError(f"Suite failed: {failed}")
```

## Concurrent alternative

For concurrent execution, use `asyncio.gather` with a plain class:

```python
import asyncio

class ChatbotSuite:
    def __init__(self, agent):
        self.greeting = Scenario("greeting").interact(...).check(...)
        self.error_handling = Scenario("empty_input").interact(...).check(...)

    async def run_all(self):
        return await asyncio.gather(self.greeting.run(), self.error_handling.run())

results = await ChatbotSuite(chatbot).run_all()  # list of ScenarioResult
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
