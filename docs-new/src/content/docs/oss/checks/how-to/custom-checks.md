---
title: Custom Checks
sidebar:
  order: 6
---

Build domain-specific checks that go beyond the built-in library — from simple
predicate functions to stateful LLM judges.

## Quick check with `from_fn`

`from_fn` wraps any boolean function into a named check. Use it when the logic
fits in one expression.

```python
from giskard.checks import from_fn, Scenario

is_short = from_fn(
    lambda trace: len(trace.last.outputs) < 200,
    name="response_is_concise",
    success_message="Response is concise",
    failure_message="Response is too long",
)

scenario = (
    Scenario("concise_reply")
    .interact(inputs="Summarize in one sentence.", outputs=lambda i: my_llm(i))
    .check(is_short)
)
```

For anything more complex, define a named function:

```python
def no_placeholder_text(trace) -> bool:
    output = trace.last.outputs
    return "[INSERT" not in output and "TODO" not in output


scenario.check(
    from_fn(
        no_placeholder_text,
        name="no_placeholders",
        success_message="No placeholder text",
        failure_message="Response contains placeholder text",
    )
)
```

## Check subclass

Subclass `Check` when you need configurable parameters, reuse across scenarios,
or a clean import path.

```python
from giskard.checks import Check, CheckResult, Trace
from pydantic import Field


class ContainsKeyword(Check):
    keyword: str = Field(
        ..., description="Keyword that must appear in the output"
    )
    case_sensitive: bool = Field(default=False)

    async def run(self, trace: Trace) -> CheckResult:
        output = trace.last.outputs
        target = output if self.case_sensitive else output.lower()
        needle = self.keyword if self.case_sensitive else self.keyword.lower()
        passed = needle in target
        return CheckResult(
            name=self.name,
            passed=passed,
            message=(
                f"Found '{self.keyword}'"
                if passed
                else f"Missing '{self.keyword}'"
            ),
        )
```

Instantiate it like any built-in check:

```python
scenario.check(ContainsKeyword(name="mentions_price", keyword="price"))
```

## Reading values from the trace with `resolve`

Use `resolve(key, trace)` to extract values from the trace using dot-notation
paths — the same paths used by `Equals`, `Groundedness`, and other built-ins.

```python
from giskard.checks import Check, CheckResult, Trace, resolve
from pydantic import Field


class MaxTokens(Check):
    key: str = Field(default="trace.last.outputs")
    limit: int = Field(default=500)

    async def run(self, trace: Trace) -> CheckResult:
        value = resolve(self.key, trace)
        token_count = len(str(value).split())
        passed = token_count <= self.limit
        return CheckResult(
            name=self.name,
            passed=passed,
            message=f"{token_count} tokens ({'ok' if passed else f'exceeds limit of {self.limit}'})",
        )
```

## LLM-backed check with `BaseLLMCheck`

`BaseLLMCheck` handles generator setup and prompt rendering. Override
`get_prompt` and let the base class call the LLM and parse the
`passed: true/false` response.

```python
from giskard.checks import BaseLLMCheck, Trace
from pydantic import Field


class ToneCheck(BaseLLMCheck):
    tone: str = Field(
        ..., description="Expected tone, e.g. 'professional', 'empathetic'"
    )

    def get_prompt(self, trace: Trace) -> str:
        return f"""
        Evaluate whether the following response has a {self.tone} tone.

        Response: {trace.last.outputs}

        Return 'passed: true' if the tone is {self.tone}, 'passed: false' otherwise.
        Include a brief explanation.
        """
```

Use it like any other check:

```python
scenario.check(ToneCheck(name="professional_tone", tone="professional"))
```

## Async checks

All `Check.run()` methods are async, so you can call external services without
blocking the event loop.

```python
import httpx
from giskard.checks import Check, CheckResult, Trace


class ToxicityAPICheck(Check):
    api_url: str

    async def run(self, trace: Trace) -> CheckResult:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                json={"text": trace.last.outputs},
            )
        score = response.json()["toxicity_score"]
        passed = score < 0.5
        return CheckResult(
            name=self.name,
            passed=passed,
            message=f"Toxicity score: {score:.2f}",
        )
```

## Composing checks

Group related checks into a helper function that returns a list, then unpack
them into `.check()` calls with a loop.

```python
from giskard.checks import from_fn, ContainsKeyword


def safety_checks():
    return [
        from_fn(
            lambda trace: len(trace.last.outputs) > 0,
            name="non_empty",
            success_message="Response is non-empty",
            failure_message="Empty response",
        ),
        from_fn(
            lambda trace: "error" not in trace.last.outputs.lower(),
            name="no_error_string",
            success_message="No error string",
            failure_message="Response contains 'error'",
        ),
        ContainsKeyword(name="has_disclaimer", keyword="disclaimer"),
    ]


scenario = Scenario("safe_reply").interact(
    inputs="Tell me about investing.",
    outputs=lambda i: my_llm(i),
)

for check in safety_checks():
    scenario = scenario.check(check)
```

## Testing your custom check

Test the check logic in isolation before wiring it into a scenario.

```python
import asyncio
from giskard.checks import Trace, Interaction


async def test_contains_keyword():
    trace = Trace(
        interactions=[
            Interaction(
                inputs="What is the price?", outputs="The price is $99."
            )
        ]
    )
    check = ContainsKeyword(name="mentions_price", keyword="price")
    result = await check.run(trace)
    assert result.passed
    assert "price" in result.message.lower()


asyncio.run(test_contains_keyword())
```

## Next steps

- [API Reference: Checks](/oss/checks/reference/checks/) — full list of built-in
  checks and their parameters
- [Single-Turn Evaluation](/oss/checks/tutorials/single-turn/) — using checks in
  a scenario
- [Stateful Checks](/oss/checks/how-to/stateful-checks/) — checks that
  accumulate state across interactions
