---
title: "Install Giskard Checks"
description: "Install Giskard Checks with pip, configure your LLM provider, and set the environment variables that LLM-based checks use to call the judge."
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

For reusable workflows that generate scenarios and evaluation suites, see [Giskard Agent Skills](/start/agent-skills).
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

### Use an OpenAI-compatible endpoint

Any server that implements the OpenAI Chat Completions API can be your judge. That includes vLLM, Ollama, LM Studio, OpenRouter, Together, Groq, DeepSeek, and self-hosted gateways. You don't need LiteLLM for this. Install the `openai` extra, register the endpoint under a name of your choice with `giskard.llm.configure`, and use that name as the model prefix:

```python
from giskard.checks import set_default_generator
from giskard.llm import configure

configure(
    "my-endpoint",  # alias used as the model prefix below
    provider="openai",  # speak the OpenAI Chat Completions protocol
    base_url="https://my-llm-host.example.com/v1",  # the /v1 root, not /chat/completions
    api_key="os.environ/MY_ENDPOINT_API_KEY",  # read from the environment on first use
)

set_default_generator("my-endpoint/my-model-id")
```

The part after the prefix (`my-model-id`) is sent as-is in the `model` field of the request, so use the exact id your server lists under `GET /v1/models`.

A few things to keep in mind:

- `base_url` must point to the API root that ends in `/v1`. The SDK appends `/chat/completions` itself.
- `api_key` takes either a literal value or `os.environ/VAR_NAME`, which reads `VAR_NAME` when the provider is first used. Servers that don't check keys, such as a local vLLM or Ollama, still expect a non-empty value. Any placeholder string works.
- Using a custom alias such as `my-endpoint/` leaves `openai/` pointing to `api.openai.com`, so you can mix both in the same project. To redirect every `openai/...` model instead, call `configure("openai", base_url=..., api_key=...)`. You can also set the `OPENAI_BASE_URL` environment variable, which the `openai` SDK reads by default.
- Call `configure` before the first LLM call. Calling it again with the same name replaces the earlier configuration.
- For structured verdicts, `LLMJudge` and the other judge checks send a `response_format` JSON schema. If your server does not support structured outputs, pick a model and server that do. Otherwise judge calls may fail to parse.

## Next steps

For a step-by-step lesson with no API key, try [Your First Test](/oss/checks/tutorials/your-first-test) first. Or head to the [Quickstart](/oss/checks/quickstart) for a single example.
