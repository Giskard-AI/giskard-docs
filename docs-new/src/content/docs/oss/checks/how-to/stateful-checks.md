---
title: Stateful Checks
sidebar:
  order: 10
---

Most checks are stateless — they inspect the current trace and return a result.
Stateful checks maintain internal state across multiple scenario runs, enabling
patterns like uniqueness tracking, accumulated counts, or cross-scenario
consistency validation.

Stateful checks make individual test results depend on execution order and prior
runs. Use them deliberately, and prefer trace-based state when possible.

## When to use a stateful check

Use a stateful check when you need to:

- Assert that a model **never repeats** the same output across different inputs
- **Count** how many times a particular condition occurs across a batch
- Track **accumulated context** that isn't available in a single trace

For within-scenario state (e.g. "turn 2 references turn 1"), use the trace
directly — `trace.interactions[0]` is always available without stateful checks.

## Uniqueness tracking

To get started with stateful checks, we'll implement the most common pattern:
asserting that a model never returns the same response twice across a batch of
distinct inputs. The check stores previously seen outputs in a `set` that
persists for the lifetime of the instance.

The most common use case: assert that responses are not duplicated across
scenarios.

```python
from giskard.checks import Check, CheckResult, Trace


@Check.register("uniqueness_tracker")
class UniquenessTracker(Check):
    """Fails if the same output is seen more than once across runs."""

    def __init__(self, **data):
        super().__init__(**data)
        self._seen: set[str] = set()

    async def run(self, trace: Trace) -> CheckResult:
        output = str(trace.last.outputs)

        if output in self._seen:
            return CheckResult.failure(
                message=f"Duplicate output detected: {output!r}",
                metrics={"unique_count": len(self._seen)},
            )

        self._seen.add(output)
        return CheckResult.success(
            message="Output is unique",
            metrics={"unique_count": len(self._seen)},
        )
```

Notice that the check must be a single shared instance — passing
`UniquenessTracker(name="unique_responses")` inside the loop would create a
fresh instance for every scenario and defeat the purpose. Use the **same
instance** across all scenarios so the state accumulates:

```python
import asyncio
from giskard.checks import Scenario

tracker = UniquenessTracker(name="unique_responses")


def chatbot(prompt: str) -> str:
    # Your chatbot — for this example it always returns the same string
    return "I can help with that."


scenarios = [
    Scenario(f"test_{i}")
    .interact(
        inputs=f"Question {i}",
        outputs=lambda inputs: chatbot(inputs),
    )
    .check(tracker)  # same tracker instance
    for i in range(3)
]

results = await asyncio.gather(*(s.run() for s in scenarios))

for i, result in enumerate(results):
    status = "PASS" if result.passed else "FAIL"
    print(f"[{status}] test_{i}: {result.check_results[0].message}")
```

Expected output (because all three return the same string):

```
[PASS] test_0: Output is unique
[FAIL] test_1: Duplicate output detected: 'I can help with that.'
[FAIL] test_2: Duplicate output detected: 'I can help with that.'
```

## Accumulating a count

Next, we'll build on the uniqueness pattern to count how many times a condition
occurs rather than just whether it has occurred before. This lets you set a
tolerance threshold — for example, allowing a small number of refusals in a
large dataset without failing the entire batch.

Track how many responses satisfy a condition across a batch and fail if the
count exceeds a threshold:

```python
from giskard.checks import Check, CheckResult, Trace


@Check.register("refusal_counter")
class RefusalCounter(Check):
    """Fails if the model refuses more than `max_refusals` times."""

    max_refusals: int = 2

    def __init__(self, **data):
        super().__init__(**data)
        self._refusal_count: int = 0

    async def run(self, trace: Trace) -> CheckResult:
        output = str(trace.last.outputs).lower()
        refused = any(
            kw in output for kw in ["cannot", "sorry", "i'm unable", "i can't"]
        )

        if refused:
            self._refusal_count += 1

        if self._refusal_count > self.max_refusals:
            return CheckResult.failure(
                message=(
                    f"Model has refused {self._refusal_count} times "
                    f"(max allowed: {self.max_refusals})"
                ),
                metrics={"refusal_count": self._refusal_count},
            )

        return CheckResult.success(
            message=f"Refusal count within limit ({self._refusal_count})",
            metrics={"refusal_count": self._refusal_count},
        )
```

## Reset state between test runs

With stateful checks in use, you need to be careful not to carry state from one
test session into another. A pytest fixture that constructs a fresh instance for
each test is the cleanest way to guarantee isolation.

If you run the same stateful check across multiple test sessions (e.g. in
pytest), reset state in a fixture to prevent cross-test contamination:

```python
import pytest
from giskard.checks import Scenario


@pytest.fixture
def fresh_tracker():
    return UniquenessTracker(name="unique_responses")


@pytest.mark.asyncio
async def test_no_duplicate_responses(fresh_tracker):
    inputs = ["Hello", "What time is it?", "Tell me a joke"]
    scenarios = [
        Scenario(f"test_{i}")
        .interact(
            inputs=inp,
            outputs=lambda inputs: chatbot(inputs),
        )
        .check(fresh_tracker)
        for i, inp in enumerate(inputs)
    ]

    import asyncio

    results = await asyncio.gather(*(s.run() for s in scenarios))
    assert all(r.passed for r in results), "Duplicate responses detected"
```

## Prefer trace-based state when possible

Before reaching for a stateful check, check whether you can express the
constraint using the trace. Multi-turn scenarios keep the full history, so
cross-turn assertions like "does turn 2 reference what was said in turn 1?" are
naturally captured without any external state:

```python
from giskard.checks import Scenario, from_fn

# This does NOT need a stateful check — the trace has both turns
scenario = (
    Scenario("context_retained")
    .interact(
        inputs="My name is Alice.", outputs=lambda inputs: chatbot(inputs)
    )
    .interact(inputs="What is my name?", outputs=lambda inputs: chatbot(inputs))
    .check(
        from_fn(
            lambda trace: "Alice" in trace.last.outputs,
            name="recalls_name",
        )
    )
)
```

Use stateful checks only when the constraint genuinely spans **multiple
independent scenario runs**, not multiple turns within a single scenario.

## Next steps

- [Custom Checks](/oss/checks/how-to/custom-checks/) — full check class API
- [Batch Evaluation](/oss/checks/how-to/batch-evaluation/) — run stateful
  checks across a dataset
- [Run in pytest](/oss/checks/how-to/run-in-pytest/) — fixture-based state
  reset in CI
