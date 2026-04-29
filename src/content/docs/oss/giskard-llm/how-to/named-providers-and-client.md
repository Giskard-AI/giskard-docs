---
title: Named providers & LLMClient
description: "Register multiple backends, defer secrets from env vars, and use aresponse with the same routing."
sidebar:
  order: 1
---

This guide solves a common **work-mode** problem: switching between staging and production keys, onboarding several tenants, or running tests against different vendor accounts—without rewriting call sites.

## When to use `LLMClient`

Use **`LLMClient`** when:

- Multiple **logical backends** exist (staging vs prod, tenant A vs B).
- You want **explicit configuration** beside automatic env defaults.
- You need **`configure_from_dict`** to hydrate clients from YAML/JSON configs.

Prefer **module-level** `acompletion` / `aembedding` / `aresponse` when a single credential set from the environment is enough (see [Quickstart](/oss/giskard-llm/quickstart)).

## Register named aliases

```python
from giskard.llm import LLMClient

client = LLMClient()

client.configure(
    "openai-staging",
    provider="openai",
    api_key="sk-staging...",  # pragma: allowlist secret
)

client.configure(
    "anthropic-prod",
    provider="anthropic",
    api_key="os.environ/ANTHROPIC_API_KEY",  # pragma: allowlist secret
)
```

- **`configure(name, …)`**: `name` becomes the prefix in **`name/model`** strings. Omit `provider` when the alias matches a built-in type (`openai`, `anthropic`, …).
- **`os.environ/VAR` strings** resolve at **runtime** via [`_resolve_value` in routing](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/src/giskard/llm/routing.py); use them to avoid hard-coding secrets.

Call through the client:

```python
resp = await client.acompletion(
    "openai-staging/gpt-4o",
    [{"role": "user", "content": "ping"}],
)
```

## Bulk configuration

To load many connections at once (for example from settings loaded at startup):

```python
client.configure_from_dict(
    {
        "openai-staging": {
            "provider": "openai",
            "api_key": "sk-...",
        },  # pragma: allowlist secret
        "azure-prod": {
            "provider": "azure",
            "api_key": "os.environ/AZURE_PROD_KEY",  # pragma: allowlist secret
            "base_url": "os.environ/AZURE_PROD_ENDPOINT",
            "api_version": "2024-02-01",
        },
    }
)
```

## Stateful responses API

When a provider implements **`ResponseProvider`**, you can call **`aresponse`** for OpenAI Responses / Gemini Interactions style flows:

```python
result = await client.aresponse(
    "openai-staging/gpt-4.1-mini",
    "Summarize this in one line: ...",
)
```

The exact shape of `ResponseResult` is provider-specific on the wire but normalized in giskard-llm types—see [Responses / Interactions reference](/oss/giskard-llm/reference/responses).

## Resetting state in tests

`reset()` clears the **default** client’s cached providers and configs (handy in pytest between cases). For **isolated** tests, instantiate a fresh `LLMClient()` instead of relying on globals.

## See also

- Provider capabilities and env defaults: [Provider matrix](/oss/giskard-llm/reference/providers#provider-matrix)
- Chat vs Responses / Interactions (`acompletion` vs `aresponse`): [Response API gap explanation](/oss/giskard-llm/explanation/response-api-gap)
- Why tool JSON looks like OpenAI chat tools: [Types & tool formats](/oss/giskard-llm/explanation/types-and-tools)
- Tool loops: [Tools with chat completions](/oss/giskard-llm/how-to/tools-with-chat-completions), [Tools with `aresponse`](/oss/giskard-llm/how-to/tools-with-aresponse)
