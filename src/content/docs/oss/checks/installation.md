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

## Use an OpenAI-compatible gateway

Gateways that expose an OpenAI-compatible API work through the `openai/` provider. Point the SDK at the gateway with `OPENAI_BASE_URL` and keep the model string prefixed with `openai/`.

<a href="https://www.edenai.co" target="_blank">Eden AI ↗</a> is one such gateway, useful when you want one key across vendors or judge calls that stay inside the EU:

```bash
OPENAI_API_KEY="your-eden-ai-api-key"
OPENAI_BASE_URL="https://api.edenai.run/v3"
```

Its model ids are namespaced by the upstream vendor, as `vendor/model`, so the string carries two prefixes: `openai/` picks the SDK and the rest is the gateway's model id.

```python
from dotenv import load_dotenv
from giskard.checks import set_default_generator

load_dotenv()

set_default_generator("openai/openai/gpt-5.5")
```

The same works through LiteLLM with `pip install "giskard[litellm]"` and `LiteLLMGenerator(model="openai/openai/gpt-5.5")`, which reads the same variables.

A judge prompt carries your test inputs and your agent's outputs. To keep that inside the EU, Eden AI exposes a regional host that serves only models cleared for European processing:

```bash
OPENAI_BASE_URL="https://api.eu.edenai.run/v3"
```

Pick a model from that subset, such as `openai/mistral/mistral-large-latest`. Requesting one that is not cleared raises `LLMError` with HTTP 451 rather than running the call elsewhere, so a misconfigured judge stops the run instead of leaving the region. See the <a href="https://www.edenai.co/docs/v3/data-governance/eu-endpoint" target="_blank">EU endpoint documentation ↗</a> for which models qualify.

:::note[Why two prefixes]
Giskard strips the first segment to choose the SDK, so `"openai/openai/gpt-5.5"` sends `openai/gpt-5.5` to the gateway and pins the vendor. Dropping the second prefix also resolves, but lets the gateway choose the route, which is harder to reproduce when a judge verdict is disputed.
:::

## Next steps

For a step-by-step lesson with no API key, try [Your First Test](/oss/checks/tutorials/your-first-test) first. Or head to the [Quickstart](/oss/checks/quickstart) for a single example.
