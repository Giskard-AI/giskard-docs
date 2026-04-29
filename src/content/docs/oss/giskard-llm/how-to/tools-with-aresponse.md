---
title: Tools with aresponse
description: "Send tool definitions to aresponse, read ResponseResult.function_calls, and return results with function_call_output items (including name for Google)."
sidebar:
  order: 3
---

Use this guide when your model string targets a **`ResponseProvider`** (OpenAI **Responses** or Google **Interactions**) and you want **tool definitions** plus **function results** in the stateful API style.

**Prerequisites:** [Quickstart: `aresponse`](/oss/giskard-llm/quickstart#optional-aresponse), and a model prefix that supports **`aresponse`** in the [provider matrix](/oss/giskard-llm/reference/providers#provider-matrix) (not Anthropic in the current matrix).

## Step 1 — Reuse the same nested tool definitions

Pass **`tools=`** exactly as for chat completions—nested **`ToolDefParam`** objects. The library flattens them for Responses / Interactions ([Types & tool formats](/oss/giskard-llm/explanation/types-and-tools)).

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

## Step 2 — First `aresponse` with user input

```python
import json

from giskard.llm import aresponse

result = await aresponse(
    model="openai/gpt-4.1-mini",
    input="What is 19 plus 23? Use add.",
    tools=TOOLS,
)
```

Inspect proposed calls with **`result.function_calls`** (see [Reference — `ResponseResult`](/oss/giskard-llm/reference/responses#responses--interactions-api-aresponse)).

## Step 3 — Send tool results as `function_call_output` items

Canonical input items use **`type": "function_call_output"`** with **`call_id`**, **`output`** (string), and optionally **`name`**. Include **`name`** matching the function when calling **Google**; OpenAI ignores it, but the shared contract keeps one code path ([design.md ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/docs/design.md)).

```python
follow_up_items: list[dict] = []
for call in result.function_calls:
    if call.name == "add":
        a = int(call.arguments["a"])
        b = int(call.arguments["b"])
        out = json.dumps({"result": a + b})
    else:
        out = json.dumps({"error": f"unknown tool {call.name}"})
    follow_up_items.append(
        {
            "type": "function_call_output",
            "call_id": call.call_id or "",
            "name": call.name,
            "output": out,
        }
    )

next_result = await aresponse(
    model="openai/gpt-4.1-mini",
    input=follow_up_items,
    tools=TOOLS,
    previous_id=result.id,
)
```

**`previous_id`** chains the new call to the prior **`ResponseResult.id`** so the provider can attach your outputs to the same run ([Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap)). If your integration replays full structured history instead, you can omit **`previous_id`** and pass a longer **`input`** sequence—at the cost of larger payloads.

Read the assistant text from **`next_result.output_text`** when present, or walk **`next_result.outputs`** for mixed message and tool-call segments.

## Troubleshooting

**`UnsupportedOperationError`** — The resolved provider is not a **`ResponseProvider`** (for example **`anthropic/...`**). Use [Tools with chat completions](/oss/giskard-llm/how-to/tools-with-chat-completions) instead.

**Google errors about the tool name** — Set **`name`** on each **`function_call_output`** to the same string as the model’s function call.

## See also

- Chat-completions tool loop (portable to Anthropic): [Tools with chat completions](/oss/giskard-llm/how-to/tools-with-chat-completions)
- [Response API gap](/oss/giskard-llm/explanation/response-api-gap) — when **`acompletion`** vs **`aresponse`** is the better fit
