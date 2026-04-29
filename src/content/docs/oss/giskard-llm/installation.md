---
title: Installation
description: "Install giskard-llm with optional provider extras, Python version, and environment variables."
sidebar:
  order: 2
---

## Requirements

- **Python 3.12+**
- Exactly one or more **[optional dependency groups]** matching the providers you will call (`openai`, `google`, `anthropic`, `azure`)

## Pip install

Pick the extras you need ([source package definition ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/libs/giskard-llm/pyproject.toml)):

```bash
pip install 'giskard-llm[openai]'      # OpenAI + Azure OpenAI + Azure AI Foundry (OpenAI-compatible SDK)
pip install 'giskard-llm[google]'      # Google Gemini (google-genai)
pip install 'giskard-llm[anthropic]' # Anthropic
pip install 'giskard-llm[all]'        # Convenience: openai + google + anthropic
```

Azure routes (`azure/` and `azure_ai/`) use the **OpenAI Python SDK**; installing `giskard-llm[openai]` (or `[azure]` if you rely on that alias) is sufficient for those backends.

If you omit extras, importing a provider-specific type may still work, but an actual completion will raise **`ProviderNotAvailableError`** with an install hint when the backing package is missing.

## Environment variables

Each provider relies on vendor conventions (often the same variables you already use elsewhere):

| Routing prefix                      | Typical auth / endpoint                               |
| ----------------------------------- | ----------------------------------------------------- |
| `openai/` (also default bare model) | `OPENAI_API_KEY`; optional base URL overrides per SDK |
| `google/` / `gemini/`               | `GOOGLE_API_KEY` or `GEMINI_API_KEY`                  |
| `anthropic/`                        | `ANTHROPIC_API_KEY`                                   |
| `azure/`                            | Often `AZURE_API_KEY`, `AZURE_API_BASE`; see SDK docs |
| `azure_ai/`                         | Often `AZURE_AI_API_KEY`, `AZURE_AI_ENDPOINT`         |

For **programmatic secrets** (`LLMClient` and `"os.environ/VAR"` values), see [Named providers & LLMClient](/oss/giskard-llm/how-to/named-providers-and-client).

## Next steps

- Run the [Quickstart](/oss/giskard-llm/quickstart) to validate your environment with a minimal async call.
