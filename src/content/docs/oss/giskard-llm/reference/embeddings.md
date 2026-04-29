---
title: Embeddings (`aembedding`)
description: "Batch text embeddings via aembedding and EmbeddingResponse fields."
sidebar:
  order: 4
---

## Embeddings API (`aembedding`)

Module-level **`aembedding`** and **`LLMClient.aembedding`** dispatch to **`EmbeddingProvider.embed`**. Each provider calls its native embeddings surface for the resolved model. Not every registered prefix implements embeddings (see the [provider matrix](/oss/giskard-llm/reference/providers#provider-matrix)); calling **`aembedding`** against a completion-only provider raises **`UnsupportedOperationError`**.

### `aembedding` / `LLMClient.aembedding`

| Parameter  | Type        | Meaning                                                                                             |
| ---------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `model`    | `str`       | `provider/model-name` (bare name defaults to `openai/`).                                            |
| `input`    | `list[str]` | Texts to embed in one request (batch).                                                              |
| `**params` | `Any`       | Provider-specific fields merged by the translator (dimensions, encoding format, …) where supported. |

**Returns:** **`EmbeddingResponse`**

**Raises:** **`UnsupportedOperationError`** if the provider is not an **`EmbeddingProvider`**; other failures use the [Errors](/oss/giskard-llm/reference/errors) types.

### `EmbeddingResponse` and related types

| Field / member | Type                     | Meaning                                      |
| -------------- | ------------------------ | -------------------------------------------- |
| `data`         | `list[EmbeddingData]`    | One entry per input string, in order.        |
| `model`        | `str \| None`            | Embedding model id reported by the provider. |
| `usage`        | `EmbeddingUsage \| None` | Token usage when returned.                   |

**`EmbeddingData`**: **`embedding`** (`list[float]`), **`index`** (position in the batch).

**`EmbeddingUsage`**: **`prompt_tokens`**, **`total_tokens`** (defaults apply when the provider omits usage).
