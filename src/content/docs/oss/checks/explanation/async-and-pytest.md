---
title: Async design & pytest
description: "Why Giskard Checks are async-first and how to use them correctly in scripts, pytest, and Jupyter notebooks."
sidebar:
  order: 3
---

`Scenario.run()` and all `Check.run()` methods are `async def`. AI workloads are I/O-bound — LLM calls, embedding APIs — so async lets multiple checks and interactions run concurrently rather than one at a time. This is the core design choice: a suite with ten LLM-based checks runs in roughly the time of a single check, not ten.

## Why async throughout

Every check invocation is a potential network call — to an LLM API, an embedding service, or a custom validation endpoint. Making the entire execution path async means:

- **Concurrent checks**: multiple checks on the same scenario run with `asyncio.gather`, not sequentially.
- **Concurrent scenarios**: a suite's `run_all()` also uses `asyncio.gather`, so all scenarios run in parallel.
- **No blocking**: a slow LLM call in one check does not delay other checks from making progress.

The tradeoff is that you need an event loop to call `Scenario.run()`. Giskard Checks works in three environments — scripts, pytest, and notebooks — each of which provides the loop differently. See [Run Tests with pytest](/oss/checks/how-to/run-in-pytest) for the setup steps.

## Common Pitfalls

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
