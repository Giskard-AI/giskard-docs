---
title: Simulate Users
sidebar:
  order: 6
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/how-to/simulate-users.ipynb)

Use `UserSimulator` to drive multi-turn tests with LLM-generated user inputs.

## 1. Configure a generator

To get started, you need to provide the LLM that will power the simulator.
`UserSimulator` uses a generator to produce each user turn, so the same model
you use for your checks can also drive realistic user behavior.

`UserSimulator` uses an LLM to generate realistic user messages. Set a default
generator once, or pass one inline.

```python
from giskard.checks import set_default_generator
from giskard.agents.generators import Generator

set_default_generator(Generator(model="openai/gpt-4o-mini"))
```

## 2. Create a `UserSimulator` with a persona

With the generator configured, we can now define who the simulated user is. The
`instructions` field acts as a system prompt for the simulator — the more
specific you are about the user's goal and stopping condition, the more
deterministic and useful the generated conversation will be.

Write `instructions` as a persona prompt that tells the simulator who it is and
what it wants.

```python
from giskard.checks.generators.user import UserSimulator

customer = UserSimulator(
    instructions="""
    You are a customer trying to track a delayed order.
    - Start by asking about order #98765
    - Provide your name (Alex) when asked
    - Accept any resolution the support agent offers
    - Stop when the agent confirms a solution
    """,
    max_steps=8,
)
```

`max_steps` limits how many turns the simulator will generate before stopping.

## 3. Use the simulator as `inputs` in `.interact()`

Now we'll wire the simulator into the scenario. Passing the `UserSimulator` as
`inputs` tells the scenario to call it on each turn rather than using a fixed
string — the scenario handles the loop automatically up to `max_steps`.

Pass the `UserSimulator` instance as the `inputs` argument. The scenario will
call it repeatedly to generate each user turn.

```python
from giskard.checks import Scenario, from_fn

scenario = (
    Scenario("order_tracking")
    .interact(
        inputs=customer,
        outputs=lambda inputs: support_agent(inputs),
    )
    .check(
        from_fn(
            lambda trace: any(
                word in trace.last.outputs.lower()
                for word in ["resolved", "refund", "replacement", "shipped"]
            ),
            name="resolution_offered",
        )
    )
)
```

## 4. Run the scenario and inspect the trace

With the scenario built, run it and iterate over the trace to see the full
conversation the simulator generated. This is especially useful when debugging a
failing check — you can see exactly what the simulated user said at each step.

```python
result = await scenario.run()

# Print every turn
for turn in result.trace.interactions:
    print(f"User:  {turn.inputs}")
    print(f"Agent: {turn.outputs}")
    print()
```

## 5. Check `goal_reached` from simulator metadata

After the scenario finishes, the simulator writes a `UserSimulatorOutput` into
the last interaction's metadata. This tells you whether the user's stated goal
was achieved — a stronger signal than just checking whether the scenario passed
its checks, because it reflects the simulator's own evaluation of the
conversation outcome.

```python
from giskard.checks.generators.user import UserSimulatorOutput

last = result.trace.last
simulator_output = last.metadata.get("simulator_output")

if isinstance(simulator_output, UserSimulatorOutput):
    print(f"Goal reached: {simulator_output.goal_reached}")
    print(f"Message: {simulator_output.message}")
```

Use `goal_reached` as an additional assertion:

```python
assert simulator_output.goal_reached, simulator_output.message
```

## 6. Swap personas for A/B testing

With a single persona working, we can now run the same agent against multiple
user types simultaneously. Each persona exercises a different interaction style,
and running them concurrently with `asyncio.gather` means you get results for
all three in roughly the time it takes to complete one.

Run the same agent against multiple user types to surface persona-specific
failures.

```python
import asyncio

personas = [
    (
        "impatient",
        "You are impatient. Keep messages short. Escalate quickly if not helped.",
    ),
    (
        "detailed",
        "You are thorough. Ask many follow-up questions before accepting any solution.",
    ),
    (
        "confused",
        "You are unsure what you need. Describe symptoms, not the actual problem.",
    ),
]


async def run_persona(name, instructions):
    sim = UserSimulator(instructions=instructions, max_steps=6)
    scenario = Scenario(name).interact(
        inputs=sim,
        outputs=lambda inputs: support_agent(inputs),
    )
    return name, await scenario.run()


results = await asyncio.gather(*[run_persona(n, i) for n, i in personas])

for name, result in results:
    print(f"{name}: {'PASSED' if result.passed else 'FAILED'}")
```

## Next steps

- [Generators reference](/oss/checks/reference/generators/) — full
  `UserSimulator` parameter reference
- [Multi-turn testing tutorial](/oss/checks/tutorials/multi-turn/) — multi-turn
  scenario basics
- [Debug with Spy](/oss/checks/how-to/spy-on-calls/) — inspect what happens
  inside each interaction
