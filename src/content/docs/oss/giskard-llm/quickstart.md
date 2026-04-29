---
title: Quickstart
description: "Make your first async chat completion with giskard-llm using aprovider/model string."
sidebar:
  order: 3
---

:::tip[Audience]
This page is **tutorial-style**: minimal theory, hands-on verification that credentials and installs work together.
:::

## Before you begin

Finish [Installation](/oss/giskard-llm/installation) for your provider (for example `'giskard-llm[openai]'`) and export any required API key in your shell or `.env` (for OpenAI typically `OPENAI_API_KEY`).

## 1. Call `acompletion`

The module-level API uses a **named default client** wired from environment defaults:

```python
import asyncio

from giskard.llm import acompletion


async def main() -> None:
    response = await acompletion(
        model="openai/gpt-5-mini",
        messages=[{"role": "user", "content": "Hello from giskard-llm!"}],
    )
    print(response.choices[0].message.text)


asyncio.run(main())
```

**Model strings** use `provider/model-name`. If you omit the prefix, **OpenAI is assumed** (equivalent to prefix `openai/`):

```python
response = await acompletion(model="gpt-5-mini", messages=[...])
```

## 2. Optional — embeddings

If you installed an extra that supports embeddings for your provider, try:

```python
from giskard.llm import aembedding

embeddings = await aembedding(
    model="openai/text-embedding-3-small",
    input=["hello", "world"],
)
print(len(embeddings.data))
```

Not every provider implements embeddings in giskard-llm (Anthropic is completion-only in this layer); see the [provider matrix](/oss/giskard-llm/reference/providers#provider-matrix).

## 3. Optional — Responses / Interactions (`aresponse`) {#optional-aresponse}

If you use **OpenAI Responses** or **Gemini Interactions** semantics (stateful runs, `previous_id` continuation), call **`aresponse`** instead of **`acompletion`**. Install the same extras as for chat (`giskard-llm[openai]` or `giskard-llm[google]`).

Minimal string input (OpenAI):

```python
import asyncio

from giskard.llm import aresponse


async def main() -> None:
    result = await aresponse(
        model="openai/gpt-4.1-mini",
        input="Say hello in one short sentence.",
    )
    print(result.output_text or result.id)


asyncio.run(main())
```

For **multi-turn state**, keep **`result.id`** from the first call and pass it as **`previous_id=`** on the next **`aresponse`** (see [Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap)). Anthropic prefixes do not implement this path today—use **`acompletion`** there.

## 4. Next steps

- Learn **named configurations** in [How to: Named providers & LLMClient](/oss/giskard-llm/how-to/named-providers-and-client).
- Run **tool calling** with [Tools with chat completions](/oss/giskard-llm/how-to/tools-with-chat-completions) or [Tools with `aresponse`](/oss/giskard-llm/how-to/tools-with-aresponse).
- Read how **tool definitions** are normalized in [Types & tool formats](/oss/giskard-llm/explanation/types-and-tools).
- Understand **when to prefer `acompletion` vs `aresponse`** in [Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap).
