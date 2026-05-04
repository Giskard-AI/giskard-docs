---
title: Chat completions vs Responses / Interactions
description: "Why giskard-llm exposes both acompletion and aresponse, how stateful OpenAI Responses and Gemini Interactions relate, and how to choose a path."
sidebar:
  order: 2
---

Vendors now offer **two different families** of model APIs: classic **chat completions** (stateless request–response over a message list) and newer **stateful** APIs where the server keeps conversation state and you append turns by reference. **giskard-llm** maps both families so one integration can route on a model string without re-plumbing every product surface.

## What each entrypoint represents

**`acompletion`** targets **Chat Completions–style** endpoints: you send a full `messages` array each time; the server returns a `CompletionResponse` with `choices` and usage. This matches what most agents and RAG stacks already use.

**`aresponse`** targets **stateful** APIs:

- On **OpenAI**, the implementation calls the [Responses API](https://platform.openai.com/docs/api-reference/responses) (`client.responses.create`).
- On **Google**, it calls the **Interactions** surface in the Gemini SDK (`interactions.create`), which plays the same “threaded” role for Gemini.

Both are exposed behind one **`respond(...)`** protocol in code ([`ResponseProvider`](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/src/giskard/llm/providers/base.py)) so callers can keep a single abstraction while the library translates to each SDK.

## Why the library keeps both

Chat completions and Responses/Interactions solve overlapping problems with **different contracts**:

- **Completions** assume you own the transcript: cheap mental model, easy to fork branches in your DB, works everywhere (including Anthropic in this layer).
- **Responses / Interactions** assume the **provider** stores prior turns: you pass **`previous_id`** (or equivalent wiring) to continue a run, which can simplify very long threads or provider-side tooling—but only where the vendor supports it.

giskard-llm does **not** silently emulate one API with the other at full fidelity. If you call **`aresponse`** against a provider that only implements completions (for example **Anthropic** in the current matrix), routing raises **`UnsupportedOperationError`**. That is intentional: you get a clear capability signal instead of a partial or misleading translation.

## Stateful chaining with `previous_id`

For **`aresponse`**, the optional **`previous_id`** argument ties the new call to a prior response object returned by the same API family on that provider. The exact wire field names differ by SDK; the OpenAI provider maps them through [`OpenAIResponseTranslator`](https://github.com/Giskard-AI/giskard-oss/tree/main/libs/giskard-llm/src/giskard/llm/translators). Conceptually: **first call** returns a **`ResponseResult`** with an **`id`**; **subsequent calls** pass that id (or the provider-specific continuation handle) as **`previous_id`** so the model sees the accumulated interaction.

Use this path when your product already depends on provider-native threading. If you manage history yourself, **`acompletion`** is usually simpler.

## Input shape and tools

**`input`** may be a plain **`str`** (treated as user text) or a **sequence of structured items** (messages, tool calls, function outputs) described by **`ResponseInputItemParam`** in the package types. Tool **definitions** still use the same nested **`ToolDefParam`** shape as chat completions; providers flatten or map them internally ([Types & tool formats](/oss/giskard-llm/explanation/types-and-tools)).

## Reading the unified result

**`ResponseResult`** normalizes vendor payloads: **`id`**, **`outputs`** (a list of message blocks and/or **`ResponseOutputFunctionCall`** items), optional **`model`** and **`usage`**, plus helpers **`output_text`** and **`function_calls`** for common access patterns. Details are summarized in the [Responses / Interactions reference](/oss/giskard-llm/reference/responses#responses--interactions-api-aresponse).

## Further reading

- [Reference: `aresponse` and types](/oss/giskard-llm/reference/responses#responses--interactions-api-aresponse)
- [Quickstart: optional Responses example](/oss/giskard-llm/quickstart#optional-aresponse)
- Upstream design notes: [`libs/giskard-llm/docs/design.md` ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/docs/design.md)
