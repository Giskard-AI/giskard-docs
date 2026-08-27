---
title: "Generate prompt preset scenarios"
description: "Create business-specific scenarios using prompt presets. Test LLM agents with custom personas and business rules."
sidebar:
  order: 4
---

Prompt presets allow you to create more targeted, business-specific scenarios without ever needing to edit your agent's core description and functionality. This is super useful if you want to move beyond general testing and simulate how your agents handle specific personas and complex business logic.

Prompt presets are a powerful way to ensure your agent is prepared for real-world user situations and personas. They are:

- **Fully customizable**: Tailored to whatever kind of personas you envision and are important for your departments
- **Rule-driven**: Move from generic stress testing to rule-driven scenarios
- **Higher quality**: Get higher quality datasets that are more reliable for evaluations
- **Business-focused**: Ultimately, an agent that truly understands your business boundaries

By moving from generic stress testing to rule-driven scenarios, you get higher quality datasets that are more reliable for evaluations, and ultimately, an agent that truly understands your business boundaries.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/g_fsrGyJF4E?si=6ohbPagZyCNU7OCp&amp;controls=0" title="How to generate scenarios from prompt presets in Giskard Hub" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

## Getting started

To begin, navigate to the Datasets page and click **Generate** in the upper-right corner of the screen. This will open a modal with two options: Knowledge Base and Prompt preset. Select the **Prompt preset** option.

![Select prompt preset option from generation modal](/_static/images/hub/scenario-select.png)

## Select or create a persona

You'll see a subset of all the personas that you've defined---the user personas that might interact with your bots. You can select an existing one or create a new one.

![Persona selection interface for prompt preset testing](/_static/images/hub/scenario-persona-choose.png)

When creating a new persona, it's always nice to have:

- **A descriptive name**: This helps identify the persona quickly
- **A description**: This helps with the generation understanding and ensures the generated scenarios align with your intended persona

## Define rules

You can then add specific rules that define behaviors your agent should respect and that are at risk of being broken when interacting with the selected personas. These rules help evaluate different persona situations and will be used to generate scenarios that specifically test whether your agent maintains these behaviors.

![Persona configuration form with name, description, and rules](/_static/images/hub/scenario-persona-create.png)

For example:

- **Persona**: Customer using slang/emojis asking about loans
- **Rules**: Enforce professional tone and refusal to do interest calculations

- **Persona**: Crypto investor seeking investment advice
- **Rules**: Refuse to provide unauthorized financial advice and avoid making specific investment recommendations

After defining a set of rules, you can add them to the prompt preset.

## Generate scenarios

Once you've configured your persona and rules, you can:

- **Select your agent**: Choose the agent you want to test (e.g., Zephyr Bank multilingual agent)
- **Set the number of scenarios**: Specify how many scenarios you want to generate

![Prompt preset generation settings with agent and scenario count](/_static/images/hub/scenario-generate.png)

Start running the generation, which will be relatively quick. After running the generation, you'll have high-quality evaluated datasets.

## Review and evaluate

You can see that you have a generated user message that adheres to the persona. You can generate an answer so that you can actually evaluate your agent's response and see if the rules adhere.

After generating an example response, you can also test the evaluation. If the evaluation passes, you have a meaningful scenario. This specific scenario can then be used for a dedicated evaluation dataset and for evaluation runs where you would need to iterate on a high-quality dataset.

## Next steps

- **Review scenarios** - Make sure to [Annotate](/hub/ui/annotate)
- **Generate knowledge base scenarios** - Try [Knowledge base scenarios](/hub/ui/datasets/knowledge-base)
- **Agentic vulnerability detection** - Try [Vulnerability Scanner](/hub/ui/scan)
