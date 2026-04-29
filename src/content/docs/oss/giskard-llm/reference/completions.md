---
title: Chat completions (`acompletion`)
description: "Module and LLMClient chat completion API, message parameters, and CompletionResponse."
sidebar:
  order: 2
---

## Chat completions API (`acompletion`) {#chat-completions-api-acompletion}

Module-level **`acompletion`** and **`LLMClient.acompletion`** dispatch to **`CompletionProvider.complete`**. Providers call their native **stateless** chat surfaces (for example OpenAI **`chat.completions.create`**, Anthropic **`messages.create`**, Google **`models.generate_content`**): you pass the **full** `messages` list each time, and translators return a normalized **`CompletionResponse`**. Extra keyword arguments are forwarded to the SDK where the provider’s translator supports them (same pattern as **`aresponse`**).

### `acompletion` / `LLMClient.acompletion`

| Parameter   | Type                                                                                    | Meaning                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`     | `str`                                                                                   | `provider/model-name` (bare name defaults to `openai/`).                                                                                                                     |
| `messages`  | `Sequence[ChatMessageParam \| ChatMessage]`                                             | Chat turns in OpenAI-style shape; plain dicts match **`ChatMessageParam`**. Validated **`ChatMessage`** Pydantic models from **`giskard.llm.types`** are also accepted.      |
| `tools`     | `Sequence[ToolDefParam \| ToolDef] \| None`                                             | Optional tool definitions in nested chat format; providers map to their wire shape ([Types & tool formats](/oss/giskard-llm/explanation/types-and-tools)).                  |
| `**params`  | `Any`                                                                                   | Provider-specific request fields (temperature, `max_tokens`, …) merged by the translator.                                                                                    |

**Returns:** **`CompletionResponse`**

**Raises:** **`UnsupportedOperationError`** if the resolved backend is not a **`CompletionProvider`**; malformed payloads as **`BadRequestError`**; other HTTP/SDK errors use the [Errors](/oss/giskard-llm/reference/errors) types.

### `ChatMessageParam` (request messages)

Union of TypedDict-style parameters; names and fields mirror [chat_param.py ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/src/giskard/llm/types/chat_param.py). Typical **`role`** values: **`system`**, **`developer`**, **`user`**, **`assistant`**, **`tool`**, **`function`**. Assistant messages may include **`tool_calls`**; **`tool`** / **`function`** follow-up rows reference them via **`tool_call_id`** / **`name`** as in OpenAI-style APIs.

### `CompletionResponse` and `Choice`

| Field / member | Type               | Meaning                                                                                         |
| -------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `choices`      | `list[Choice]`     | Normalized completion choices (see below).                                                      |
| `model`        | `str \| None`      | Model identifier reported by the provider, if present.                                          |
| `usage`        | `Usage \| None`    | Token usage when the provider returns it.                                                       |

**`Choice`**: **`index`**, **`finish_reason`**, and **`message`** (**`AssistantMessage`**) with **`content`**, optional **`refusal`**, optional **`tool_calls`**, plus a **`.text`** helper that surfaces assistant-visible string(s).

For when to prefer **`acompletion`** over **`aresponse`**, see [Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap).
