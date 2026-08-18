---
title: Install & Configure
description: "Install Giskard Checks via pip, configure your LLM provider, and set up environment variables for LLM-based checks."
sidebar:
  order: 2
---

:::caution
Giskard v3.0.0rc1 is a release candidate. APIs can still change before the stable 3.0.0 release.
:::

## Install with a coding agent

The fastest way to set up Giskard Checks. Paste a single URL into your coding agent and it handles everything — dependency installation, LLM provider configuration, and environment setup.

:::tip[Get Started — Paste this into your coding agent:]

```
Follow the instructions from https://docs.giskard.ai/oss/checks/installation.md and install giskard-checks in my project.
```

:::

### How it works

1. **Paste the URL** into any coding agent (Claude Code, Cursor, Windsurf, Copilot, etc.)
2. **The agent reads** the installation instructions from this page
3. **The agent installs** `giskard-checks` and configures your LLM provider
4. **You review** the changes and start writing checks

:::tip[Want a permanent Giskard expert in your agent?]
Install the [Giskard Agent Skills](/oss/agent-skills). They give your coding agent a durable, opinionated workflow for generating adversarial test scenarios, red-team suites, and RAG evaluation suites, triggered automatically by prompts like _"test my agent"_, _"red-team my chatbot"_, or _"evaluate my RAG"_.
:::

## Install the Python package

Giskard Checks requires **Python 3.12 or higher**. Install using pip:

```bash
pip install "giskard-checks==1.0.2rc1" "giskard-agents[openai]==1.0.2rc1"
```

## Configure the default LLM judge model

Some checks require calling an LLM (`LLMJudge`, `Groundedness`, `Conformity`). To use them, configure a provider SDK. The default `Generator` uses Giskard's native provider SDK integrations; install the matching `giskard-agents` extra, such as `openai` above. LiteLLM is optional through `giskard-agents[litellm]`.

When a judge runs, its prompt includes the test inputs and agent outputs. Those values are sent to the configured LLM provider, so use a provider and model that meet your data-handling requirements. A weak judge model can produce unreliable verdicts.

For OpenAI, set the `OPENAI_API_KEY` environment variable:

```bash
export OPENAI_API_KEY="your-api-key"
```

Preferably, you should set these environment variables in your `.env` file. To load them in Python, install and use `python-dotenv`:

```bash
pip install python-dotenv
```

```python
from dotenv import load_dotenv

load_dotenv()  # loads .env from the current directory
```

Then you can set your preferred LLM judge model like this:

```python
from giskard.agents.generators import Generator
from giskard.checks import set_default_generator

# Create a generator with giskard.agents
llm_judge = Generator(model="openai/gpt-5-mini")

# Configure the checks to use this judge model by default
set_default_generator(llm_judge)
```

We use the `giskard-agents` library to handle LLM generations.

## Next Steps

For a step-by-step lesson with no API key, try [Your First Test](/oss/checks/tutorials/your-first-test) first. Or head to the [Quickstart](/oss/checks/quickstart) for a single example.
