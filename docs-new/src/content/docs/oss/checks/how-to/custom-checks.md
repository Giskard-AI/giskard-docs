---
title: Custom Checks
sidebar:
  order: 6
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/custom-checks.ipynb)

Build domain-specific checks that go beyond the built-in library — from simple
predicate functions to stateful LLM judges.

## Quick check with `FnCheck`

`FnCheck` wraps any boolean function into a named check. Use it when the logic
fits in one expression.

```python
from giskard.checks import FnCheck, Scenario

is_short = FnCheck(
    fn=lambda trace: len(trace.last.outputs) < 200,
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
    FnCheck(
        fn=no_placeholder_text,
        name="no_placeholders",
        success_message="No placeholder text",
        failure_message="Response contains placeholder text",
    )
)
```

```


[1;35mScenario[0m[1m([0m
    [33mname[0m=[32m'concise_reply'[0m,
    [33msteps[0m=[1m[[0m
        [1;35mStep[0m[1m([0m
            [33minteracts[0m=[1m[[0m
                [1;35mInteract[0m[1m([0m
                    [33minputs[0m=[32m'Summarize in one sentence.'[0m,
                    [33moutputs[0m=[1m<[0m[1;95mfunction[0m[39m <lambda> at [0m[1;36m0x111a34d60[0m[1m>[0m,
                    [33mmetadata[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'interact'[0m
                [1m)[0m
            [1m][0m,
            [33mchecks[0m=[1m[[0m
                [1;35mFnCheck[0m[1m([0m
                    [33mname[0m=[32m'response_is_concise'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33msuccess_message[0m=[32m'Response is concise'[0m,
                    [33mfailure_message[0m=[32m'Response is too long'[0m,
                    [33mdetails[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'fn'[0m
                [1m)[0m,
                [1;35mFnCheck[0m[1m([0m
                    [33mname[0m=[32m'no_placeholders'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33msuccess_message[0m=[32m'No placeholder text'[0m,
                    [33mfailure_message[0m=[32m'Response contains placeholder text'[0m,
                    [33mdetails[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'fn'[0m
                [1m)[0m
            [1m][0m
        [1m)[0m
    [1m][0m,
    [33mtrace_type[0m=[3;35mNone[0m,
    [33mannotations[0m=[1m{[0m[1m}[0m,
    [33mtarget[0m=[1;35mNotProvided[0m[1m([0m[1m)[0m
[1m)[0m
```

## Check subclass

Subclass `Check` when you need configurable parameters, reuse across scenarios,
or a clean import path.

```python
from giskard.checks import Check, CheckResult, Trace
from pydantic import Field


@Check.register("contains_keyword")
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
        if passed:
            return CheckResult.success(message=f"Found '{self.keyword}'")
        return CheckResult.failure(message=f"Missing '{self.keyword}'")
```

Instantiate it like any built-in check:

```python
scenario.check(ContainsKeyword(name="mentions_price", keyword="price"))
```

```


[1;35mScenario[0m[1m([0m
    [33mname[0m=[32m'concise_reply'[0m,
    [33msteps[0m=[1m[[0m
        [1;35mStep[0m[1m([0m
            [33minteracts[0m=[1m[[0m
                [1;35mInteract[0m[1m([0m
                    [33minputs[0m=[32m'Summarize in one sentence.'[0m,
                    [33moutputs[0m=[1m<[0m[1;95mfunction[0m[39m <lambda> at [0m[1;36m0x111a34d60[0m[1m>[0m,
                    [33mmetadata[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'interact'[0m
                [1m)[0m
            [1m][0m,
            [33mchecks[0m=[1m[[0m
                [1;35mFnCheck[0m[1m([0m
                    [33mname[0m=[32m'response_is_concise'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33msuccess_message[0m=[32m'Response is concise'[0m,
                    [33mfailure_message[0m=[32m'Response is too long'[0m,
                    [33mdetails[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'fn'[0m
                [1m)[0m,
                [1;35mFnCheck[0m[1m([0m
                    [33mname[0m=[32m'no_placeholders'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33msuccess_message[0m=[32m'No placeholder text'[0m,
                    [33mfailure_message[0m=[32m'Response contains placeholder text'[0m,
                    [33mdetails[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'fn'[0m
                [1m)[0m,
                [1;35mContainsKeyword[0m[1m([0m
                    [33mname[0m=[32m'mentions_price'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33mkeyword[0m=[32m'price'[0m,
                    [33mcase_sensitive[0m=[3;91mFalse[0m,
                    [33mkind[0m=[32m'contains_keyword'[0m
                [1m)[0m
            [1m][0m
        [1m)[0m
    [1m][0m,
    [33mtrace_type[0m=[3;35mNone[0m,
    [33mannotations[0m=[1m{[0m[1m}[0m,
    [33mtarget[0m=[1;35mNotProvided[0m[1m([0m[1m)[0m
[1m)[0m
```

`@Check.register("contains_keyword")` is optional but recommended. It registers the class under a stable string key that is used when serializing and deserializing scenarios and test suites. Without it, serialization falls back to the fully-qualified class name, which breaks if you rename or move the class.

## Reading values from the trace with `resolve`

Use `resolve(trace, key)` to extract values from the trace using dot-notation
paths — the same paths used by `Equals`, `Groundedness`, and other built-ins.

```python
from giskard.checks import Check, CheckResult, Trace
from giskard.checks.core.extraction import resolve
from pydantic import Field


class MaxTokens(Check):
    key: str = Field(default="trace.last.outputs")
    limit: int = Field(default=500)

    async def run(self, trace: Trace) -> CheckResult:
        value = resolve(trace, self.key)
        token_count = len(str(value).split())
        passed = token_count <= self.limit
        msg = f"{token_count} tokens ({'ok' if passed else f'exceeds limit of {self.limit}'})"
        if passed:
            return CheckResult.success(message=msg)
        return CheckResult.failure(message=msg)
```

## LLM-backed check with `BaseLLMCheck`

`BaseLLMCheck` handles generator setup and prompt rendering. Override
`get_prompt` and let the base class call the LLM and parse the
`passed: true/false` response.

```python
from giskard.checks import BaseLLMCheck
from pydantic import Field


class ToneCheck(BaseLLMCheck):
    tone: str = Field(
        ..., description="Expected tone, e.g. 'professional', 'empathetic'"
    )

    def get_prompt(self) -> str:
        return f"""
        Evaluate whether the following response has a {self.tone} tone.

        Response: {{{{ trace.last.outputs }}}}

        Return 'passed: true' if the tone is {self.tone}, 'passed: false' otherwise.
        Include a brief explanation.
        """
```

Use it like any other check:

```python
scenario.check(ToneCheck(name="professional_tone", tone="professional"))
```

```


[1;35mScenario[0m[1m([0m
    [33mname[0m=[32m'concise_reply'[0m,
    [33msteps[0m=[1m[[0m
        [1;35mStep[0m[1m([0m
            [33minteracts[0m=[1m[[0m
                [1;35mInteract[0m[1m([0m
                    [33minputs[0m=[32m'Summarize in one sentence.'[0m,
                    [33moutputs[0m=[1m<[0m[1;95mfunction[0m[39m <lambda> at [0m[1;36m0x111a34d60[0m[1m>[0m,
                    [33mmetadata[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'interact'[0m
                [1m)[0m
            [1m][0m,
            [33mchecks[0m=[1m[[0m
                [1;35mFnCheck[0m[1m([0m
                    [33mname[0m=[32m'response_is_concise'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33msuccess_message[0m=[32m'Response is concise'[0m,
                    [33mfailure_message[0m=[32m'Response is too long'[0m,
                    [33mdetails[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'fn'[0m
                [1m)[0m,
                [1;35mFnCheck[0m[1m([0m
                    [33mname[0m=[32m'no_placeholders'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33msuccess_message[0m=[32m'No placeholder text'[0m,
                    [33mfailure_message[0m=[32m'Response contains placeholder text'[0m,
                    [33mdetails[0m=[1m{[0m[1m}[0m,
                    [33mkind[0m=[32m'fn'[0m
                [1m)[0m,
                [1;35mContainsKeyword[0m[1m([0m
                    [33mname[0m=[32m'mentions_price'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33mkeyword[0m=[32m'price'[0m,
                    [33mcase_sensitive[0m=[3;91mFalse[0m,
                    [33mkind[0m=[32m'contains_keyword'[0m
                [1m)[0m,
                [1;35mToneCheck[0m[1m([0m
                    [33mgenerator[0m=[1;35mLiteLLMGenerator[0m[1m([0m
                        [33mparams[0m=[1;35mGenerationParams[0m[1m([0m
                            [33mtemperature[0m=[1;36m1[0m[1;36m.0[0m,
                            [33mmax_tokens[0m=[3;35mNone[0m,
                            [33mresponse_format[0m=[3;35mNone[0m,
                            [33mtools[0m=[1m[[0m[1m][0m,
                            [33mtimeout[0m=[3;35mNone[0m
                        [1m)[0m,
                        [33mretry_policy[0m=[1;35mRetryPolicy[0m[1m([0m[33mmax_attempts[0m=[1;36m3[0m, [33mbase_delay[0m=[1;36m1[0m[1;36m.0[0m, [33mmax_delay[0m=[3;35mNone[0m[1m)[0m,
                        [33mrate_limiter[0m=[3;35mNone[0m,
                        [33mmiddlewares[0m=[1m[[0m[1m][0m,
                        [33mmodel[0m=[32m'openai/gpt-4o-mini'[0m,
                        [33mkind[0m=[32m'litellm'[0m
                    [1m)[0m,
                    [33mname[0m=[32m'professional_tone'[0m,
                    [33mdescription[0m=[3;35mNone[0m,
                    [33mtone[0m=[32m'professional'[0m,
                    [33mkind[0m=[3;35mNone[0m
                [1m)[0m
            [1m][0m
        [1m)[0m
    [1m][0m,
    [33mtrace_type[0m=[3;35mNone[0m,
    [33mannotations[0m=[1m{[0m[1m}[0m,
    [33mtarget[0m=[1;35mNotProvided[0m[1m([0m[1m)[0m
[1m)[0m
```

By default `BaseLLMCheck` expects the LLM to return a JSON object with the shape `{"reason": str | None, "passed": bool}`. You can change this by overriding `output_type` (a Pydantic model) and `_handle_output`. See the BaseLLMCheck API reference for details.

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
        if passed:
            return CheckResult.success(message=f"Toxicity score: {score:.2f}")
        return CheckResult.failure(message=f"Toxicity score: {score:.2f}")
```

## Composing checks

Group related checks into a helper function that returns a list, then pass
them to `.check()` with the variadic form. Checks run **sequentially** — the
scenario stops at the first failure, so order matters. Put cheap, fast checks
before expensive LLM-based judges.

```python
from giskard.checks import FnCheck


def safety_checks():
    return [
        FnCheck(
            fn=lambda trace: len(trace.last.outputs) > 0,
            name="non_empty",
            success_message="Response is non-empty",
            failure_message="Empty response",
        ),
        FnCheck(
            fn=lambda trace: "error" not in trace.last.outputs.lower(),
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
for chk in safety_checks():
    scenario = scenario.check(chk)
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
