---
title: Debug with Spy
sidebar:
  order: 7
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/spy-on-calls.ipynb)

Inspect function calls made during scenario execution using `WithSpy` to
diagnose unexpected behavior.

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
def my_agent(inputs: str) -> str:
    # The function under test
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
    target="trace.last.outputs",
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
from giskard.checks import from_fn

scenario = (
    Scenario("debug_policy_response")
    .add_interaction(spied_spec)
    .check(
        from_fn(
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
target = "trace.last.outputs"
spy_data = result.final_trace.last.metadata.get(target)
print(spy_data)
```

## 7. Assert on captured values

With the spy data in hand, you can write assertions that go beyond what the
scenario's checks alone can verify — for example, confirming that a specific
value was captured at a critical path, or that the output contained a particular
phrase before any post-processing occurred.

Use the spy data to verify call counts or inspect intermediate values.

```python
# Check that the agent was called
assert spy_data is not None, "No spy data recorded — check your WithSpy setup"

# Inspect what was captured (call_args.args[0] for the last call's first argument)
captured_output = spy_data["call_args"].args[0] if spy_data["call_args"] else None
print(f"Captured output: {captured_output}")

# Assert on content
assert (
    "return" in str(captured_output).lower()
), f"Expected output to mention returns, got: {captured_output}"
```

## Complete example

Now we'll consolidate all the steps above into a single runnable function. This
example is self-contained so you can drop it into your project and verify the
end-to-end flow before adapting it to your own agent.

```python
import asyncio
from giskard.checks import Scenario, Interact, WithSpy, from_fn


def my_support_agent(inputs: str) -> str:
    # Replace with your actual agent call
    return f"Our return policy is 30 days from purchase. {inputs}"


async def debug_scenario():
    interaction_spec = Interact(
        inputs="What is your return policy?",
        outputs=my_support_agent,
    )

    spied_spec = WithSpy(
        interaction_generator=interaction_spec,
        target="trace.last.outputs",
    )

    scenario = (
        Scenario("return_policy_debug")
        .add_interaction(spied_spec)
        .check(
            from_fn(
                lambda trace: "30 days" in trace.last.outputs.lower(),
                name="mentions_return_window",
            )
        )
    )

    result = await scenario.run()

    # Inspect spy data (stored in last interaction's metadata under the target key)
    target = "trace.last.outputs"
    spy_data = result.final_trace.last.metadata.get(target)
    print(f"Spy data: {spy_data}")
    print(f"Test passed: {result.passed}")

    return result


asyncio.run(debug_scenario())
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
