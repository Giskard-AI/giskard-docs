---
title: Troubleshooting
description: "The errors you are most likely to hit on a first run with Giskard: what each message means, why it happens, and how to fix it."
---

The errors below are the ones a first run tends to produce. Each entry quotes the message as the library raises it.

## Symptom table

| Message                                                                                         | Cause                                                                                                                                                | Fix                                                       |
| :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| `WorkflowError: Step processing failed`                                                         | A judged check or a generator called an LLM and the provider call failed — most often no API key, or a model string the provider does not recognize. | [Configure a provider](#no-api-key-or-a-bad-model-string) |
| `ValueError: Provider 'x' is not configured and not in the registry.`                           | `Generator` routes only to the native providers.                                                                                                     | [Use LiteLLM](#unknown-provider)                          |
| `ValidationError … Invalid JSONPath expression 'last.outputs': path must start with 'trace.'`   | Every `*_key` is a JSONPath rooted at the trace.                                                                                                     | [Prefix the path](#jsonpath-must-start-with-trace)        |
| A check ERRORs with `No value found for key 'trace.last.outputs.zz'`                            | The path is valid but matched nothing.                                                                                                               | [Fix the path](#a-path-that-matches-nothing)              |
| `ValidationError … Extra inputs are not permitted [type=extra_forbidden]`                       | Checks reject unknown fields.                                                                                                                        | [Check the field name](#unknown-field-on-a-check)         |
| `TypeError: Parameter 'x' is required but not in the injection requirements.`                   | Callback parameter names are load-bearing.                                                                                                           | [Rename the parameter](#wrong-callback-parameter-name)    |
| `RuntimeError: asyncio.run() cannot be called from a running event loop`                        | `asyncio.run` inside a notebook or another async context.                                                                                            | [Await instead](#asyncio-run-inside-a-running-loop)       |
| `InputGenerationException: generation failed at turn N after M attempt(s)`                      | A `UserSimulator` or `LLMGenerator` was refused or blocked on every retry.                                                                           | [Adjust the generator](#the-user-simulator-gave-up)       |
| `TypeError: from_fn callable must return bool or CheckResult (or awaitable thereof), but got …` | A custom function check returned something else.                                                                                                     | [Return a bool](#custom-function-returned-the-wrong-type) |
| `ValidationError: The 'textstat' package is required for the Readability check.`                | Optional dependency missing.                                                                                                                         | [Install the extra](#missing-optional-dependency)         |
| `ModuleNotFoundError: No module named 'giskard.checks'` right after a clean install             | The environment is on Python 3.11 or older, so pip installed Giskard v2 instead.                                                                     | [Use Python 3.12+](#pip-installed-v2-instead-of-v3)       |
| `ImportError: Package conflict detected: The legacy package 'giskard' is installed …`           | Giskard v2 is installed alongside v3.                                                                                                                | [Uninstall v2](#giskard-v2-installed-alongside-v3)        |

## No API key, or a bad model string

```text
giskard.agents.errors.workflow_errors.WorkflowError: Step processing failed
```

Every judged check (`Groundedness`, `Conformity`, `Contradiction`, `Toxicity`, `AnswerRelevance`, `LLMJudge`), every scan generator, and `UserSimulator` calls an LLM. The provider error is wrapped, so the message does not name the key or the model.

Check three things:

1. The provider extra is installed: `pip install --pre "giskard[openai]"`.
2. The matching key is set: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), or the Azure trio.
3. The model string exists at that provider. The library default is `openai/gpt-4o-mini`; nothing validates a custom string before the call.

```python
from giskard.agents.generators import Generator
from giskard.checks import set_default_generator

set_default_generator(Generator(model="openai/gpt-4o-mini"))
```

`SemanticSimilarity` is not a judge but still calls an embeddings API, so it fails the same way without a key.

For a path with no key at all, use the deterministic checks — `Equals`, `StringMatching`, `RegexMatching`, `JsonValid`, `FnCheck`, `AllOf`/`AnyOf`/`Not`, `RegoPolicy` — as in [Your First Test](/oss/checks/tutorials/your-first-test).

## Unknown provider

```text
ValueError: Provider 'mistral' is not configured and not in the registry.
```

`Generator` (also exported as `GiskardLLMGenerator`) routes to the native providers only: `openai`, `google`/`gemini`, `anthropic`, `azure`, `azure_ai`. Anything else needs a different class:

```python
from giskard.agents.generators import LiteLLMGenerator
from giskard.checks import set_default_generator

set_default_generator(LiteLLMGenerator(model="ollama/llama3"))
```

Install it with `pip install --pre "giskard[litellm]"`. Provider construction is lazy, so this error surfaces on the first LLM call, not at setup.

## JSONPath must start with `trace.`

```text
pydantic_core.ValidationError: 1 validation error for Equals
target_key
  Value error, Invalid JSONPath expression 'last.outputs': path must start with 'trace.'
```

Every `*_key` parameter is validated as a JSONPath rooted at the trace. Write `trace.last.outputs`, not `last.outputs`. This one is raised at construction time, which is the good case.

## A path that matches nothing

A syntactically valid path that matches nothing does not raise. Extraction returns a `NoMatch` sentinel, and the check reports ERROR with a message naming the key:

```text
ERROR   No value found for key 'trace.last.outputs.zz', expected a value equal to 'Paris'.
```

The wording varies with the check — `StringMatching` says `text key`, `SemanticSimilarity` says `actual answer key` or `reference text key` — but the key is always quoted in full.

If your outputs are a Pydantic model, remember that resolution runs against `trace.model_dump()` — it sees dicts, so the path is `trace.last.outputs.answer`, not an attribute chain on your class. Print `result.print_report()` and read the check message before assuming the assertion itself is wrong.

A wildcard, slice, or descendant path (`trace.interactions[*].outputs`) resolves to a **list** of every match. Comparison checks compare against that list as a whole unless you pass `match="any"`, `"all"`, or `"none"`.

## Unknown field on a check

```text
pydantic_core.ValidationError: 1 validation error for Equals
expected
  Extra inputs are not permitted [type=extra_forbidden]
```

`Check` sets `extra="forbid"` on purpose: a persisted suite that referenced a renamed field would otherwise fall back to the default and run green while evaluating the wrong value. Look up the exact field name in the [checks reference](/oss/checks/reference/checks) — `Equals` takes `expected_value`, not `expected`.

`Scenario` deliberately does _not_ forbid extras, so the same typo in a scenario constructor is accepted silently.

## Wrong callback parameter name

```text
TypeError: Parameter 'foo' is required but not in the injection requirements.
```

Giskard injects callback arguments **by name**. For `outputs` (and a bound target), the accepted names are `inputs` and `trace`; for `inputs`, they are `trace` and `input_type`. Any other required parameter raises. `lambda foo: ...` fails; `lambda inputs: ...` works. Parameters with defaults are left alone.

## `asyncio.run` inside a running loop

```text
RuntimeError: asyncio.run() cannot be called from a running event loop
```

Notebooks already run an event loop. Inside a notebook, `await scenario.run()` directly. In a `.py` script, the reverse applies — a bare top-level `await` is a `SyntaxError` — so wrap it:

<!-- pyright-skip: illustrative fragment: scenario and asyncio come from the reader's own file -->

```python
async def main():
    result = await scenario.run()
    result.print_report()


asyncio.run(main())
```

`asyncio.run(asyncio.gather(...))` fails too, with `ValueError: a coroutine was expected`. Gather inside `main()`:

<!-- pyright-skip: illustrative fragment: scenarios and asyncio come from the reader's own file -->

```python
async def main():
    return await asyncio.gather(*(s.run() for s in scenarios))


results = asyncio.run(main())
```

## The user simulator gave up

```text
InputGenerationException: generation failed at turn 3 after 2 attempt(s)
```

`UserSimulator` and `LLMGenerator` retry when the provider refuses or policy-blocks a generation, then raise. Usually the persona or goal reads as a request the provider will not produce. Soften the persona, or raise `max_retries`. Unrelated provider errors are re-raised as-is rather than retried.

## Custom function returned the wrong type

```text
TypeError: from_fn callable must return bool or CheckResult (or awaitable thereof), but got str (value: 'ok')
```

`FnCheck` and `from_fn` accept a `bool`, a `CheckResult`, or an awaitable of either. Returning a truthy string or `None` is an error, not a pass.

## Missing optional dependency

```text
ValidationError: The 'textstat' package is required for the Readability check.
Install it with: pip install 'giskard-checks[readability]'
```

Two checks have optional dependencies:

- `Readability` needs `textstat`: `pip install --pre "giskard[all-checks]"`.
- `RegoPolicy` needs `regorus`: `pip install --pre "giskard[regorus]"`. It is unavailable on Windows and on linux/aarch64.

## pip installed v2 instead of v3

```text
ModuleNotFoundError: No module named 'giskard.checks'
```

v3 declares `requires-python = ">=3.12"`. On an older interpreter pip skips it silently and resolves to the newest release that does fit, which is Giskard v2 — the install succeeds and only the import fails. Check what you actually got:

```bash
python -V
pip show giskard
```

If the version starts with `2.`, recreate the environment on Python 3.12 or newer and reinstall.

## Giskard v2 installed alongside v3

```text
ImportError: Package conflict detected: The legacy package 'giskard' is installed
and conflicts with the new namespace structure provided by 'giskard-core'.
```

The v2 distribution occupies the same `giskard` import namespace. Run `pip uninstall giskard` in that environment, then reinstall with `pip install --pre "giskard[openai]"`. If you still need v2 features, keep them in a separate virtualenv.

## Still stuck?

- Questions and individual support: the [Giskard Discord ↗](https://discord.com/invite/ABvfpbu69R).
- Reproducible bugs and feature requests: the [issue tracker ↗](https://github.com/Giskard-AI/giskard-oss/issues) — see [Reporting a bug](/oss/contributing#reporting-a-bug) for what to include.
- Security vulnerabilities: `security@giskard.ai` or a private advisory, never a public issue.
