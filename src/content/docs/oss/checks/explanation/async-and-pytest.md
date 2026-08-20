---
title: Async design & pytest
description: "Why Giskard Checks are async-first and how to use them correctly in scripts, pytest, and Jupyter notebooks."
sidebar:
  order: 3
---

`Suite.run()`, `Scenario.run()`, and all `Check.run()` methods are `async def`. Use a suite to run scenarios. Async lets the library await LLM calls and other I/O.

## What actually runs concurrently

- **Checks inside a scenario run one after another.** The test-case runner awaits each check in a plain `for` loop. Ten LLM checks on one scenario cost ten sequential LLM calls.
- **Interactions inside a scenario run in order.** A multi-turn scenario has to, because each turn depends on the previous one.
- **Suites run scenarios serially by default.** `Suite.run()` defaults to `parallel=False`.

To overlap scenarios, opt in:

```python
# Run every scenario in the suite at once
result = await suite.run(parallel=True)

# Cap how many run at the same time
result = await suite.run(parallel=True, max_concurrency=4)
```

`parallel=True` schedules every scenario as a task and preserves result order. `max_concurrency` is the cap on how many run at once; `None` (the default) is unbounded, which means your LLM provider's rate limit becomes the real cap. Start with a small explicit number if you are hitting 429s.

Checks and turns inside one scenario stay sequential.

The tradeoff of async is that you need an event loop to call `Scenario.run()`. Giskard Checks works in scripts, pytest, and notebooks, each of which provides the loop differently. See [Run Tests with pytest](/oss/checks/how-to/run-in-pytest) for the setup steps.

## Common pitfalls

```python
# Wrong — run() returns a coroutine, not a result
result = test_scenario.run()


# Wrong — can't nest asyncio.run() inside an async function
async def my_func():
    result = asyncio.run(test_scenario.run())


# Correct in a script
result = asyncio.run(test_scenario.run())

# Correct in pytest / notebook / async function
result = await test_scenario.run()
```
