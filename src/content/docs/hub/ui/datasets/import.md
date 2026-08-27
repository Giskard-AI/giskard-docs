---
title: "Import scenarios"
description: "Import existing scenarios into Giskard Hub from JSONL or CSV files to build evaluation datasets."
sidebar:
  order: 3
---

You can import existing scenario datasets from a file. This is particularly useful when you already have a dataset that you want to use for evaluation.

In this section, we will walk you through how to import existing scenario datasets from a JSONL or CSV file, obtained from another tool, like Giskard Open Source.

## Create a new dataset

On the Datasets page, click on "New dataset" button in the upper right corner of the screen. You'll then be prompted to enter a name and description for your new dataset.

![New dataset creation dialog with name and description](/_static/images/hub/create-dataset.png)

After creating the dataset, you can either import multiple scenarios or add individual scenarios to it.

## Import a dataset of scenarios

To import scenarios, click the "Import" button in the upper right corner of the screen.

![Dataset scenarios list with import button](/_static/images/hub/import-conversations.png)

You can import data in **JSON or JSONL format**, containing an array of scenarios (or a scenario object per line, if JSONL).

Each scenario must be defined as a JSON object with a `messages` field containing the chat messages in OpenAI format. You can also specify these optional attributes:

- `demo_output`: an object presenting the output of the agent at some point
- `tags`: a list of tags to categorize the scenario
- `checks`: a list of checks to evaluate the scenario, they can be built-in or custom ones

:::tip
For detailed information about built-in checks like correctness, conformity, groundedness, string matching, metadata, and semantic similarity, including examples and how they work, see [Annotation overview](/hub/ui/annotate/overview).
:::

![Scenario import interface for JSON test data](/_static/images/hub/import-conversations-detail.png)

Here's an example of the structure and content in a dataset:

```python
[
    {
        "messages": [
            {"role": "assistant", "content": "Hello!"},
            {"role": "user", "content": "Hi Agent!"},
        ],
        "demo_output": {"role": "assistant", "content": "How can I help you ?"},
        "tags": ["greetings"],
        "checks": [
            {
                "identifier": "correctness",
                "params": {"reference": "How can I help you?"},
            },
            {
                "identifier": "conformity",
                "params": {"rules": ["The agent should not do X"]},
            },
            {
                "identifier": "metadata",
                "params": {
                    "json_path_rules": [
                        {
                            "json_path": "$.tool",
                            "expected_value": "calculator",
                            "expected_value_type": "string",
                        }
                    ]
                },
            },
            {
                "identifier": "semantic_similarity",
                "params": {
                    "reference": "How can I help you?",
                    "threshold": 0.8,
                },
            },
        ],
    }
]
```

Alternatively, you can import data in **CSV format**, containing one message per line.

:::tip
If you need help creating a CSV file, see this [example guide](https://support.microsoft.com/en-us/office/save-a-workbook-to-text-format-txt-or-csv-3e9a9d6c-70da-4255-aa28-fcacf1f081e6).
:::

Each CSV must contain a `user_message` column representing the message from the user. Additionally, the file can contain optional attributes:

- `bot_message`: the answer from the agent
- `tag*`: the list of tags (i.e. tag_1,tag_2,...)
- `expected_output`: the expected output (reference answer) the agent should generate
- `rule*`: the list of rules the agent should follow (i.e. rule_1,rule_2,...)
- `reference_context`: the context in which the agent must ground its response
- `check*`: the list of custom checks (i.e. check_1,check_2,...)

Here's an example of the structure and content in a dataset:

```text
user_message,bot_message,tag_1,tag_2,expected_output,rule_1,rule_2,check_1,check_2
Hi agent!,How can I help you?,greetings,assistance,How can I help you?,The agent should not do X,The agent should be polite,u_greet,u_polite
```

## Next steps

- **Agentic vulnerability detection** - Try [Vulnerability Scanner](/hub/ui/scan)
- **Generate knowledge base scenarios** - Try [Knowledge base scenarios](/hub/ui/datasets/knowledge-base)
- **Generate prompt preset scenarios** - Try [Prompt preset scenarios](/hub/ui/datasets/prompt-preset)
- **Review scenarios** - Make sure to [Annotate](/hub/ui/annotate)
