---
title: "Install Giskard Checks"
description: "Install Giskard Checks via pip, configure your LLM provider, and set up environment variables for LLM-based checks."
sidebar:
  order: 2
---

## Install the Python package

Giskard requires **Python 3.12 or higher**. Install it together with the SDK for the LLM provider you will use as a judge: an LLM the library calls to grade your agent's replies.

```bash
pip install "giskard[openai]"
```

No provider SDK ships with `giskard` itself, so installing it without a provider extra leaves LLM-based checks unable to reach a model.

Pick the extra that matches your provider:

| Provider prefix | Install | SDK |
| --- | --- | --- |
| `openai/` | `pip install "giskard[openai]"` | `openai` |
| `google/` or `gemini/` | `pip install "giskard[google]"` | `google-genai` |
| `anthropic/` | `pip install "giskard[anthropic]"` | `anthropic` |
| `azure/` | `pip install "giskard[azure]"` | `openai` |
| `azure_ai/` | `pip install "giskard[azure]"` | `openai` |

Use `pip install "giskard[all-llms]"` for all the native SDKs at once.

:::note[Using LiteLLM instead]
For unsupported providers, install `pip install "giskard[litellm]"` and pass `LiteLLMGenerator` explicitly:

```python
from giskard.agents.generators import LiteLLMGenerator

llm_judge = LiteLLMGenerator(model="bedrock/anthropic.claude-3-sonnet")
```

The default `Generator` does not use LiteLLM.
:::

:::tip[Using a coding agent]
Paste the following into your coding agent:

```
Follow the instructions from https://docs.giskard.ai/oss/checks/installation.md and install Giskard in my project.
```

For reusable workflows that generate scenarios and evaluation suites, see [Giskard Agent Skills](/oss/agent-skills).
:::

## Configure the default LLM judge model

A judge is an LLM that reads your agent's reply and decides whether it satisfies a rule you wrote in plain language. Some checks need one (`LLMJudge`, `Groundedness`, `Conformity`). To use them, configure a provider SDK. The default `Generator` uses Giskard's native provider SDK integrations; install the matching `giskard` extra, such as `openai` above. LiteLLM is optional through `giskard[litellm]`.

When a judge runs, its prompt includes the test inputs and agent outputs. Those values are sent to the configured LLM provider, so use a provider and model that meet your data-handling requirements. A weak judge model can produce unreliable verdicts.

For OpenAI, set the `OPENAI_API_KEY` environment variable:

```bash
export OPENAI_API_KEY="your-api-key"
```

Keep these in a `.env` file rather than your shell profile. To load them in Python, install `python-dotenv`:

```bash
pip install python-dotenv
```

```python
from dotenv import load_dotenv

load_dotenv()  # loads .env from the current directory
```

Then you can set your preferred LLM judge model like this:

```python
from giskard.checks import set_default_generator

# The provider prefix picks the SDK: openai/, google/, anthropic/, azure/, azure_ai/
set_default_generator("openai/gpt-5-mini")
```

A model identifier string is wrapped in `Generator` automatically. Pass a `Generator` instance when you need further configuration. Use a capable judge model and review failures before acting on them.

## Next Steps

For a step-by-step lesson with no API key, try [Your First Test](/oss/checks/tutorials/your-first-test) first. Or head to the [Quickstart](/oss/checks/quickstart) for a single example.
