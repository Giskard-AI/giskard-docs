---
title: Testing Structured Outputs
sidebar:
  order: 8
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/structured-output.ipynb)

Many AI systems return structured data — Pydantic models, JSON objects, or
nested dicts — rather than plain strings. This guide shows how to validate
individual fields, assert types, and check nested values using `Equals`,
`FnCheck`, and JSONPath extraction.

## The system under test

To get started, we'll define the extraction function that all subsequent tests
will target. Returning a Pydantic model rather than a raw dict gives you typed
field access in your check lambdas and makes the test code much easier to read.

We'll use a simple information-extraction function that returns a Pydantic
model:

```python
from pydantic import BaseModel


class PersonInfo(BaseModel):
    name: str
    age: int
    email: str
    occupation: str


def extract_info(text: str) -> PersonInfo:
    # Your extraction system (LLM, regex, etc.)
    return PersonInfo(
        name="Maria Lopez",
        age=52,
        email="maria.lopez@acmebank.com",
        occupation="Chief Risk Officer",
    )
```

The same pattern applies to any callable that returns a dict, dataclass, or
Pydantic model.

## Check an exact field value

With the extraction function defined, we can now write our first assertion.
`Equals` is the right choice here because we have a ground-truth value we expect
the model to reproduce exactly — no fuzzy matching needed.

Use `Equals` with a `key` path to assert a specific field:

```python
from giskard.checks import Scenario, Equals

tc = (
    Scenario("extract_name")
    .interact(
        inputs=(
            "Maria Lopez, 52, Chief Risk Officer at ACME Bank. "
            "Email: maria.lopez@acmebank.com"
        ),
        outputs=lambda inputs: extract_info(inputs),
    )
    .check(
        Equals(
            name="correct_name",
            expected_value="Maria Lopez",
            key="trace.last.outputs.name",
        )
    )
    .check(
        Equals(
            name="correct_age",
            expected_value=52,
            key="trace.last.outputs.age",
        )
    )
)

result = await tc.run()
```

The `key` uses dot notation to navigate into the output object. Both attribute
access (`outputs.name`) and dict access (`outputs["name"]`) are supported.

## Check with a predicate

Next, we'll verify fields where the correct value isn't a single fixed string.
`FnCheck` lets you express any boolean predicate, so you can validate format
constraints like email structure or numeric bounds without hard-coding the exact
output.

When you need more than equality — a range, a regex, a format check — use
`FnCheck`:

```python
from giskard.checks import FnCheck

tc = (
    Scenario("extract_email")
    .interact(
        inputs=(
            "Maria Lopez, 52, Chief Risk Officer at ACME Bank. "
            "Email: maria.lopez@acmebank.com"
        ),
        outputs=lambda inputs: extract_info(inputs),
    )
    .check(
        FnCheck(fn=
            lambda trace: "@" in trace.last.outputs.email,
            name="valid_email_format",
            success_message="Email contains @",
            failure_message="Invalid email format",
        )
    )
    .check(
        FnCheck(fn=
            lambda trace: 18 <= trace.last.outputs.age <= 120,
            name="reasonable_age",
            success_message="Age is in valid range",
            failure_message="Age out of valid range",
        )
    )
)
```

## Check nested structures

When your output contains objects nested several levels deep — or lists — dot
notation alone can be ambiguous. The `resolve` helper traverses both attribute
access and dict-style access uniformly, and returns a `NoMatch` sentinel instead
of raising an exception when a path doesn't exist.

For deeply nested data, use the `resolve` helper from
`giskard.checks.core.extraction`:

```python
from pydantic import BaseModel
from giskard.checks import Scenario, FnCheck
from giskard.checks.core.extraction import resolve, NoMatch


class Address(BaseModel):
    street: str
    city: str
    country: str


class Contact(BaseModel):
    name: str
    address: Address
    tags: list[str]


def extract_contact(text: str) -> Contact:
    return Contact(
        name="Jane Smith",
        address=Address(street="123 Main St", city="London", country="UK"),
        tags=["vip", "enterprise"],
    )


tc = (
    Scenario("nested_extraction")
    .interact(
        inputs="Jane Smith, 123 Main St, London, UK. Tags: VIP, Enterprise.",
        outputs=lambda inputs: extract_contact(inputs),
    )
    .check(
        FnCheck(fn=
            lambda trace: (
                trace.last.outputs.address.city == "London"
            ),
            name="correct_city",
        )
    )
    .check(
        FnCheck(fn=
            lambda trace: ("vip" in resolve(trace, "trace.last.outputs.tags")),
            name="has_vip_tag",
        )
    )
)
```

## Check a classification output

Building on the predicate pattern, we can now apply it to classification tasks
where the output carries both a categorical label and a numeric confidence.
Combining `Equals` for the label with a threshold check for confidence gives you
a complete quality gate in a single scenario.

For classification tasks, validate both the predicted label and the confidence
score:

```python
from pydantic import BaseModel
from giskard.checks import Scenario, Equals, FnCheck


class Classification(BaseModel):
    label: str
    confidence: float


def classify(text: str) -> Classification:
    return Classification(label="potential_fraud", confidence=0.95)


tc = (
    Scenario("fraud_classification")
    .interact(
        inputs=(
            "The wire transfer was not authorized. "
            "Please investigate immediately."
        ),
        outputs=lambda inputs: classify(inputs),
    )
    .check(
        Equals(
            name="correct_label",
            expected_value="potential_fraud",
            key="trace.last.outputs.label",
        )
    )
    .check(
        FnCheck(fn=
            lambda trace: trace.last.outputs.confidence >= 0.8,
            name="high_confidence",
            success_message="Confidence meets threshold",
            failure_message="Confidence below 0.8 threshold",
        )
    )
)
```

## Full test suite

Now we'll bring all the individual checks together into a suite class that runs
them concurrently. Notice that each scenario constructs its own `Scenario` at
init time with the `extractor` injected — this makes the suite easy to reuse
against a different extraction function without changing any test logic.

Group multiple extraction checks into a suite for concurrent execution:

```python
import asyncio
from giskard.checks import Scenario, Equals, FnCheck


class ExtractionTestSuite:
    def __init__(self, extractor):
        self.name_check = (
            Scenario("name_extraction")
            .interact(
                inputs=(
                    "Maria Lopez, 52, Chief Risk Officer at ACME Bank. "
                    "Email: maria.lopez@acmebank.com"
                ),
                outputs=lambda inputs: extractor(inputs),
            )
            .check(
                Equals(
                    name="correct_name",
                    expected_value="Maria Lopez",
                    key="trace.last.outputs.name",
                )
            )
        )

        self.email_check = (
            Scenario("email_extraction")
            .interact(
                inputs=(
                    "Maria Lopez, 52, Chief Risk Officer at ACME Bank. "
                    "Email: maria.lopez@acmebank.com"
                ),
                outputs=lambda inputs: extractor(inputs),
            )
            .check(
                FnCheck(fn=
                    lambda trace: "@" in trace.last.outputs.email,
                    name="valid_email",
                )
            )
        )

        self.age_check = (
            Scenario("age_extraction")
            .interact(
                inputs=(
                    "Maria Lopez, 52, Chief Risk Officer at ACME Bank. "
                    "Email: maria.lopez@acmebank.com"
                ),
                outputs=lambda inputs: extractor(inputs),
            )
            .check(
                Equals(
                    name="correct_age",
                    expected_value=52,
                    key="trace.last.outputs.age",
                )
            )
        )

    async def run_all(self):
        return await asyncio.gather(
            self.name_check.run(),
            self.email_check.run(),
            self.age_check.run(),
        )


results = await ExtractionTestSuite(extract_info).run_all()
passed = sum(1 for r in results if r.passed)
print(f"Results: {passed}/{len(results)} passed")
```

## Next steps

- [Batch Evaluation](/oss/checks/how-to/batch-evaluation/) — run the same
  check against many inputs and aggregate results
- [Custom Checks](/oss/checks/how-to/custom-checks/) — build reusable field
  validators with Pydantic parameters
- [Checks Reference](/oss/checks/reference/checks/) — full list of built-in
  checks
