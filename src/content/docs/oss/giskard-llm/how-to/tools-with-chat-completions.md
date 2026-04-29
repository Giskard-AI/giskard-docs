---
title: Tools with chat completions
description: "Run a tool-calling loop with acompletion: define tools, handle tool_calls, append tool messages, and finish with a natural-language reply."
sidebar:
  order: 2
---

This guide shows how to drive **function calling** through **`acompletion`** when you keep the full transcript in application memory (typical for agents on OpenAI, Google, Anthropic, or Azure).

**Prerequisites:** [Installation](/oss/giskard-llm/installation) for your provider, working [Quickstart](/oss/giskard-llm/quickstart) call. You should already be comfortable building a `messages` list.

## Step 1 — Define tools in the nested chat shape

Pass **`tools=`** as a sequence of **`ToolDefParam`** objects (OpenAI chat style: outer `type: "function"` and an inner `function` with `name`, `description`, `parameters`). The same list is accepted for every completion-capable provider; translators map it per vendor ([Types & tool formats](/oss/giskard-llm/explanation/types-and-tools)).

```python
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add",
            "description": "Add two integers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"},
                },
                "required": ["a", "b"],
            },
        },
    },
]
```

## Step 2 — Call the model with `tools=`

```python
from giskard.llm import acompletion

messages: list[dict] = [
    {"role": "user", "content": "What is 19 plus 23? Use the add tool."},
]

response = await acompletion(
    model="openai/gpt-4o-mini",
    messages=messages,
    tools=TOOLS,
)
```

Optional **`tool_choice`** (and other vendor-specific flags) go in `**kwargs` and are forwarded to the underlying SDK after routing—see provider class docstrings in the [source tree ↗](https://github.com/Giskard-AI/giskard-oss/tree/main/libs/giskard-llm/src/giskard/llm/providers) if you need exact parameter names.

## Step 3 — If the assistant requested tools, append assistant + tool messages

Inspect the first choice:

```python
choice = response.choices[0]
assistant = choice.message
```

If **`assistant.tool_calls`** is non-empty, append the assistant turn **as returned** (serialize with **`.model_dump(exclude_none=True)`** so `tool_calls` round-trips correctly), then append one **`{"role": "tool", "tool_call_id": ..., "content": ...}`** message per call. **`tool_call_id`** must match the **`id`** on each **`ToolCall`**.

```python
import json

if assistant.tool_calls:
    messages.append(assistant.model_dump(exclude_none=True))
    for tc in assistant.tool_calls:
        if tc.function.name == "add":
            args = tc.function.arguments
            a, b = int(args["a"]), int(args["b"])
            result = a + b
        else:
            result = {"error": f"unknown tool {tc.function.name}"}
        messages.append(
            {
                "role": "tool",
                "tool_call_id": tc.id,
                "content": (
                    json.dumps(result)
                    if not isinstance(result, str)
                    else result
                ),
            }
        )

    response = await acompletion(
        model="openai/gpt-4o-mini",
        messages=messages,
        tools=TOOLS,
    )
```

**Arguments** on **`ToolCallFunction`** are **`dict[str, object]`** (JSON strings from the wire are parsed for you). For sending argument-shaped payloads back to picky APIs, use **`serialize_arguments`** / **`deserialize_arguments`** in **`giskard.llm.utils`** ([design notes ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/docs/design.md)).

## Step 4 — Read the final answer

When the model answers without new tool calls, use **`response.choices[0].message.text`** (or `content` depending on shape) as usual.

## Troubleshooting

**Empty `tool_calls` but you expected a tool** — Check `choice.finish_reason`, tighten the user prompt, or set **`tool_choice`** for the provider you use.

**Provider rejects the second request** — Ensure the assistant message with **`tool_calls`** is immediately followed by **`tool`** messages for **every** `tool_call_id` from that turn, with no user message in between (OpenAI-style ordering).

## See also

- Stateful **Responses / Interactions** tool turns: [Tools with `aresponse`](/oss/giskard-llm/how-to/tools-with-aresponse)
- Why definitions stay nested in your code: [Types & tool formats](/oss/giskard-llm/explanation/types-and-tools)
- `tools=` and message unions: [Chat completions reference](/oss/giskard-llm/reference/completions#chat-completions-api-acompletion); error types: [Errors](/oss/giskard-llm/reference/errors)
