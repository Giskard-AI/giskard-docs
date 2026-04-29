---
title: Responses / Interactions (`aresponse`)
description: "Stateful aresponse API, structured input items, ResponseResult, and outputs."
sidebar:
  order: 3
---

## Responses / Interactions API (`aresponse`) {#responses--interactions-api-aresponse}

Module-level **`aresponse`** and **`LLMClient.aresponse`** dispatch to **`ResponseProvider.respond`** on the provider resolved from the model prefix. OpenAI uses **`responses.create`**; Google uses **Interactions** (`interactions.create`). Extra keyword arguments are forwarded to the underlying SDK after translation (same pattern as **`acompletion`**).

### `aresponse` / `LLMClient.aresponse`

| Parameter        | Type                                                                                                                              | Meaning                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`          | `str`                                                                                                                             | `provider/model-name` (bare name defaults to `openai/`).                                                                                       |
| `input`          | `str` \| `Sequence[ResponseInputItemParam \| ResponseInputItem]`                                                                  | User text as a string, or structured items (messages, assistant outputs, tool calls, function outputs). Validated to `ResponseInputItem` models internally. |
| `instructions`   | `str \| None`                                                                                                                     | Optional system-style instruction string passed through to the translator.                                                                    |
| `previous_id`    | `str \| None`                                                                                                                     | Continuation handle from a prior **`ResponseResult.id`** (provider-specific mapping in translators).                                           |
| `tools`          | `Sequence[ToolDefParam \| ToolDef] \| None`                                                                                       | Tool definitions in the nested chat format; each provider maps to its wire shape.                                                              |
| `**params`       | `Any`                                                                                                                             | Additional arguments merged into the SDK request by the provider translator (e.g. OpenAI Responses–specific fields where supported).             |

**Returns:** **`ResponseResult`**

**Raises:** **`UnsupportedOperationError`** if the provider is not a **`ResponseProvider`**; validation failures surface as **`BadRequestError`**; other HTTP/SDK errors use the [Errors](/oss/giskard-llm/reference/errors) types.

### Structured `input` item kinds (`ResponseInputItemParam`)

Union of TypedDict-style parameters (plain dicts allowed at call sites). Names mirror the [upstream types module ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/src/giskard/llm/types/response_param.py).

| Kind (discriminator)   | `type` value              | Role / notes                                                                                          |
| ---------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| Easy message           | `"message"`             | `role` (`user` \| `assistant` \| `system` \| `developer`), `content` string or list of content blocks. |
| Function call (model)  | `"function_call"`       | `name`, `arguments`, `call_id` for model-proposed tool calls.                                          |
| Function call output   | `"function_call_output"` | `call_id`, `output`; optional `name` (used for Google Interactions).                                   |
| Echo assistant message | `"message"` (output-shaped) | Assistant **`ResponseOutputMessageParam`** for replaying prior assistant content in the item stream.   |

Pydantic **`ResponseInputItem`** models in **`giskard.llm.types`** are the validated counterparts used after **`TypeAdapter`** validation inside providers.

### `ResponseResult` and outputs

| Field / member      | Type                         | Meaning                                                                                                   |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `id`                | `str`                        | Response/interaction identifier; use with **`previous_id`** for continuation where supported.             |
| `outputs`           | `list[ResponseOutputItem]`   | Union of assistant **`ResponseOutputMessage`** blocks and **`ResponseOutputFunctionCall`** items.           |
| `model`             | `str \| None`                | Model name reported by the provider, if present.                                                          |
| `usage`             | `Usage \| None`              | Token usage when the provider returns it.                                                                 |
| `.output_text`      | property → `str \| None`     | Concatenated text from message outputs; `None` if there is no text.                                       |
| `.function_calls`   | property → `list[ResponseOutputFunctionCall]` | All function-call outputs in order.                                                            |

**`ResponseOutputItem`** is **`ResponseOutputMessage` \| `ResponseOutputFunctionCall`**. The package also exports building blocks such as **`ResponseOutputText`**, **`ResponseOutputRefusal`**, and message content aliases for advanced parsing.

For what differs between **`acompletion`** (chat completions) and **`aresponse`** (Responses / Interactions), see [Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap).
