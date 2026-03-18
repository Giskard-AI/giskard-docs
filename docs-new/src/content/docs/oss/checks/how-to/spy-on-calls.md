---
title: Debug with Spy
sidebar:
  order: 7
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/spy-on-calls.ipynb)

`WithSpy` wraps an `InteractionSpec` and patches a target function — identified
by its import path — with a `MagicMock`. After each interaction completes, the
mock's call history (`call_count`, `call_args`, etc.) is injected into
`Interaction.metadata` under the `target` key, and the mock is reset before the
next interaction. Use it to verify that internal calls happen with the right
arguments — for example, that a database query inside a tool call received the
expected parameters.

## 1. Import `WithSpy` and `Interact`

To get started, import the two building blocks you'll need. `Interact` is the
low-level interaction spec that `.interact()` wraps under the hood, and
`WithSpy` is the decorator that captures values from a specified path during
execution.

```python
from giskard.checks import Scenario, Interact, WithSpy
```

## 2. Create a normal interaction spec

Next, define the interaction exactly as you would for a regular `.interact()`
call. This step is unchanged — `WithSpy` wraps around it rather than replacing
it, so your existing interaction logic stays the same.

Define your interaction as you normally would with `Interact`.

```python
def call_llm(text: str) -> str:
    # This is the function we will spy on
    return f"Our return policy allows returns within 30 days. {text}"


def my_agent(inputs: str) -> str:
    # The function under test — delegates to call_llm internally
    return call_llm(inputs)


interaction_spec = Interact(
    inputs="What is the return policy?",
    outputs=my_agent,
)
```

## 3. Wrap it with `WithSpy`

Now wrap the interaction spec with `WithSpy`. The `target` parameter is a
dot-notation path into the trace that tells the spy which value to record — in
this case, the final output string after the interaction completes.

Pass the spec to `WithSpy` and specify a `target` — a JSONPath expression for
the value you want to capture.

```python
spied_spec = WithSpy(
    interaction_generator=interaction_spec,
    target="__main__.call_llm",  # Python import path for mock.patch
)
```

## 4. Add to the scenario via `.add_interaction()`

With the spied spec ready, add it to your scenario using `.add_interaction()`
rather than the usual `.interact()` shorthand. This distinction exists because
`.interact()` only accepts plain inputs and outputs, while `.add_interaction()`
accepts any `InteractionSpec` — including wrapped ones like `WithSpy`.

Use `.add_interaction()` instead of `.interact()` when passing a `WithSpy` (or
any raw `InteractionSpec`).

```python
from giskard.checks import FnCheck

scenario = (
    Scenario("debug_policy_response")
    .add_interaction(spied_spec)
    .check(
        FnCheck(fn=
            lambda trace: "30 days" in trace.last.outputs.lower(),
            name="mentions_return_window",
        )
    )
)
```

## 5. Run the scenario

```python
result = await scenario.run()
```

## 6. Access `spy_data` from the result

After the scenario runs, the captured data is stored in the last interaction's
metadata under the `target` key. Use `result.final_trace.last.metadata.get(target)`
to retrieve it.

```python
target = "__main__.call_llm"
spy_data = result.final_trace.last.metadata.get(target)
print(spy_data)
```

```
{'call_args_list': [call('What is the return policy?')], 'call_count': 1, 'call_args': call('What is the return policy?'), 'mock_calls': [call('What is the return policy?')]}
```

## 7. Assert on captured values

With the spy data in hand, you can write assertions that go beyond what the
scenario's checks alone can verify — for example, confirming that a specific
value was captured at a critical path, or that the output contained a particular
phrase before any post-processing occurred.

Use the spy data to verify call counts or inspect intermediate values.

```python
# Check that call_llm was called at least once
assert spy_data is not None, "No spy data recorded — check your WithSpy setup"
assert spy_data["call_count"] >= 1, "call_llm was not called"

# Inspect call arguments
if spy_data["call_args"]:
    first_arg = spy_data["call_args"].args[0]
    print(f"call_llm was called with: {first_arg!r}")

```

```
call_llm was called with: 'What is the return policy?'
```

## Complete example

Now we'll consolidate all the steps above into a single runnable function. This
example is self-contained so you can drop it into your project and verify the
end-to-end flow before adapting it to your own agent.

```python
import asyncio
from giskard.checks import Scenario, Interact, WithSpy, FnCheck


def call_llm_internal(text: str) -> str:
    # Replace with your actual LLM call
    return f"Our return policy is 30 days from purchase. {text}"


def my_support_agent(inputs: str) -> str:
    return call_llm_internal(inputs)


async def debug_scenario():
    interaction_spec = Interact(
        inputs="What is your return policy?",
        outputs=my_support_agent,
    )

    spied_spec = WithSpy(
        interaction_generator=interaction_spec,
        target="__main__.call_llm_internal",  # Python import path
    )

    scenario = (
        Scenario("return_policy_debug")
        .add_interaction(spied_spec)
        .check(
            FnCheck(fn=
                lambda trace: "30 days" in trace.last.outputs.lower(),
                name="mentions_return_window",
            )
        )
    )

    result = await scenario.run()

    # Inspect spy data (stored in metadata under the target key)
    target = "__main__.call_llm_internal"
    spy_data = result.final_trace.last.metadata.get(target)
    print(f"call_llm called {spy_data["call_count"]} time(s)")
    print(f"Test passed: {result.passed}")

    return result


asyncio.run(debug_scenario())
```

```
call_llm called 1 time(s)
Test passed: False



[1;31m──────────────────────────────────────────────────── [0m❌ FAILED[1;31m ────────────────────────────────────────────────────[0m
[1;31mmentions_return_window[0m  [31mFAIL[0m
No specific error message provided
[1;31m────────────────────────────────────────────────────── [0mTrace[1;31m ──────────────────────────────────────────────────────[0m
[1m────────────────────────────────────────────────── [0mInteraction [1;36m1[0m[1m ──────────────────────────────────────────────────[0m
Inputs: [32m'What is your return policy?'[0m
Outputs: [1m<[0m[1;95mMagicMock[0m[39m [0m[33mname[0m[39m=[0m[32m'mock[0m[32m([0m[32m)[0m[32m'[0m[39m [0m[33mid[0m[39m=[0m[32m'4754003952'[0m[1m>[0m
[1;31m────────────────────────────────────────────────── [0m[1;36m1[0m step in 0ms[1;31m ──────────────────────────────────────────────────[0m
```

`WithSpy` is a debugging tool. Remove it (or replace `.add_interaction()` with
`.interact()`) before committing tests to CI. Spy wrappers add overhead and
capture data that has no value in passing production test runs.

## Next steps

- [Testing Utilities reference](/oss/checks/reference/testing-utils/) — full
  `WithSpy` API reference
- [Single-turn testing tutorial](/oss/checks/tutorials/single-turn/) — scenario
  basics without the spy wrapper
- [Simulate Users](/oss/checks/how-to/simulate-users/) — once your interactions
  work, add dynamic user simulation
