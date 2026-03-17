---
title: Run Tests with pytest
sidebar:
  order: 5
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/run-in-pytest.ipynb)

Configure pytest to run async Giskard Checks tests with `pytest-asyncio`.

## 1. Install dependencies

To get started, install the three packages needed to run async tests in pytest.
`pytest-asyncio` is what bridges the gap between pytest's synchronous test
runner and Giskard's async `Scenario.run()` method.

```bash
pip install pytest pytest-asyncio giskard-checks
```

## 2. Configure `asyncio_mode`

Add `asyncio_mode = auto` so every `async def test_*` function runs
automatically without a per-test decorator.

**`pytest.ini`:**

```ini
[pytest]
asyncio_mode = auto
```

**`pyproject.toml`:**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

## 3. Write your first async test

With the configuration in place, your test functions can now use `async def` and
`await` directly. Notice that the `assert result.passed` at the end is what
turns a Giskard result into a pytest failure — without it, pytest would consider
the test passed regardless of the scenario outcome.

```python
# test_chatbot.py
from giskard.checks import Scenario, StringMatching


async def test_greeting_response():
    scenario = (
        Scenario("greeting")
        .interact(
            inputs="Hello!",
            outputs=lambda inputs: my_chatbot(inputs),
        )
        .check(StringMatching(pattern=r"hi|hello|hey", name="has_greeting"))
    )

    result = await scenario.run()
    assert result.passed
```

## 4. Share generator config with a `conftest.py` fixture

Next, we'll avoid duplicating LLM configuration across test files by moving it
into a shared `conftest.py`. The `scope="session"` setting means the generator
is configured once per test run, not once per test — important when your test
suite has dozens of LLM-backed checks.

Avoid repeating `set_default_generator()` in every test file by calling it once
in a session-scoped fixture.

```python
# conftest.py
import pytest
from giskard.checks import set_default_generator
from giskard.agents.generators import Generator


@pytest.fixture(scope="session", autouse=True)
def configure_generator():
    set_default_generator(Generator(model="openai/gpt-4o-mini"))
```

With `autouse=True` the fixture runs before any test in the session without
requiring an explicit parameter.

## 5. Parametrize for data-driven tests

With the generator configured, we can now scale up to data-driven tests. Each
parametrized case gets its own entry in the pytest output, so when one question
fails you can see exactly which input caused it without digging through a
combined result object.

Use `@pytest.mark.parametrize` to run the same scenario against multiple inputs.

```python
import pytest
from giskard.checks import Scenario, StringMatching

test_cases = [
    ("What is the capital of France?", r"Paris"),
    ("What is 2 + 2?", r"4"),
    ("Who wrote Hamlet?", r"Shakespeare"),
]


@pytest.mark.parametrize("question,pattern", test_cases)
async def test_factual_answers(question, pattern):
    scenario = (
        Scenario(f"factual_{question[:20]}")
        .interact(
            inputs=question,
            outputs=lambda inputs: my_agent(inputs),
        )
        .check(StringMatching(pattern=pattern, name="correct_answer"))
    )

    result = await scenario.run()
    assert result.passed, f"Failed for question: {question}"
```

## 6. Run the tests

With everything wired up, you can now execute your suite with a single command.
The `-v` flag prints each test name and its result individually, making it easy
to spot which parametrized case failed.

```bash
pytest -v
```

Expected output:

```
test_chatbot.py::test_greeting_response PASSED
test_factual.py::test_factual_answers[What is the capital of France?-Paris] PASSED
test_factual.py::test_factual_answers[What is 2 + 2?-4] PASSED
test_factual.py::test_factual_answers[Who wrote Hamlet?-Shakespeare] PASSED
```

As shown above, each parametrized case appears on its own line so failures are
immediately identifiable. Run a single file or test by name:

```bash
pytest test_chatbot.py -v
pytest -k "factual" -v
```

## Next steps

- [Async design & pytest](/oss/checks/explanation/async-and-pytest/) — why
  `Scenario.run()` is async
- [Single-turn testing tutorial](/oss/checks/tutorials/single-turn/) — the
  scenario patterns used above
- [Simulate Users](/oss/checks/how-to/simulate-users/) — drive multi-turn tests
  with LLM-generated inputs
