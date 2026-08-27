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

To begin, navigate to the Datasets page and click **Generate** in the upper-right corner of the screen. This opens the **Pick your generation type** modal with two options: Prompt preset and Knowledge base. Select the **Prompt preset** option.

![Select prompt preset option from generation modal](/_static/images/hub/scenario-select.png)

Starting from the Datasets page, the modal also asks for a **Dataset name**: the scenarios land in a new dataset created on the fly. Starting the generation from within an existing dataset skips this and adds the scenarios to that dataset.

## Select or create a prompt preset

Generation runs as a two-step flow. In step 1, **Choose or create**, you pick a prompt preset: a reusable bundle of personas, topics, tone, and rules that shapes the scenarios. Select one of the built-in presets or create your own.

![Prompt preset selection interface](/_static/images/hub/scenario-persona-choose.png)

When creating a new prompt preset, it's always nice to have:

- **A descriptive name**: This helps identify the preset quickly
- **A description**: This guides the generation and keeps the scenarios aligned with your intended personas

## Define rules

You can then add specific rules that define behaviors your agent should respect and that are at risk of being broken when interacting with the selected personas. These rules help evaluate different persona situations and will be used to generate scenarios that specifically test whether your agent maintains these behaviors.

![Add prompt preset form with name, description, and rules](/_static/images/hub/scenario-persona-create.png)

For example:

- **Persona**: Customer using slang/emojis asking about loans
- **Rules**: Enforce professional tone and refusal to do interest calculations

- **Persona**: Crypto investor seeking investment advice
- **Rules**: Refuse to provide unauthorized financial advice and avoid making specific investment recommendations

After defining a set of rules, click **Add** to save the prompt preset.

## Generate scenarios

Step 2, **Review**, shows the selected preset and its rules. Set:

- **Agent**: the agent you want to test.
- **Target key**: the output field the generated checks evaluate. It defaults to the assistant response for a chat agent, or to the first available path in the schema for a structured agent, and you can point it elsewhere. The preset's rules are turned into a conformity check on this key. See [Annotate](/hub/ui/annotate) for how target keys and checks work.
- **Number of scenarios**: how many scenarios to generate.

![Prompt preset generation settings with agent, target key, and scenario count](/_static/images/hub/scenario-generate.png)

Click **Generate**. It runs relatively quickly, and you end up with a high-quality, evaluated dataset.

## Review and evaluate

You can see that you have a generated user message that adheres to the persona. You can generate an answer so that you can actually evaluate your agent's response and see if the rules adhere.

After generating an example response, you can also test the evaluation. If the evaluation passes, you have a meaningful scenario. This specific scenario can then be used for a dedicated evaluation dataset and for evaluation runs where you would need to iterate on a high-quality dataset.

## Next steps

- **Review scenarios** - Make sure to [Annotate](/hub/ui/annotate)
- **Generate knowledge base scenarios** - Try [Knowledge base scenarios](/hub/ui/datasets/knowledge-base)
- **Agentic vulnerability detection** - Try [Vulnerability Scanner](/hub/ui/scan)
