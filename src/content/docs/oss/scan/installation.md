---
title: Install & Configure
description: "Install Giskard Scan from the giskard meta package, pick a provider for the generator and judge model, and add optional third-party scanner extras."
sidebar:
  order: 1
---

Giskard Scan needs two things before it can run: the `giskard` meta package, and an LLM provider with an API key. The scan cannot work without a model, because a model is what writes the attacks and grades the replies.

## Install with a coding agent

The fastest way to set up the scan. Paste a single URL into your coding agent and it handles the install and the provider configuration for you.

:::tip[Paste this into your coding agent]

```
Follow the instructions from https://docs.giskard.ai/oss/scan/installation.md and install Giskard Scan with the giskard meta package in my project.
```

:::

## Install the Python package

Giskard Scan requires **Python 3.12 or higher**:

```bash
pip install "giskard[scan]==3.0.0rc1"
```

```bash
uv pip install "giskard[scan]==3.0.0rc1"
```

## Configure a model

The scan calls an LLM twice: once to invent attack scenarios from your description, and once to **judge** the answers your agent gives back, meaning to read each conversation and decide pass or fail. Both use the default generator, so nothing runs until you set one.

Those calls send your agent's description and its replies to whichever provider you configure. If your agent can return customer data or internal documents, that data reaches the provider too.

Install the scan and its provider extra from the `giskard` meta package:

```bash
pip install "giskard[scan,openai]==3.0.0rc1"
```

Then register the model as the default:

```python
from giskard.agents.generators import GiskardLLMGenerator
from giskard.checks import set_default_generator

set_default_generator(GiskardLLMGenerator(model="openai/gpt-4o"))
```

`openai`, `anthropic`, and `google` are the first-party extras. For anything else, install `giskard[scan,litellm]==3.0.0rc1` and use `LiteLLMGenerator` with any [LiteLLM-supported ↗](https://docs.litellm.ai/docs/providers) model string:

```python
from giskard.agents.generators import LiteLLMGenerator
from giskard.checks import set_default_generator

set_default_generator(LiteLLMGenerator(model="mistral/mistral-large-latest"))
```

Each provider reads its own API key from the environment (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`). Keep them in a `.env` file and load it before you build the generator:

```bash
pip install python-dotenv
```

```python
from dotenv import load_dotenv

load_dotenv()
```

Pick a capable model here. The generator writes the attacks and the judge decides whether your agent fell for them. A weak model produces bland scenarios and unreliable verdicts, which is the most common cause of a scan that "finds nothing".

## Optional: third-party scanners

`third_party_scan` runs external red-teaming tools in-process through lazily imported adapters. They are not installed by default:

```bash
pip install "giskard[scan,garak]==3.0.0rc1"
pip install "giskard[scan,deepteam]==3.0.0rc1"
```

Install only the ones you plan to run; both pull in large dependency trees. See [`third_party_scan`](/oss/scan/reference/scan-api) for the arguments each tool accepts. A **probe** there is one canned attack that tool knows how to run, the equivalent of a Giskard generator.

## Next Steps

Continue with [Scan Vulnerabilities](/oss/scan/scan-vulnerabilities) to point the scan at your own agent.
