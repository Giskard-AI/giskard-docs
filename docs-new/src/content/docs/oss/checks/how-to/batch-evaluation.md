---
title: Batch Evaluation
sidebar:
  order: 9
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/batch-evaluation.ipynb)

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
            for cr in (r for step in result.steps for r in step.results):
                if not cr.passed:
                    print(f"    {cr.details.get('check_name', 'Unknown')}: {cr.message}")

    return results


asyncio.run(run_batch())
```

```
Passed: 0/3 (0.0%)
  FAIL: How long do we retain KYC records?
    contains_expected: The answer does not contain the keyword '5 years'
  FAIL: Can we share customer data with third parties?
    contains_expected: The answer does not contain the keyword 'only with consent'
  FAIL: Is medical advice allowed in the chatbot?
    contains_expected: The answer does not contain the keyword 'no'


[1m[[0m
    [1;35mScenarioResult[0m[1m([0m
        [33mscenario_name[0m=[32m'qa_0'[0m,
        [33msteps[0m=[1m[[0m
            [1;35mTestCaseResult[0m[1m([0m
                [33mresults[0m=[1m[[0m
                    [1;35mCheckResult[0m[1m([0m
                        [33mstatus[0m=[1m<[0m[1;95mCheckStatus.FAIL:[0m[39m [0m[32m'fail'[0m[39m>,[0m
[39m                        [0m[33mmessage[0m[39m=[0m[32m"The[0m[32m answer does not contain the keyword '5 years'"[0m[39m,[0m
[39m                        [0m[33mmetrics[0m[39m=[0m[1;39m[[0m[1;39m][0m[39m,[0m
[39m                        [0m[33mdetails[0m[39m=[0m[1;39m{[0m
[39m                            [0m[32m'text'[0m[39m: [0m[32m'...'[0m[39m,[0m
[39m                            [0m[32m'keyword'[0m[39m: [0m[32m'5 years'[0m[39m,[0m
[39m                            [0m[32m'normalization_form'[0m[39m: [0m[32m'NFKC'[0m[39m,[0m
[39m                            [0m[32m'case_sensitive'[0m[39m: [0m[3;92mTrue[0m[39m,[0m
[39m                            [0m[32m'duration_ms'[0m[39m: [0m[1;36m15[0m[39m,[0m
[39m                            [0m[32m'check_kind'[0m[39m: [0m[32m'string_matching'[0m[39m,[0m
[39m                            [0m[32m'check_name'[0m[39m: [0m[32m'contains_expected'[0m[39m,[0m
[39m                            [0m[32m'check_description'[0m[39m: [0m[3;35mNone[0m
[39m                        [0m[1;39m}[0m
[39m                    [0m[1;39m)[0m
[39m                [0m[1;39m][0m[39m,[0m
[39m                [0m[33mduration_ms[0m[39m=[0m[1;36m15[0m[39m,[0m
[39m                [0m[33mstatus[0m[39m=<TestCaseStatus.FAIL: [0m[32m'fail'[0m[39m>[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m][0m[39m,[0m
[39m        [0m[33mduration_ms[0m[39m=[0m[1;36m19[0m[39m,[0m
[39m        [0m[33mfinal_trace[0m[39m=[0m[35mTrace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m            [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                Interaction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                    [0m[33minputs[0m[39m=[0m[32m'How long do we retain KYC records?'[0m[39m,[0m
[39m                    [0m[33moutputs[0m[39m=[0m[32m'...'[0m[39m,[0m
[39m                    [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                [0m[1;39m)[0m
[39m            [0m[1;39m][0m[39m,[0m
[39m            [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m            [0m[33mlast[0m[39m=[0m[35mInteraction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                [0m[33minputs[0m[39m=[0m[32m'How long do we retain KYC records?'[0m[39m,[0m
[39m                [0m[33moutputs[0m[39m=[0m[32m'...'[0m[39m,[0m
[39m                [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m)[0m[39m,[0m
[39m        [0m[33mstatus[0m[39m=<ScenarioStatus.FAIL: [0m[32m'fail'[0m[39m>[0m
[39m    [0m[1;39m)[0m[39m,[0m
[39m    [0m[1;35mScenarioResult[0m[1;39m([0m
[39m        [0m[33mscenario_name[0m[39m=[0m[32m'qa_1'[0m[39m,[0m
[39m        [0m[33msteps[0m[39m=[0m[1;39m[[0m
[39m            [0m[1;35mTestCaseResult[0m[1;39m([0m
[39m                [0m[33mresults[0m[39m=[0m[1;39m[[0m
[39m                    [0m[1;35mCheckResult[0m[1;39m([0m
[39m                        [0m[33mstatus[0m[39m=<CheckStatus.FAIL: [0m[32m'fail'[0m[39m>,[0m
[39m                        [0m[33mmessage[0m[39m=[0m[32m"The[0m[32m answer does not contain the keyword 'only with consent'"[0m[39m,[0m
[39m                        [0m[33mmetrics[0m[39m=[0m[1;39m[[0m[1;39m][0m[39m,[0m
[39m                        [0m[33mdetails[0m[39m=[0m[1;39m{[0m
[39m                            [0m[32m'text'[0m[39m: [0m[32m'...'[0m[39m,[0m
[39m                            [0m[32m'keyword'[0m[39m: [0m[32m'only with consent'[0m[39m,[0m
[39m                            [0m[32m'normalization_form'[0m[39m: [0m[32m'NFKC'[0m[39m,[0m
[39m                            [0m[32m'case_sensitive'[0m[39m: [0m[3;92mTrue[0m[39m,[0m
[39m                            [0m[32m'duration_ms'[0m[39m: [0m[1;36m10[0m[39m,[0m
[39m                            [0m[32m'check_kind'[0m[39m: [0m[32m'string_matching'[0m[39m,[0m
[39m                            [0m[32m'check_name'[0m[39m: [0m[32m'contains_expected'[0m[39m,[0m
[39m                            [0m[32m'check_description'[0m[39m: [0m[3;35mNone[0m
[39m                        [0m[1;39m}[0m
[39m                    [0m[1;39m)[0m
[39m                [0m[1;39m][0m[39m,[0m
[39m                [0m[33mduration_ms[0m[39m=[0m[1;36m10[0m[39m,[0m
[39m                [0m[33mstatus[0m[39m=<TestCaseStatus.FAIL: [0m[32m'fail'[0m[39m>[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m][0m[39m,[0m
[39m        [0m[33mduration_ms[0m[39m=[0m[1;36m10[0m[39m,[0m
[39m        [0m[33mfinal_trace[0m[39m=[0m[35mTrace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m            [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                Interaction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                    [0m[33minputs[0m[39m=[0m[32m'Can we share customer data with third parties?'[0m[39m,[0m
[39m                    [0m[33moutputs[0m[39m=[0m[32m'...'[0m[39m,[0m
[39m                    [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                [0m[1;39m)[0m
[39m            [0m[1;39m][0m[39m,[0m
[39m            [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m            [0m[33mlast[0m[39m=[0m[35mInteraction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                [0m[33minputs[0m[39m=[0m[32m'Can we share customer data with third parties?'[0m[39m,[0m
[39m                [0m[33moutputs[0m[39m=[0m[32m'...'[0m[39m,[0m
[39m                [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m)[0m[39m,[0m
[39m        [0m[33mstatus[0m[39m=<ScenarioStatus.FAIL: [0m[32m'fail'[0m[39m>[0m
[39m    [0m[1;39m)[0m[39m,[0m
[39m    [0m[1;35mScenarioResult[0m[1;39m([0m
[39m        [0m[33mscenario_name[0m[39m=[0m[32m'qa_2'[0m[39m,[0m
[39m        [0m[33msteps[0m[39m=[0m[1;39m[[0m
[39m            [0m[1;35mTestCaseResult[0m[1;39m([0m
[39m                [0m[33mresults[0m[39m=[0m[1;39m[[0m
[39m                    [0m[1;35mCheckResult[0m[1;39m([0m
[39m                        [0m[33mstatus[0m[39m=<CheckStatus.FAIL: [0m[32m'fail'[0m[39m>,[0m
[39m                        [0m[33mmessage[0m[39m=[0m[32m"The[0m[32m answer does not contain the keyword 'no'"[0m[39m,[0m
[39m                        [0m[33mmetrics[0m[39m=[0m[1;39m[[0m[1;39m][0m[39m,[0m
[39m                        [0m[33mdetails[0m[39m=[0m[1;39m{[0m
[39m                            [0m[32m'text'[0m[39m: [0m[32m'...'[0m[39m,[0m
[39m                            [0m[32m'keyword'[0m[39m: [0m[32m'no'[0m[39m,[0m
[39m                            [0m[32m'normalization_form'[0m[39m: [0m[32m'NFKC'[0m[39m,[0m
[39m                            [0m[32m'case_sensitive'[0m[39m: [0m[3;92mTrue[0m[39m,[0m
[39m                            [0m[32m'duration_ms'[0m[39m: [0m[1;36m9[0m[39m,[0m
[39m                            [0m[32m'check_kind'[0m[39m: [0m[32m'string_matching'[0m[39m,[0m
[39m                            [0m[32m'check_name'[0m[39m: [0m[32m'contains_expected'[0m[39m,[0m
[39m                            [0m[32m'check_description'[0m[39m: [0m[3;35mNone[0m
[39m                        [0m[1;39m}[0m
[39m                    [0m[1;39m)[0m
[39m                [0m[1;39m][0m[39m,[0m
[39m                [0m[33mduration_ms[0m[39m=[0m[1;36m9[0m[39m,[0m
[39m                [0m[33mstatus[0m[39m=<TestCaseStatus.FAIL: [0m[32m'fail'[0m[39m>[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m][0m[39m,[0m
[39m        [0m[33mduration_ms[0m[39m=[0m[1;36m9[0m[39m,[0m
[39m        [0m[33mfinal_trace[0m[39m=[0m[35mTrace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m            [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                Interaction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                    [0m[33minputs[0m[39m=[0m[32m'Is medical advice allowed in the chatbot?'[0m[39m,[0m
[39m                    [0m[33moutputs[0m[39m=[0m[32m'...'[0m[39m,[0m
[39m                    [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                [0m[1;39m)[0m
[39m            [0m[1;39m][0m[39m,[0m
[39m            [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m            [0m[33mlast[0m[39m=[0m[35mInteraction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                [0m[33minputs[0m[39m=[0m[32m'Is medical advice allowed in the chatbot?'[0m[39m,[0m
[39m                [0m[33moutputs[0m[39m=[0m[32m'...'[0m[39m,[0m
[39m                [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m)[0m[39m,[0m
[39m        [0m[33mstatus[0m[39m=<ScenarioStatus.FAIL: [0m[32m'fail'[0m[1m>[0m
    [1m)[0m
[1m][0m
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


asyncio.run(run_summarisation_batch())
```

```
Factual consistency: 3/3 passed


[1m[[0m
    [1;35mScenarioResult[0m[1m([0m
        [33mscenario_name[0m=[32m'summary_0'[0m,
        [33msteps[0m=[1m[[0m
            [1;35mTestCaseResult[0m[1m([0m
                [33mresults[0m=[1m[[0m
                    [1;35mCheckResult[0m[1m([0m
                        [33mstatus[0m=[1m<[0m[1;95mCheckStatus.PASS:[0m[39m [0m[32m'pass'[0m[39m>,[0m
[39m                        [0m[33mmessage[0m[39m=[0m[32m'The summary is truncated but accurately reflects the original statement and contains no factual errors.'[0m[39m,[0m
[39m                        [0m[33mmetrics[0m[39m=[0m[1;39m[[0m[1;39m][0m[39m,[0m
[39m                        [0m[33mdetails[0m[39m=[0m[1;39m{[0m
[39m                            [0m[32m'reason'[0m[39m: [0m[32m'The summary is truncated but accurately reflects the original statement and contains no factual errors.'[0m[39m,[0m
[39m                            [0m[32m'inputs'[0m[39m: [0m[1;39m{[0m
[39m                                [0m[32m'trace'[0m[39m: Trace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                                    [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                                        [0m[1;35mInteraction[0m[1;39m([0m
[39m                                            [0m[33minputs[0m[39m=[0m[32m'The new policy requires all employees to complete security training annually.'[0m[39m,[0m
[39m                                            [0m[33moutputs[0m[39m=[0m[32m'Summary of: The new policy requires all employees to...'[0m[39m,[0m
[39m                                            [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                                        [0m[1;39m)[0m
[39m                                    [0m[1;39m][0m[39m,[0m
[39m                                    [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m                                    [0m[33mlast[0m[39m=[0m[1;35mInteraction[0m[1;39m([0m
[39m                                        [0m[33minputs[0m[39m=[0m[32m'The new policy requires all employees to complete security training annually.'[0m[39m,[0m
[39m                                        [0m[33moutputs[0m[39m=[0m[32m'Summary of: The new policy requires all employees to...'[0m[39m,[0m
[39m                                        [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                                    [0m[1;39m)[0m
[39m                                [0m[1;39m)[0m
[39m                            [0m[1;39m}[0m[39m,[0m
[39m                            [0m[32m'duration_ms'[0m[39m: [0m[1;36m5953[0m[39m,[0m
[39m                            [0m[32m'check_kind'[0m[39m: [0m[32m'llm_judge'[0m[39m,[0m
[39m                            [0m[32m'check_name'[0m[39m: [0m[32m'factual_consistency'[0m[39m,[0m
[39m                            [0m[32m'check_description'[0m[39m: [0m[3;35mNone[0m
[39m                        [0m[1;39m}[0m
[39m                    [0m[1;39m)[0m
[39m                [0m[1;39m][0m[39m,[0m
[39m                [0m[33mduration_ms[0m[39m=[0m[1;36m5953[0m[39m,[0m
[39m                [0m[33mstatus[0m[39m=<TestCaseStatus.PASS: [0m[32m'pass'[0m[39m>[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m][0m[39m,[0m
[39m        [0m[33mduration_ms[0m[39m=[0m[1;36m5953[0m[39m,[0m
[39m        [0m[33mfinal_trace[0m[39m=[0m[35mTrace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m            [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                Interaction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                    [0m[33minputs[0m[39m=[0m[32m'The new policy requires all employees to complete security training annually.'[0m[39m,[0m
[39m                    [0m[33moutputs[0m[39m=[0m[32m'Summary of: The new policy requires all employees to...'[0m[39m,[0m
[39m                    [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                [0m[1;39m)[0m
[39m            [0m[1;39m][0m[39m,[0m
[39m            [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m            [0m[33mlast[0m[39m=[0m[35mInteraction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                [0m[33minputs[0m[39m=[0m[32m'The new policy requires all employees to complete security training annually.'[0m[39m,[0m
[39m                [0m[33moutputs[0m[39m=[0m[32m'Summary of: The new policy requires all employees to...'[0m[39m,[0m
[39m                [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m)[0m[39m,[0m
[39m        [0m[33mstatus[0m[39m=<ScenarioStatus.PASS: [0m[32m'pass'[0m[39m>[0m
[39m    [0m[1;39m)[0m[39m,[0m
[39m    [0m[1;35mScenarioResult[0m[1;39m([0m
[39m        [0m[33mscenario_name[0m[39m=[0m[32m'summary_1'[0m[39m,[0m
[39m        [0m[33msteps[0m[39m=[0m[1;39m[[0m
[39m            [0m[1;35mTestCaseResult[0m[1;39m([0m
[39m                [0m[33mresults[0m[39m=[0m[1;39m[[0m
[39m                    [0m[1;35mCheckResult[0m[1;39m([0m
[39m                        [0m[33mstatus[0m[39m=<CheckStatus.PASS: [0m[32m'pass'[0m[39m>,[0m
[39m                        [0m[33mmessage[0m[39m=[0m[32m'Summary matches the original statement; truncated but contains no factual inaccuracies.'[0m[39m,[0m
[39m                        [0m[33mmetrics[0m[39m=[0m[1;39m[[0m[1;39m][0m[39m,[0m
[39m                        [0m[33mdetails[0m[39m=[0m[1;39m{[0m
[39m                            [0m[32m'reason'[0m[39m: [0m[32m'Summary matches the original statement; truncated but contains no factual inaccuracies.'[0m[39m,[0m
[39m                            [0m[32m'inputs'[0m[39m: [0m[1;39m{[0m
[39m                                [0m[32m'trace'[0m[39m: Trace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                                    [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                                        [0m[1;35mInteraction[0m[1;39m([0m
[39m                                            [0m[33minputs[0m[39m=[0m[32m'The quarterly report shows a 12% increase in revenue compared to last year.'[0m[39m,[0m
[39m                                            [0m[33moutputs[0m[39m=[0m[32m'Summary of: The quarterly report shows a 12% increas...'[0m[39m,[0m
[39m                                            [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                                        [0m[1;39m)[0m
[39m                                    [0m[1;39m][0m[39m,[0m
[39m                                    [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m                                    [0m[33mlast[0m[39m=[0m[1;35mInteraction[0m[1;39m([0m
[39m                                        [0m[33minputs[0m[39m=[0m[32m'The quarterly report shows a 12% increase in revenue compared to last year.'[0m[39m,[0m
[39m                                        [0m[33moutputs[0m[39m=[0m[32m'Summary of: The quarterly report shows a 12% increas...'[0m[39m,[0m
[39m                                        [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                                    [0m[1;39m)[0m
[39m                                [0m[1;39m)[0m
[39m                            [0m[1;39m}[0m[39m,[0m
[39m                            [0m[32m'duration_ms'[0m[39m: [0m[1;36m5623[0m[39m,[0m
[39m                            [0m[32m'check_kind'[0m[39m: [0m[32m'llm_judge'[0m[39m,[0m
[39m                            [0m[32m'check_name'[0m[39m: [0m[32m'factual_consistency'[0m[39m,[0m
[39m                            [0m[32m'check_description'[0m[39m: [0m[3;35mNone[0m
[39m                        [0m[1;39m}[0m
[39m                    [0m[1;39m)[0m
[39m                [0m[1;39m][0m[39m,[0m
[39m                [0m[33mduration_ms[0m[39m=[0m[1;36m5623[0m[39m,[0m
[39m                [0m[33mstatus[0m[39m=<TestCaseStatus.PASS: [0m[32m'pass'[0m[39m>[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m][0m[39m,[0m
[39m        [0m[33mduration_ms[0m[39m=[0m[1;36m5623[0m[39m,[0m
[39m        [0m[33mfinal_trace[0m[39m=[0m[35mTrace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m            [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                Interaction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                    [0m[33minputs[0m[39m=[0m[32m'The quarterly report shows a 12% increase in revenue compared to last year.'[0m[39m,[0m
[39m                    [0m[33moutputs[0m[39m=[0m[32m'Summary of: The quarterly report shows a 12% increas...'[0m[39m,[0m
[39m                    [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                [0m[1;39m)[0m
[39m            [0m[1;39m][0m[39m,[0m
[39m            [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m            [0m[33mlast[0m[39m=[0m[35mInteraction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                [0m[33minputs[0m[39m=[0m[32m'The quarterly report shows a 12% increase in revenue compared to last year.'[0m[39m,[0m
[39m                [0m[33moutputs[0m[39m=[0m[32m'Summary of: The quarterly report shows a 12% increas...'[0m[39m,[0m
[39m                [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m)[0m[39m,[0m
[39m        [0m[33mstatus[0m[39m=<ScenarioStatus.PASS: [0m[32m'pass'[0m[39m>[0m
[39m    [0m[1;39m)[0m[39m,[0m
[39m    [0m[1;35mScenarioResult[0m[1;39m([0m
[39m        [0m[33mscenario_name[0m[39m=[0m[32m'summary_2'[0m[39m,[0m
[39m        [0m[33msteps[0m[39m=[0m[1;39m[[0m
[39m            [0m[1;35mTestCaseResult[0m[1;39m([0m
[39m                [0m[33mresults[0m[39m=[0m[1;39m[[0m
[39m                    [0m[1;35mCheckResult[0m[1;39m([0m
[39m                        [0m[33mstatus[0m[39m=<CheckStatus.PASS: [0m[32m'pass'[0m[39m>,[0m
[39m                        [0m[33mmessage[0m[39m=[0m[32m'Check passed'[0m[39m,[0m
[39m                        [0m[33mmetrics[0m[39m=[0m[1;39m[[0m[1;39m][0m[39m,[0m
[39m                        [0m[33mdetails[0m[39m=[0m[1;39m{[0m
[39m                            [0m[32m'reason'[0m[39m: [0m[3;35mNone[0m[39m,[0m
[39m                            [0m[32m'inputs'[0m[39m: [0m[1;39m{[0m
[39m                                [0m[32m'trace'[0m[39m: Trace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                                    [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                                        [0m[1;35mInteraction[0m[1;39m([0m
[39m                                            [0m[33minputs[0m[39m=[0m[32m'Our refund policy allows returns within 30 days of purchase with a receipt.'[0m[39m,[0m
[39m                                            [0m[33moutputs[0m[39m=[0m[32m'Summary of: Our refund policy allows returns within ...'[0m[39m,[0m
[39m                                            [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                                        [0m[1;39m)[0m
[39m                                    [0m[1;39m][0m[39m,[0m
[39m                                    [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m                                    [0m[33mlast[0m[39m=[0m[1;35mInteraction[0m[1;39m([0m
[39m                                        [0m[33minputs[0m[39m=[0m[32m'Our refund policy allows returns within 30 days of purchase with a receipt.'[0m[39m,[0m
[39m                                        [0m[33moutputs[0m[39m=[0m[32m'Summary of: Our refund policy allows returns within ...'[0m[39m,[0m
[39m                                        [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                                    [0m[1;39m)[0m
[39m                                [0m[1;39m)[0m
[39m                            [0m[1;39m}[0m[39m,[0m
[39m                            [0m[32m'duration_ms'[0m[39m: [0m[1;36m5622[0m[39m,[0m
[39m                            [0m[32m'check_kind'[0m[39m: [0m[32m'llm_judge'[0m[39m,[0m
[39m                            [0m[32m'check_name'[0m[39m: [0m[32m'factual_consistency'[0m[39m,[0m
[39m                            [0m[32m'check_description'[0m[39m: [0m[3;35mNone[0m
[39m                        [0m[1;39m}[0m
[39m                    [0m[1;39m)[0m
[39m                [0m[1;39m][0m[39m,[0m
[39m                [0m[33mduration_ms[0m[39m=[0m[1;36m5622[0m[39m,[0m
[39m                [0m[33mstatus[0m[39m=<TestCaseStatus.PASS: [0m[32m'pass'[0m[39m>[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m][0m[39m,[0m
[39m        [0m[33mduration_ms[0m[39m=[0m[1;36m5622[0m[39m,[0m
[39m        [0m[33mfinal_trace[0m[39m=[0m[35mTrace[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m            [0m[33minteractions[0m[39m=[0m[1;39m[[0m
[39m                Interaction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                    [0m[33minputs[0m[39m=[0m[32m'Our refund policy allows returns within 30 days of purchase with a receipt.'[0m[39m,[0m
[39m                    [0m[33moutputs[0m[39m=[0m[32m'Summary of: Our refund policy allows returns within ...'[0m[39m,[0m
[39m                    [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m                [0m[1;39m)[0m
[39m            [0m[1;39m][0m[39m,[0m
[39m            [0m[33mannotations[0m[39m=[0m[1;39m{[0m[1;39m}[0m[39m,[0m
[39m            [0m[33mlast[0m[39m=[0m[35mInteraction[0m[1;39m[[0m[39mTypeVar, TypeVar[0m[1;39m][0m[1;39m([0m
[39m                [0m[33minputs[0m[39m=[0m[32m'Our refund policy allows returns within 30 days of purchase with a receipt.'[0m[39m,[0m
[39m                [0m[33moutputs[0m[39m=[0m[32m'Summary of: Our refund policy allows returns within ...'[0m[39m,[0m
[39m                [0m[33mmetadata[0m[39m=[0m[1;39m{[0m[1;39m}[0m
[39m            [0m[1;39m)[0m
[39m        [0m[1;39m)[0m[39m,[0m
[39m        [0m[33mstatus[0m[39m=<ScenarioStatus.PASS: [0m[32m'pass'[0m[1m>[0m
    [1m)[0m
[1m][0m
```

## Tracking metrics across a batch

Beyond pass/fail, you can collect numeric data from each result to compute
statistics across the whole batch. This is useful for monitoring response
quality trends over time rather than just asserting a binary threshold.

If your checks emit numeric metrics, collect them to compute aggregates:

```python
import asyncio
from giskard.checks import Scenario, FnCheck

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
            FnCheck(fn=
                lambda trace: len(trace.last.outputs.split()) >= 3,
                name="min_word_count",
                success_message="Meets minimum word count",
                failure_message="Response too short",
            )
        )
        for i, inp in enumerate(test_inputs)
    ]

    results = await asyncio.gather(*(s.run() for s in scenarios))

    word_counts = [len(r.final_trace.last.outputs.split()) for r in results]
    print(f"Average word count: {sum(word_counts) / len(word_counts):.1f}")
    print(f"Passed: {sum(1 for r in results if r.passed)}/{len(results)}")


asyncio.run(run_with_metrics())
```

```
Average word count: 5.7
Passed: 2/3
```

## Next steps

- [Run in pytest](/oss/checks/how-to/run-in-pytest/) — integrate batch tests
  into CI with proper failure reporting
- [Test Suites](/oss/checks/tutorials/test-suites/) — group named scenarios
  rather than iterate over a data list
- [Structured Output Testing](/oss/checks/how-to/structured-output/) — validate
  Pydantic models or dicts
