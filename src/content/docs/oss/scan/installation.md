---
title: Install & Configure
description: "Install the Giskard scan, pick a provider for the generator and judge model, and add the optional third-party scanner extras."
sidebar:
  order: 1
---

The Giskard scan needs two things before it can run: the Python package, and an LLM provider with an API key. The scan cannot work without a model, because a model is what writes the attacks and grades the replies.

## Install the Python package

The scan requires **Python 3.12 or higher**:

```bash
pip install --pre "giskard[scan]"
```

```bash
uv pip install --prerelease=allow "giskard[scan]"
```

To install everything in one go instead of picking extras, use `giskard[full]` (the scan, every native provider, LiteLLM, and all optional check dependencies) or `giskard[all-llms]` for the providers alone.

## Configure a model

The scan calls an LLM twice: once to invent attack scenarios from your description, and once to **judge** the answers your agent gives back, meaning to read each conversation and decide pass or fail. Both use the default generator, so nothing runs until you set one.

Those calls send your agent's description and its replies to whichever provider you configure. If your agent can return customer data or internal documents, that data reaches the provider too.

Install the provider extra alongside the scan:

```bash
pip install --pre "giskard[scan,openai]"
```

Then register the model as the default:

```python
from giskard.agents.generators import GiskardLLMGenerator
from giskard.checks import set_default_generator

set_default_generator(GiskardLLMGenerator(model="openai/gpt-4o-mini"))
```

`openai`, `anthropic`, `google`, and `azure` are the first-party extras. Install `giskard[<extra>]` and use the matching model prefix: `openai/`, `anthropic/`, `google/` (or `gemini/`), `azure/`, `azure_ai/`.

:::note[Using LiteLLM instead]
For any other provider, install `pip install --pre "giskard[litellm]"` and pass `LiteLLMGenerator` explicitly. The default `GiskardLLMGenerator` only knows the first-party providers above and raises `ValueError: Provider '<name>' is not configured and not in the registry.` for anything else, mid-scan rather than at setup:

```python
from giskard.agents.generators import LiteLLMGenerator
from giskard.checks import set_default_generator

set_default_generator(LiteLLMGenerator(model="ollama/llama3"))
```
:::

Each provider reads its own credentials from the environment:

| Provider | Model prefix | Environment variables |
| --- | --- | --- |
| OpenAI | `openai/` | `OPENAI_API_KEY` |
| Anthropic | `anthropic/` | `ANTHROPIC_API_KEY` |
| Google | `google/`, `gemini/` | `GEMINI_API_KEY` or `GOOGLE_API_KEY` |
| Azure OpenAI | `azure/` | `AZURE_API_KEY`, `AZURE_API_BASE`, `AZURE_API_VERSION` (defaults to `2024-10-21`) |
| Azure AI | `azure_ai/` | `AZURE_AI_API_KEY`, `AZURE_AI_ENDPOINT`, `AZURE_AI_API_VERSION` (defaults to `2024-10-21`) |

Keep them in a `.env` file and load it before you build the generator:

```bash
pip install python-dotenv
```

```python
from dotenv import load_dotenv

load_dotenv()
```

Pick a capable model here. The generator writes the attacks and the judge decides whether your agent fell for them. A weak model produces bland scenarios and unreliable verdicts, which is the most common cause of a scan that "finds nothing".

Budget for the run before you start it. A default scan runs every generator at its own budget: expect 100+ scenarios, each costing one call to your agent and one to the judge, and several minutes of wall time. Start with `max_scenarios=20` while you wire things up.

## Optional: third-party scanners

`third_party_scan` runs external red-teaming tools in-process through lazily imported adapters. They are not installed by default:

```bash
pip install --pre "giskard[garak]"
pip install --pre "giskard[deepteam]"
```

Install only the ones you plan to run; both pull in large dependency trees. See [`third_party_scan`](/oss/scan/reference/scan-api) for the arguments each tool accepts. A **probe** there is one canned attack that tool knows how to run, the equivalent of a Giskard generator.

:::tip[Using a coding agent]
Paste the following into your coding agent:

```
Follow the instructions from https://docs.giskard.ai/oss/scan/installation.md and install the Giskard scan in my project.
```
:::

## Next Steps

Run the [Quickstart](/oss/scan/quickstart) for a scan end to end in under ten minutes, take [Your First Scan](/oss/scan/tutorials/your-first-scan) for a guided run against a toy agent, or go straight to [Scan Vulnerabilities](/oss/solutions/scan-vulnerabilities) to point the scan at your own.
