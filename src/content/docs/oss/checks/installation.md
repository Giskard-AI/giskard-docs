---
title: "Install Giskard Checks"
description: "Install Giskard Checks via pip, configure your LLM provider, and set up environment variables for LLM-based checks."
sidebar:
  order: 2
---

## Install the Python package

Giskard Checks requires Python 3.12 or higher. Install it together with the SDK for the LLM provider you will use as a judge: an LLM the library calls to grade your agent's replies.

```bash
pip install --pre "giskard[openai]"
```

Everything in the v3 line is a pre-release, so `--pre` is required. Without it, pip resolves to the v2 series, which has none of the API documented here.

No provider SDK ships with `giskard` itself, so installing it without a provider extra leaves LLM-based checks unable to reach a model.

## Pick your provider

Each row is the complete setup for one provider: the install command, the environment variables it reads, and the model string you pass to `Generator`.

| Provider      | Install                                  | Environment variables                                           | Example model string          |
| ------------- | ---------------------------------------- | --------------------------------------------------------------- | ----------------------------- |
| OpenAI        | `pip install --pre "giskard[openai]"`    | `OPENAI_API_KEY`                                                | `openai/gpt-4o-mini`          |
| Google Gemini | `pip install --pre "giskard[google]"`    | `GEMINI_API_KEY` or `GOOGLE_API_KEY`                            | `gemini/gemini-2.0-flash`     |
| Anthropic     | `pip install --pre "giskard[anthropic]"` | `ANTHROPIC_API_KEY`                                             | `anthropic/claude-sonnet-4-5` |
| Azure OpenAI  | `pip install --pre "giskard[azure]"`     | `AZURE_API_KEY`, `AZURE_API_BASE`, `AZURE_API_VERSION`          | `azure/my-deployment`         |
| Azure AI      | `pip install --pre "giskard[azure]"`     | `AZURE_AI_API_KEY`, `AZURE_AI_ENDPOINT`, `AZURE_AI_API_VERSION` | `azure_ai/my-deployment`      |

Use `pip install --pre "giskard[all-llms]"` for all the native SDKs at once.

## Extras for individual checks

Two checks need a dependency that is not installed by default:

| Extra        | Install                                   | Enables                                                                                                                                            |
| ------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all-checks` | `pip install --pre "giskard[all-checks]"` | `Readability`, which needs `textstat`. Without it the check raises `ValidationError: The 'textstat' package is required for the Readability check` |
| `regorus`    | `pip install --pre "giskard[regorus]"`    | `RegoPolicy`, policy-as-code checks evaluated by Rego                                                                                              |

:::caution
The `regorus` extra installs on macOS (Intel and Apple silicon) and on Linux x86_64. On other platforms — Windows and linux-aarch64 — the extra installs nothing and `RegoPolicy` stays unavailable.
:::

:::note[Using LiteLLM instead]
For unsupported providers, install `pip install --pre "giskard[litellm]"` and pass `LiteLLMGenerator` explicitly:

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

:::note[Judged checks cost tokens]
Each judged check is one LLM call per scenario run: a 50-scenario suite with two judged checks is 100 calls. `UserSimulator` costs one call per turn, up to `max_steps`. `SemanticSimilarity` needs no judge but calls an embeddings API.
:::

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
from giskard.agents.generators import Generator
from giskard.checks import set_default_generator

# Create a generator with giskard.agents
# The provider prefix picks the SDK: openai/, google/, anthropic/, azure/, azure_ai/
llm_judge = Generator(model="openai/gpt-4o-mini")

# Configure the checks to use this judge model by default
set_default_generator(llm_judge)
```

Use a capable judge model and review failures before acting on them.

:::note[Under the hood]
`Generator` is an alias for `GiskardLLMGenerator`, which routes the `provider/model` string to that provider's native SDK through `giskard-llm`. The two names refer to the same class.
:::

## Configure Giskard from the environment

If you would rather not call `set_default_generator` at all, set the model in the environment instead. These variables are read from the process environment or from a `.env` file in the working directory.

| Variable                                 | Default                  | What it does                                                        |
| ---------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| `GISKARD_CHECKS_DEFAULT_MODEL`           | `openai/gpt-4o-mini`     | Model used by every judged check when no generator is configured    |
| `GISKARD_CHECKS_DEFAULT_EMBEDDING_MODEL` | `text-embedding-3-small` | Model used by `SemanticSimilarity`                                  |
| `GISKARD_CHECKS_MAX_REPORTED_FAILURES`   | unlimited                | Caps how many failures a report prints, which keeps CI logs bounded |
| `GISKARD_CHECKS_DISABLE_RICH_PRETTY`     | `false`                  | Set it to `1` to turn off rich formatting in reports                |

A generator passed to `set_default_generator`, or to an individual check, always wins over the environment.

## Telemetry and console output

Giskard sends anonymous usage telemetry to PostHog by default, and prints a short message about Giskard Enterprise the first time you import `giskard.checks`. Both can be turned off:

```bash
export GISKARD_TELEMETRY_DISABLED=1   # or the vendor-neutral DO_NOT_TRACK=1
export GISKARD_TELEMETRY_DISABLE_GEOIP=1  # keep telemetry on, drop the location lookup
export GISKARD_QUIET=1                # suppress the welcome message
```

In Python, call `disable_telemetry()`:

```python
from giskard.core.telemetry import disable_telemetry

disable_telemetry()
```

## Next Steps

For a step-by-step lesson, try [Your First Test](/oss/checks/tutorials/your-first-test) first. Or head to the [Quickstart](/oss/checks/quickstart) for a single example.
