---
title: Batch Evaluation
sidebar:
  order: 9
---

Batch evaluation runs the same scenario pattern across many inputs and
aggregates the results into a pass/fail summary. Use it to evaluate a dataset of
test cases, measure regression coverage, or compare outputs across prompt
variants.

## The pattern

To get started, we'll implement the core batch loop. The key insight is that
`asyncio.gather` submits all scenarios simultaneously, so the total runtime
scales with the slowest single call rather than the number of test cases —
critical when each interaction involves an LLM.

Define your test cases as a list of `(input, expected)` pairs, create a scenario
for each pair, run them all concurrently with `asyncio.gather`, then summarise:

```python
import asyncio
from giskard.checks import Scenario, StringMatching

test_cases = [
    ("How long do we retain KYC records?", "5 years"),
    ("Can we share customer data with third parties?", "only with consent"),
    ("Is medical advice allowed in the chatbot?", "no"),
]


def my_qa_system(question: str) -> str:
    # Your QA system
    return "..."


async def run_batch():
    scenarios = [
        (
            question,
            Scenario(f"qa_{i}")
            .interact(
                inputs=question,
                outputs=lambda inputs, q=question: my_qa_system(q),
            )
            .check(
                StringMatching(
                    name="contains_expected",
                    keyword=expected,
                    text_key="trace.last.outputs",
                )
            ),
        )
        for i, (question, expected) in enumerate(test_cases)
    ]

    results = await asyncio.gather(*(s.run() for _, s in scenarios))

    passed = sum(1 for r in results if r.passed)
    total = len(results)
    print(f"Passed: {passed}/{total} ({passed / total * 100:.1f}%)")

    for (question, _), result in zip(scenarios, results):
        if not result.passed:
            print(f"  FAIL: {question}")
            for cr in result.check_results:
                if not cr.passed:
                    print(f"    {cr.name}: {cr.message}")

    return results


results = await run_batch()
```

## Parameterised batch with pytest

The `asyncio.gather` approach above gives you aggregate pass/fail counts, but a
CI pipeline benefits from individual failure markers. Next, we'll convert the
same test cases into a parametrized pytest function so each input gets its own
entry in the test report.

To get per-test failure reporting in CI, use `@pytest.mark.parametrize`:

```python
import pytest
from giskard.checks import Scenario, StringMatching

QA_CASES = [
    ("How long do we retain KYC records?", "5 years"),
    ("Can we share customer data with third parties?", "only with consent"),
    ("Is medical advice allowed in the chatbot?", "no"),
]


@pytest.mark.asyncio
@pytest.mark.parametrize("question,expected", QA_CASES)
async def test_qa_batch(question, expected):
    tc = (
        Scenario(f"qa_{question[:20]}")
        .interact(
            inputs=question,
            outputs=lambda inputs: my_qa_system(inputs),
        )
        .check(
            StringMatching(
                name="contains_expected",
                keyword=expected,
                text_key="trace.last.outputs",
            )
        )
    )
    result = await tc.run()
    assert result.passed, f"Failed for: {question!r}"
```

Each parameterised case appears as a separate test item in the pytest output, so
failures are easy to identify.

## Batch with LLM-based checks

With the basic batch loop established, we can now swap in an `LLMJudge` check.
The generator is configured once before the loop; every scenario created inside
it reuses that single configuration, so you aren't reinitializing a client on
every iteration.

LLM-based checks work in batch too. Set a default generator once before the
loop:

```python
import asyncio
from giskard.agents.generators import Generator
from giskard.checks import Scenario, LLMJudge, set_default_generator

set_default_generator(Generator(model="openai/gpt-5-mini"))

summarisation_cases = [
    "The new policy requires all employees to complete security training annually.",
    "The quarterly report shows a 12% increase in revenue compared to last year.",
    "Our refund policy allows returns within 30 days of purchase with a receipt.",
]


def summarise(text: str) -> str:
    # Your summarisation system
    return f"Summary of: {text[:40]}..."


async def run_summarisation_batch():
    scenarios = [
        Scenario(f"summary_{i}")
        .interact(
            inputs=text,
            outputs=lambda inputs, t=text: summarise(t),
        )
        .check(
            LLMJudge(
                name="factual_consistency",
                prompt="""
                Check if the summary is factually consistent with the original.

                Original: {{ trace.last.inputs }}
                Summary: {{ trace.last.outputs }}

                Return 'passed: true' if the summary contains no factual errors.
                """,
            )
        )
        for i, text in enumerate(summarisation_cases)
    ]

    results = await asyncio.gather(*(s.run() for s in scenarios))

    passed = sum(1 for r in results if r.passed)
    print(f"Factual consistency: {passed}/{len(results)} passed")
    return results


results = await run_summarisation_batch()
```

## Tracking metrics across a batch

Beyond pass/fail, you can collect numeric data from each result to compute
statistics across the whole batch. This is useful for monitoring response
quality trends over time rather than just asserting a binary threshold.

If your checks emit numeric metrics, collect them to compute aggregates:

```python
import asyncio
from giskard.checks import Scenario, from_fn

test_inputs = [
    "This is a short response.",
    "This is a slightly longer response with more words in it.",
    "Short.",
]


def my_model(text: str) -> str:
    return text  # Echo for demonstration


async def run_with_metrics():
    scenarios = [
        Scenario(f"length_{i}")
        .interact(
            inputs=inp,
            outputs=lambda inputs, x=inp: my_model(x),
        )
        .check(
            from_fn(
                lambda trace: len(trace.last.outputs.split()) >= 3,
                name="min_word_count",
                success_message="Meets minimum word count",
                failure_message="Response too short",
            )
        )
        for i, inp in enumerate(test_inputs)
    ]

    results = await asyncio.gather(*(s.run() for s in scenarios))

    word_counts = [len(r.trace.last.outputs.split()) for r in results]
    print(f"Average word count: {sum(word_counts) / len(word_counts):.1f}")
    print(f"Passed: {sum(1 for r in results if r.passed)}/{len(results)}")


await run_with_metrics()
```

## Next steps

- See [Run in pytest](/oss/checks/how-to/run-in-pytest/) to integrate batch
  tests into CI with proper failure reporting
- Use [Test Suites](/oss/checks/how-to/test-suites/) when you want to group
  named scenarios rather than iterate over a data list
- See [Structured Output Testing](/oss/checks/how-to/structured-output/) if your
  system returns Pydantic models or dicts
