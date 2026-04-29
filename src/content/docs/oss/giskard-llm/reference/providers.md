---
title: Provider matrix
description: "Model string prefixes, SDKs, auth env vars, and feature flags for giskard-llm."
sidebar:
  order: 6
---

## Provider matrix {#provider-matrix}

This table mirrors the README shipped with package sources; newer models or embedding availability may evolve—verify against your installed version.

| Prefix                          | SDK            | Auth / endpoint (high level)                     | Completions | Embeddings      | Stateful `aresponse`        | Notes                                                          |
| ------------------------------- | -------------- | ------------------------------------------------ | ----------- | --------------- | --------------------------- | -------------------------------------------------------------- |
| `openai/` _(default bare name)_ | `openai`       | `OPENAI_API_KEY`; optional `base_url`, `timeout` | yes         | yes             | yes (`responses.create`)    | Bare `gpt-4o` routes here                                      |
| `google/` _(alias `gemini/`)_   | `google-genai` | `GOOGLE_API_KEY` / `GEMINI_API_KEY`              | yes         | yes             | yes (`interactions.create`) |                                                                |
| `anthropic/`                    | `anthropic`    | `ANTHROPIC_API_KEY`                              | yes         | no              | **no**                      | **`merge_system`**, timeouts                                   |
| `azure/`                        | `openai`       | `AZURE_API_KEY`, `AZURE_API_BASE`, …             | yes         | yes             | inherits OpenAI             | Set `api_version`, `base_url`; endpoint must support Responses |
| `azure_ai/`                     | `openai`       | `AZURE_AI_API_KEY`, `AZURE_AI_ENDPOINT`          | yes         | varies by model | inherits OpenAI             | Azure AI Foundry                                               |

For what differs between **`acompletion`** (chat completions) and **`aresponse`** (Responses / Interactions), see [Chat completions vs Responses / Interactions](/oss/giskard-llm/explanation/response-api-gap).

Deep-dive semantics (chat vs responses routes, translator edge cases) live in **provider class docstrings** under `giskard/llm/providers/` in the repository.
