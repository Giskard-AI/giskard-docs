---
title: Async design & pytest
description: "Why Giskard Checks are async-first and how to use them correctly in scripts, pytest, and Jupyter notebooks."
sidebar:
  order: 3
---

`Scenario.run()` and all `Check.run()` methods are `async def`. AI workloads are I/O-bound — LLM calls, embedding APIs — so async lets independent work overlap rather than serialising on the network. This is the core design choice: a suite of ten LLM-heavy scenarios can run in roughly the time of the slowest one, not the sum of all ten.

## Why async throughout

Every check invocation is a potential network call — to an LLM API, an embedding service, or a custom validation endpoint. Making the entire execution path async means:

- **Concurrent scenarios**: a suite's `run(parallel=True)` runs its scenarios concurrently, preserving result order. Use `max_concurrency` to cap how many run at once; the default (`None`) is unbounded, so the provider's rate limits become the effective cap.
- **No blocking**: while one scenario waits on a slow LLM call, others keep making progress on the same event loop.

Concurrency is opt-in at the suite level: `Suite.run()` defaults to `parallel=False` and executes scenarios one after another. Within a single scenario, steps are inherently sequential — each interaction extends the trace the next check reads — and the checks in a step run in order.

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
