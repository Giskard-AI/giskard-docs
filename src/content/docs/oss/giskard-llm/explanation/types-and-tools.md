---
title: Types & tool formats
description: "Why giskard-llm separates input TypedDicts from output Pydantic models and how tool definitions are normalized per provider."
sidebar:
  order: 1
---

This page answers **why** the public API looks the way it does—use it when you are integrating non-trivial tool calling or serializing traces. For day-to-day usage, [Quickstart](/oss/giskard-llm/quickstart) and the [API reference](/oss/giskard-llm/reference) are enough.

## Input types vs output types

The library follows a consistent split:

- **Inputs** use lightweight **`TypedDict`**-style parameters (names often end in `Param`), so you can pass plain dict literals such as `{"role": "user", "content": "hello"}` from application code or orchestrators.
- **Outputs** are **Pydantic models** (`CompletionResponse`, `EmbeddingResponse`, `ResponseResult`, …) so responses are validated, attribute-friendly, and JSON-serializable via `.model_dump(exclude_none=True)` (see [design notes in the source repo ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/docs/design.md)).

That boundary keeps call sites ergonomic while still giving structured results you can log or persist.

## Tool definitions: one public shape

Public APIs accept tools in the **Chat Completions nested** form (OpenAI-style):

```python
{
    "type": "function",
    "function": {
        "name": "add",
        "description": "...",
        "parameters": {...},
    },
}
```

Some vendor APIs (OpenAI Responses, Google Interactions) expect a **flat** function object. **`ToolDefParam` stays nested in user code**: each provider’s `respond()`/`complete()` implementation flattens or maps the structure before invoking the SDK. You therefore author tools once regardless of downstream API quirks.

## Tool results (function outputs)

Canonical tool-return items follow an OpenAI-like **`FunctionCallOutputParam`** envelope (including **`name`** for Google’s Interactions API). Translators internally adapt that structure where the wire format differs ([design.md ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/docs/design.md)).

## Tool-call arguments parsing

Parsed tool-call arguments expose as **`dict[str, object]`** on `ToolCallFunction`, with coercion so either raw JSON strings or dicts ingest safely. Helpers such as **`serialize_arguments`** / **`deserialize_arguments`** in `giskard.llm.utils` round-trip arguments when talking to APIs that insist on strings (Anthropic tool-use blocks).

## Further reading

- [How to: Tools with chat completions](/oss/giskard-llm/how-to/tools-with-chat-completions) and [How to: Tools with `aresponse`](/oss/giskard-llm/how-to/tools-with-aresponse) — goal-oriented tool loops without repeating conceptual background here.
- [Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap): when to use **`acompletion`** vs **`aresponse`**, provider coverage, stateful chaining, and Responses/Interactions–specific tooling quirks.
- Per-provider quirks (roles, tooling, headers) remain documented in **`class` docstrings** under [`giskard/llm/providers/`](https://github.com/Giskard-AI/giskard-oss/tree/main/libs/giskard-llm/src/giskard/llm/providers)—browse there when migrating prompts between vendors.
