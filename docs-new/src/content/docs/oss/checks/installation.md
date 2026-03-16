---
title: Install & Configure
sidebar:
  order: 2
---

## Install the Python package

Giskard Checks requires **Python 3.12 or higher**. Install using pip:

``` bash
pip install giskard-checks
```

## Configure the default LLM judge model

Some checks require calling an LLM
(`LLMJudge`, `Groundedness`, `Conformity`). To use them, you'll need configure an LLM provider.  Giskard Checks supports any LiteLLM-compatible provider (Azure, Anthropic, etc.). See the [LiteLLM documentation](https://docs.litellm.ai/docs/providers) for details.  For example, to use OpenAI, you can set the `OPENAI_API_KEY` environment variable:

``` bash
export OPENAI_API_KEY="your-api-key"
```

Preferably, you should set these environment variables in your `.env` file.  Then you can set your preferred LLM judge model like this:

``` python
from giskard.agents.generators import Generator
from giskard.checks import set_default_generator

# Create a generator with giskard.agents
llm_judge = Generator(model="openai/gpt-5-mini")

# Configure the checks to use this judge model by default
set_default_generator(llm_judge)
```

We use the `giskard-agents` library to handle LLM generations.

## Next Steps

Head to the [Quickstart](/oss/checks/quickstart) to write your first test!
