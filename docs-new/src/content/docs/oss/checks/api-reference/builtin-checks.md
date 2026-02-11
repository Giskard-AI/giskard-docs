---
title: Built-in Checks
sidebar:
  order: 3
---

Ready-to-use checks for common testing scenarios.

<div class="currentmodule">

giskard.checks

</div>

# Function-Based Checks

## from_fn

<div class="autofunction">

from_fn

</div>

Create a check from a simple function.

**Example:**

``` python
from giskard.checks import from_fn, Trace

def my_validation(trace: Trace) -> bool:
    return len(trace.last.outputs) > 10

check = from_fn(
    my_validation,
    name="min_length",
    success_message="Output is long enough",
    failure_message="Output too short"
)
```

## FnCheck

<div class="autoclass" members="" undoc-members="" show-inheritance="">

FnCheck

</div>

Check class created by `from_fn`.

# String Matching

## StringMatching

<div class="autoclass" members="" undoc-members="" show-inheritance="">

StringMatching

</div>

Check if a keyword appears within a text string.

**Example:**

``` python
from giskard.checks import StringMatching

check = StringMatching(
    name="contains_answer",
    keyword="Paris",
    text_key="trace.last.outputs.answer"
)
```

# Comparison Checks

## Equals

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Equals

</div>

Check if extracted value equals expected value.

**Example:**

``` python
from giskard.checks import Equals

check = Equals(
    name="correct_confidence",
    expected_value=0.95,
    key="trace.last.outputs.confidence"
)
```

## NotEquals

<div class="autoclass" members="" undoc-members="" show-inheritance="">

NotEquals

</div>

Check if extracted value does not equal expected value.

**Example:**

``` python
from giskard.checks import NotEquals

check = NotEquals(
    name="non_empty_answer",
    expected_value="",
    key="trace.last.outputs.answer"
)
```

## GreaterThan

<div class="autoclass" members="" undoc-members="" show-inheritance="">

GreaterThan

</div>

Check if extracted value is greater than expected value.

**Example:**

``` python
from giskard.checks import GreaterThan

check = GreaterThan(
    name="min_latency_ms",
    expected_value=250,
    key="trace.last.metadata.latency_ms"
)
```

## GreaterEquals

<div class="autoclass" members="" undoc-members="" show-inheritance="">

GreaterEquals

</div>

Check if extracted value is greater than or equal to expected value.

**Example:**

``` python
from giskard.checks import GreaterEquals

check = GreaterEquals(
    name="meets_threshold",
    expected_value=0.8,
    key="trace.last.outputs.score"
)
```

## LesserThan

<div class="autoclass" members="" undoc-members="" show-inheritance="">

LesserThan

</div>

Check if extracted value is less than expected value.

**Example:**

``` python
from giskard.checks import LesserThan

check = LesserThan(
    name="max_tokens",
    expected_value=512,
    key="trace.last.metadata.token_count"
)
```

## LesserThanEquals

<div class="autoclass" members="" undoc-members="" show-inheritance="">

LesserThanEquals

</div>

Check if extracted value is less than or equal to expected value.

**Example:**

``` python
from giskard.checks import LesserThanEquals

check = LesserThanEquals(
    name="max_cost",
    expected_value=0.02,
    key="trace.last.metadata.cost"
)
```

# LLM-Based Checks

## BaseLLMCheck

<div class="autoclass" members="" undoc-members="" show-inheritance="">

BaseLLMCheck

</div>

Base class for checks that use LLMs for evaluation.

## Groundedness

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Groundedness

</div>

Check if outputs are grounded in the provided context/inputs.

**Example:**

``` python
from giskard.checks import Groundedness

check = Groundedness(
    name="answer_grounded",
    description="Verify answer is based on context"
)
```

## Conformity

<div class="autoclass" members="" undoc-members="" show-inheritance="">

Conformity

</div>

Check if outputs conform to instructions or specifications.

**Example:**

``` python
from giskard.checks import Conformity

check = Conformity(
    name="follows_instructions",
    description="Ensure response follows the given instructions",
    rule="Always respond in JSON"
)
```

## LLMJudge

<div class="autoclass" members="" undoc-members="" show-inheritance="">

LLMJudge

</div>

Custom LLM-based evaluation with user-defined prompt.

**Example:**

``` python
from giskard.checks import LLMJudge

check = LLMJudge(
    name="tone_check",
    prompt="""
    Evaluate if the response has a professional tone.

    Input: {{ inputs }}
    Output: {{ outputs }}

    Return 'passed: true' if professional, 'passed: false' otherwise.
    """
)
```

SemanticSimilarity \~\~\~\~\~\~\~\~\~\~\~\~\~\~\~\~~

<div class="autoclass" members="" undoc-members="" show-inheritance="">

SemanticSimilarity

</div>

Check if text is semantically similar to the expected content.

**Example:**

``` python
from giskard.checks import SemanticSimilarity

check = SemanticSimilarity(
    name="answer_similarity",
    reference_text="Paris is the capital of France.",
    threshold=0.9
)
```

## LLMCheckResult

<div class="autoclass" members="" undoc-members="" show-inheritance="">

LLMCheckResult

</div>

Result type for LLM-based checks with structured output.

# Custom Check Examples

Creating a custom LLM check:

``` python
from pydantic import BaseModel
from giskard.agents.workflow import TemplateReference
from giskard.checks import BaseLLMCheck, Check, CheckResult, Trace

class CustomEvaluation(BaseModel):
    score: float
    passed: bool
    reasoning: str

@Check.register("custom_eval")
class CustomEvalCheck(BaseLLMCheck):
    threshold: float = 0.8

    def get_prompt(self) -> TemplateReference | str:
        return "Evaluate this: {{ outputs }}"

    @property
    def output_type(self) -> type[BaseModel]:
        return CustomEvaluation

    async def _handle_output(
        self,
        output_value: CustomEvaluation,
        template_inputs: dict,
        trace: Trace,
    ) -> CheckResult:
        if output_value.score >= self.threshold:
            return CheckResult.success(
                message=f"Score {output_value.score} meets threshold"
            )
        return CheckResult.failure(
            message=f"Score {output_value.score} below threshold"
        )
```
