---
title: Datasets & Checks
description: Build datasets and checks with the Giskard SDK. Create scenarios, use built-in checks, or define custom checks for agent evaluation.
sidebar:
  order: 4
---

A **Dataset** is a named collection of **Scenarios**. Each scenario defines one or more interactions (an input, an optional expected output, and **checks**) that the Hub uses to evaluate the agent's response. Checks are pass/fail criteria that use an LLM judge, embedding similarity, or rule-based matching — see [Built-in checks](#built-in-checks) for the full reference, and [Custom checks](#custom-checks) for defining reusable configurations.

---

## Create a dataset

```python
from giskard_hub import HubClient

hub = HubClient()

dataset = hub.datasets.create(
    project_id="project-id",
    name="Core Q&A Suite v1",
    description="Baseline correctness and tone checks",
)

print(dataset.id)
```

Datasets carry an `input_schema` and an `output_schema` (JSON Schema) describing the shape of their scenarios. When omitted, they default to the conversational (chat) format used in the examples below. For an agent with structured input/output, pass the matching schemas:

```python
dataset = hub.datasets.create(
    project_id="project-id",
    name="Ticket classification suite",
    input_schema={
        "type": "object",
        "properties": {"ticket_text": {"type": "string"}},
        "required": ["ticket_text"],
    },
    output_schema={
        "type": "object",
        "properties": {"category": {"type": "string"}},
        "required": ["category"],
    },
)
```

See [Agents & Knowledge Bases](/hub/sdk/guides/agents-and-knowledge-bases#structured-agents) for how to configure the agent side.

---

## Add scenarios manually

Each scenario pairs its interactions with a list of checks. Reference any built-in check by its `identifier` string:

```python
scenario = hub.scenarios.create(
    dataset_id="dataset-id",
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "What is your refund policy?"}]
            },
            "output": {
                "response": {
                    "role": "assistant",
                    "content": "We offer a 30-day return policy for all unused items.",
                }
            },
            "checks": [
                {
                    "identifier": "hub_correctness",
                    "params": {
                        "reference": "We offer a 30-day return policy for all unused items.",
                    },
                },
                {
                    "identifier": "hub_conformity",
                    "params": {
                        "rules": [
                            "The agent must answer the question in exactly the same language as the question was asked."
                        ]
                    },
                },
            ],
        }
    ],
)

print(scenario.id)
```

### Output and metadata

The `output` field is an optional recorded answer displayed alongside the scenario in the Hub UI. It is **not** used during evaluation -- the agent always generates a fresh response. If your agent returns structured metadata (e.g. tool calls, categories, resolved status), include it in `output.metadata`:

```python
hub.scenarios.create(
    dataset_id="dataset-id",
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "I need help with my order #12345"}]
            },
            "output": {
                "response": {
                    "role": "assistant",
                    "content": "I've found your order. It was shipped on Monday and should arrive by Thursday.",
                },
                "metadata": {
                    "category": "order_status",
                    "resolved": True,
                    "tools_called": ["order_lookup"],
                },
            },
            "checks": [
                {
                    "identifier": "hub_correctness",
                    "params": {
                        "reference": "Order #12345 shipped Monday, arrives Thursday."
                    },
                },
                {
                    "identifier": "hub_metadata",
                    "params": {
                        "json_path_rules": [
                            {
                                "json_path": "$.category",
                                "expected_value": "order_status",
                                "expected_value_type": "string",
                            },
                        ]
                    },
                },
            ],
        }
    ],
)
```

### Multi-turn conversations

Include prior assistant turns to test multi-turn behaviour:

```python
hub.scenarios.create(
    dataset_id="dataset-id",
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "I ordered a jacket last week."}]
            },
            "output": {
                "response": {
                    "role": "assistant",
                    "content": "Happy to help! What's your order number?",
                }
            },
        },
        {
            "input": {
                "messages": [{"role": "user", "content": "It's #12345. I want to return it."}]
            },
            "output": {
                "response": {
                    "role": "assistant",
                    "content": "I've initiated a return for order #12345. You'll receive a prepaid label by email.",
                }
            },
            "checks": [
                {
                    "identifier": "string_matching",
                    "params": {
                        "keyword": "#12345",
                    },
                },
            ],
        },
    ],
)
```

### Scenarios for structured agents

For an agent with custom schemas, the interaction `input` follows the agent's input schema, and checks point at fields of the structured output via a target path (see [Point checks at structured outputs](#point-checks-at-structured-outputs)):

```python
hub.scenarios.create(
    dataset_id="dataset-id",
    interactions=[
        {
            "input": {"ticket_text": "My card was charged twice, please help."},
            "checks": [
                {
                    "identifier": "equals",
                    "params": {
                        "target_key": "trace.last.outputs.category",
                        "expected_value": "billing",
                    },
                },
            ],
        }
    ],
)
```

### Using tags

Tags let you filter scenarios during evaluation runs:

```python
hub.scenarios.create(
    dataset_id="dataset-id",
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "Do you ship internationally?"}]
            },
            "checks": [
                {
                    "identifier": "hub_groundedness",
                    "params": {
                        "context": "We don't ship outside the EU",
                    },
                },
            ],
        }
    ],
    tags=["shipping", "faq"],
)
```

---

## Add comments to a scenario

You can annotate scenarios with comments for team collaboration:

```python
comment = hub.scenarios.comments.add(
    "scenario-id",
    content="This scenario needs a stronger expected output, the current one is too vague.",
)

print(comment.id)

# Edit a comment
hub.scenarios.comments.edit(
    "comment-id", scenario_id="scenario-id", content="Updated comment text."
)

# Delete a comment
hub.scenarios.comments.delete("comment-id", scenario_id="scenario-id")
```

---

## Import scenarios from a file

Use `hub.datasets.upload()` to import a dataset. Pass a `name` to create a new dataset, or a `dataset_id` to import into an existing one. Each record must follow the scenario schema, with an `interactions` list.

### From a Python list (in-memory)

```python
from giskard_hub import HubClient

hub = HubClient()

scenarios = [
    {
        "interactions": [
            {
                "input": {
                    "messages": [{"role": "user", "content": "What is your return policy?"}]
                },
                "checks": [
                    {
                        "identifier": "hub_correctness",
                        "params": {
                            "reference": "We accept returns within 30 days of purchase."
                        },
                    }
                ],
            }
        ],
    },
    {
        "interactions": [
            {
                "input": {
                    "messages": [{"role": "user", "content": "Do you offer free shipping?"}]
                },
                "checks": [
                    {
                        "identifier": "hub_correctness",
                        "params": {
                            "reference": "Free shipping is available on all orders over $50."
                        },
                    }
                ],
            }
        ],
    },
]

dataset = hub.datasets.upload(
    project_id="project-id",
    name="Imported Suite",
    data=scenarios,
)

print(dataset.id)
```

### From a file on disk

```python
dataset = hub.datasets.upload(
    project_id="project-id",
    name="Imported Suite",
    data="import_data.jsonl",
)
```

---

## Generate scenarios from a prompt preset

Prompt presets describe a persona or behaviour pattern. The Hub uses them to generate diverse scenarios automatically.

First, create a prompt preset or use a predefined one (see [Projects & Prompt Presets](/hub/sdk/guides/projects#prompt-presets)), then:

```python
dataset = hub.datasets.generate_preset_based(
    project_id="project-id",
    agent_id="agent-id",
    prompt_preset_id="prompt-preset-id",
    dataset_name="Preset-generated suite",
    n_examples=10,
)

# Generation is asynchronous — wait for it to finish
dataset = hub.helpers.wait_for_completion(dataset)

print(
    f"Generated dataset: {dataset.id} with {len(hub.datasets.list_scenarios(dataset.id))} scenarios"
)
```

---

## Generate scenarios from documents

Use a Knowledge Base to generate scenarios whose answers are grounded in your documents:

```python
dataset = hub.datasets.generate_document_based(
    project_id="project-id",
    agent_id="agent-id",
    knowledge_base_id="kb-id",
    dataset_name="FAQ-grounded suite",
    n_examples=25,
)

# Generation is asynchronous — wait for it to finish
dataset = hub.helpers.wait_for_completion(dataset)
```

You can optionally filter generation to specific topics in your knowledge base by passing `topic_ids`:

```python
dataset = hub.datasets.generate_document_based(
    project_id="project-id",
    agent_id="agent-id",
    knowledge_base_id="kb-id",
    dataset_name="Shipping-only suite",
    topic_ids=["shipping-topic-id"],
    n_examples=10,
)
```

See [Agents & Knowledge Bases](/hub/sdk/guides/agents-and-knowledge-bases#knowledge-bases) for how to create and populate a Knowledge Base.

---

## List scenarios in a dataset

```python
scenarios = hub.datasets.list_scenarios("dataset-id")

# Paginated search with filters
search_result = hub.datasets.search_scenarios(
    "dataset-id",
    query="payment",
    limit=20,
    offset=0,
)
```

---

## Bulk operations

```python
# Move scenarios to a different dataset
hub.scenarios.bulk_move(
    scenario_ids=["scenario-id-1", "scenario-id-2"],
    target_dataset_id="other-dataset-id",
)

# Bulk update tags on multiple scenarios
hub.scenarios.bulk_update(
    scenario_ids=["scenario-id-1", "scenario-id-2"],
    added_tags=["reviewed"],
)

# Delete multiple scenarios
hub.scenarios.bulk_delete(scenario_ids=["scenario-id-1", "scenario-id-2"])
```

---

## List tags used in a dataset

```python
tags = hub.datasets.list_tags("dataset-id")
print(tags)  # ["shipping", "faq", "reviewed"]
```

---

## Update and delete datasets

```python
hub.datasets.update("dataset-id", name="Core Q&A Suite v2")

hub.datasets.delete("dataset-id")
```

---

## Point checks at structured outputs

By default, checks evaluate the assistant message text (`trace.last.outputs.response.content`). Every check accepts a target path parameter to point it at a different field, which is how you evaluate structured agent outputs:

- Hub LLM checks (`hub_correctness`, `hub_conformity`, `hub_groundedness`) use `text_key`.
- `hub_metadata` uses `metadata_key` (default `trace.last.outputs.metadata`).
- The other checks use `target_key`.

For example, `"target_key": "trace.last.outputs.category"` evaluates the `category` field of a structured response.

---

## Built-in checks

Each built-in check can be used directly in scenarios by passing its `identifier` and the required `params`:

| Identifier                             | Method               | What it evaluates                                                          | Key params                    |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------- | ----------------------------- |
| `hub_correctness`                      | LLM judge            | Does the response fully agree with the reference answer?                   | `reference`                   |
| `hub_conformity`                       | LLM judge            | Does the response comply with one or more business rules?                  | `rules`                       |
| `hub_groundedness`                     | LLM judge            | Is the response grounded in the provided context, without hallucinations?  | `context`                     |
| `llm_judge`                            | LLM judge            | Evaluate with a custom Jinja2 prompt returning pass or fail with a reason. | `prompt`                      |
| `conformity`                           | LLM judge            | Does the full trace conform to a single natural-language rule?             | `rule`                        |
| `groundedness`                         | LLM judge            | Is the answer grounded in context extracted from configurable trace paths? | `context`, `context_key`      |
| `contradiction`                        | LLM judge            | Does the response contradict a reference context?                          | `context`                     |
| `toxicity`                             | LLM judge            | Does the response contain toxic, harmful, or offensive content?            | `categories`                  |
| `answer_relevance`                     | LLM judge            | Does the response directly address the user question?                      | (none required)               |
| `semantic_similarity`                  | Embedding similarity | Is the response semantically close to a reference?                         | `reference_text`, `threshold` |
| `string_matching`                      | Rule-based           | Does the response contain a given keyword or sentence?                     | `keyword`                     |
| `regex_matching`                       | Rule-based           | Does the response match a regular expression pattern?                      | `pattern`                     |
| `equals` / `not_equals`                | Rule-based           | Does a value extracted from the trace equal (or differ from) the expected? | `expected_value`              |
| `greater_than` / `greater_than_equals` | Rule-based           | Is a numeric trace value greater than (or equal to) the expected value?    | `expected_value`              |
| `less_than` / `less_than_equals`       | Rule-based           | Is a numeric trace value less than (or equal to) the expected value?       | `expected_value`              |
| `hub_metadata`                         | Rule-based           | Do JSON path values in the response metadata satisfy specified conditions? | `json_path_rules`             |
| `json_valid`                           | Rule-based           | Is an extracted value valid JSON, optionally conforming to a JSON Schema?  | `expected_schema`             |
| `readability`                          | Rule-based           | Does the response meet readability score thresholds for a chosen metric?   | `metric`                      |

Each check is detailed below.

### Correctness (Hub)

Validates that all information from the **reference** answer is present in the agent's response, without contradiction. Uses an LLM judge.

| Parameter   | Type  | Description                 |
| ----------- | ----- | --------------------------- |
| `reference` | `str` | The expected correct answer |

```python
{
    "identifier": "hub_correctness",
    "params": {"reference": "We offer a 30-day return policy."},
}
```

### Conformity (Hub)

Checks that the agent's response follows one or more rules. Each rule should describe a single, distinct behaviour. Uses an LLM judge.

| Parameter | Type        | Description                                |
| --------- | ----------- | ------------------------------------------ |
| `rules`   | `list[str]` | One or more rules the response must follow |

```python
{
    "identifier": "hub_conformity",
    "params": {
        "rules": [
            "The response must be written in a formal, professional tone.",
            "The response must not include any personal opinions.",
        ]
    },
}
```

### Groundedness (Hub)

Validates that the agent's response is grounded in the provided context -- i.e., it does not introduce information absent from the context. Uses an LLM judge.

| Parameter | Type  | Description                                              |
| --------- | ----- | -------------------------------------------------------- |
| `context` | `str` | The reference context the response should be grounded in |

```python
{
    "identifier": "hub_groundedness",
    "params": {
        "context": "Our return window is 30 days. We do not accept returns on clearance items."
    },
}
```

:::tip
Combine with `hub.knowledge_bases.search_documents()` to dynamically retrieve context from your knowledge base and pass it as the `context` field.
:::

### LLM judge

Evaluates the interaction with a custom prompt. The prompt is a Jinja2 template with access to the trace (use `trace.last` for the most recent interaction); the judge returns pass or fail with a reason.

| Parameter | Type  | Description                                     |
| --------- | ----- | ----------------------------------------------- |
| `prompt`  | `str` | Jinja2 prompt template referencing trace values |

```python
{
    "identifier": "llm_judge",
    "params": {
        "prompt": "The user asked: {{ trace.last.inputs.messages[-1].content }}\nThe agent answered: {{ trace.last.outputs.response.content }}\n\nDoes the answer avoid making promises about delivery dates?"
    },
}
```

### Conformity

The raw giskard-checks variant of conformity. Judges the full trace against a single natural-language rule. Uses an LLM judge.

| Parameter | Type  | Description                       |
| --------- | ----- | --------------------------------- |
| `rule`    | `str` | The rule the trace must adhere to |

```python
{
    "identifier": "conformity",
    "params": {"rule": "The agent must never disclose internal pricing rules."},
}
```

### Groundedness

The raw giskard-checks variant of groundedness. Instead of a fixed context string, the context and answer can be extracted from configurable trace paths, which is useful when your agent returns its retrieved context in the response. Uses an LLM judge.

| Parameter     | Type                | Description                            |
| ------------- | ------------------- | -------------------------------------- |
| `context`     | `str` / `list[str]` | Reference context provided directly    |
| `context_key` | `str`               | Trace path to extract the context from |
| `target_key`  | `str`               | Trace path of the answer under test    |

```python
{
    "identifier": "groundedness",
    "params": {"context_key": "trace.last.outputs.metadata.retrieved_chunks"},
}
```

### Contradiction

Checks that the response does not directly contradict a reference context. Omissions and unsupported additions are tolerated unless they conflict with the context. Uses an LLM judge.

| Parameter     | Type                | Description                            |
| ------------- | ------------------- | -------------------------------------- |
| `context`     | `str` / `list[str]` | Reference context provided directly    |
| `context_key` | `str`               | Trace path to extract the context from |

```python
{
    "identifier": "contradiction",
    "params": {"context": "Our return window is 30 days."},
}
```

### Toxicity

Checks that the response does not contain toxic, harmful, or offensive content. Uses an LLM judge.

| Parameter    | Type        | Description                                                                                                   |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------- |
| `categories` | `list[str]` | Safety categories to check: `hate_speech`, `harassment`, `threats`, `self_harm`, `sexual_content`, `violence` |

```python
{
    "identifier": "toxicity",
    "params": {"categories": ["hate_speech", "threats"]},
}
```

### Answer relevance

Checks that the response directly and appropriately addresses the user question. Uses an LLM judge. No parameters are required; by default the question is taken from the conversation.

| Parameter         | Type   | Description                                   |
| ----------------- | ------ | --------------------------------------------- |
| `question`        | `str`  | Question provided directly (optional)         |
| `include_history` | `bool` | Include prior turns when judging the response |

```python
{"identifier": "answer_relevance"}
```

### Semantic similarity

Computes embedding-based similarity between the agent's response and a reference string. The check passes if the similarity score meets or exceeds the threshold. Does **not** use an LLM judge.

| Parameter        | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| `reference_text` | `str`   | The expected output to compare against |
| `threshold`      | `float` | Similarity threshold (0.0 to 1.0)      |

```python
{
    "identifier": "semantic_similarity",
    "params": {"reference_text": "30-day return policy", "threshold": 0.8},
}
```

### String matching

Checks whether the agent's response contains a specific keyword or substring. Case-sensitive by default; pass `case_sensitive: False` to lowercase both sides before comparison. Does **not** use an LLM judge.

| Parameter        | Type   | Description                            |
| ---------------- | ------ | -------------------------------------- |
| `keyword`        | `str`  | The keyword or substring to search for |
| `case_sensitive` | `bool` | Match case exactly (default: `True`)   |

```python
{"identifier": "string_matching", "params": {"keyword": "#12345"}}
```

### Regex matching

Checks whether the agent's response matches a regular expression pattern. Does **not** use an LLM judge.

| Parameter | Type  | Description                          |
| --------- | ----- | ------------------------------------ |
| `pattern` | `str` | The regular expression to match with |

```python
{"identifier": "regex_matching", "params": {"pattern": r"#\d{5}"}}
```

### Comparison checks

Six rule-based checks compare a value extracted from the trace against an expected value: `equals`, `not_equals`, `greater_than`, `greater_than_equals`, `less_than`, `less_than_equals`. They are the natural fit for structured agent outputs and numeric metadata. The numeric checks default their `target_key` to `trace.last.outputs.metadata.score`.

| Parameter        | Type   | Description                                    |
| ---------------- | ------ | ---------------------------------------------- |
| `expected_value` | scalar | The value to compare against                   |
| `target_key`     | `str`  | Trace path of the value under test             |
| `match`          | `str`  | For list values: `"any"`, `"all"`, or `"none"` |

```python
{
    "identifier": "equals",
    "params": {
        "target_key": "trace.last.outputs.category",
        "expected_value": "billing",
    },
}
```

```python
{
    "identifier": "greater_than_equals",
    "params": {"expected_value": 0.5},  # reads trace.last.outputs.metadata.score
}
```

### Metadata (Hub)

Validates values extracted via JSON path expressions from the response **metadata**. Useful for verifying structured outputs like tool calls, categories, or flags. Does **not** use an LLM judge.

| Parameter         | Type         | Description                                                                       |
| ----------------- | ------------ | --------------------------------------------------------------------------------- |
| `json_path_rules` | `list[dict]` | List of rules, each with `json_path`, `expected_value`, and `expected_value_type` |

Each rule dict supports:

| Key                   | Type  | Description                                                      |
| --------------------- | ----- | ---------------------------------------------------------------- |
| `json_path`           | `str` | JSON path expression (e.g. `$.category`, `$.tools_called[0]`)    |
| `expected_value`      | `str` | The expected value                                               |
| `expected_value_type` | `str` | Type of the expected value (`"string"`, `"number"`, `"boolean"`) |

```python
{
    "identifier": "hub_metadata",
    "params": {
        "json_path_rules": [
            {
                "json_path": "$.category",
                "expected_value": "billing",
                "expected_value_type": "string",
            },
            {
                "json_path": "$.resolved",
                "expected_value": "true",
                "expected_value_type": "boolean",
            },
        ]
    },
}
```

:::note
Metadata checks operate on the `metadata` field of the agent's response (`AgentOutput.metadata`), not on the message content. Your agent endpoint must return metadata in its response for this check to work.
:::

### JSON valid

Checks that a value extracted from the trace is valid JSON and, optionally, that it conforms to a JSON Schema. Does **not** use an LLM judge.

| Parameter         | Type   | Description                                      |
| ----------------- | ------ | ------------------------------------------------ |
| `expected_schema` | `dict` | JSON Schema the value must conform to (optional) |
| `parse`           | `bool` | Parse the value from a string before validating  |

```python
{
    "identifier": "json_valid",
    "params": {
        "expected_schema": {
            "type": "object",
            "properties": {"category": {"type": "string"}},
            "required": ["category"],
        }
    },
}
```

### Readability

Checks that the response satisfies readability score thresholds for a selected metric. Does **not** use an LLM judge.

| Parameter   | Type    | Description                                                                                                                                              |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metric`    | `str`   | One of `flesch_reading_ease`, `flesch_kincaid_grade`, `gunning_fog`, `automated_readability_index`, `coleman_liau_index`, `dale_chall_readability_score` |
| `min_score` | `float` | Minimum acceptable score (optional)                                                                                                                      |
| `max_score` | `float` | Maximum acceptable score (optional)                                                                                                                      |

```python
{
    "identifier": "readability",
    "params": {"metric": "flesch_reading_ease", "min_score": 60},
}
```

---

## Custom checks

Custom checks are pre-configured versions of the built-in check types. Instead of repeating the same `params` in every scenario, you define the configuration once — giving it a project-scoped `identifier` (which must start with `custom_`), a name, and the check params — and then reference it by identifier wherever it's needed.

### Create a custom check

```python
check = hub.checks.create(
    project_id="project-id",
    identifier="custom_tone_professional",
    name="Professional tone",
    description="The response must use formal, professional language with no slang.",
    params={
        "type": "hub_conformity",
        "rules": [
            "The response must be written in a formal, professional tone. It must not contain slang, contractions, or casual phrasing."
        ],
    },
)

print(check.id)
```

Once created, reference your custom check by its `identifier` in any scenario within the same project — no need to repeat the params:

```python
hub.scenarios.create(
    dataset_id="dataset-id",
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "hey, can u help me?"}]
            },
            "checks": [{"identifier": "custom_tone_professional"}],
        }
    ],
)
```

### Examples

**Content safety check:**

```python
hub.checks.create(
    project_id="project-id",
    identifier="custom_no_harmful_content",
    name="No harmful content",
    description="The response must not contain harmful, violent, or offensive content.",
    params={
        "type": "hub_conformity",
        "rules": [
            "The response must be safe for all audiences. It must not contain violence, hate speech, sexual content, or self-harm."
        ],
    },
)
```

**Tool-call verification (metadata check):**

```python
hub.checks.create(
    project_id="project-id",
    identifier="custom_used_search_tool",
    name="Search tool was called",
    description="Verifies that the agent called the search tool during the response.",
    params={
        "type": "hub_metadata",
        "json_path_rules": [
            {
                "json_path": "$.tools_called[0]",
                "expected_value": "search",
                "expected_value_type": "string",
            },
        ],
    },
)
```

### Manage checks

By default, `hub.checks.list()` returns only your custom checks. Built-in checks are referenced directly by identifier and are not listed; pass `filter_builtin=False` to include them.

```python
checks = hub.checks.list(project_id="project-id")

all_checks = hub.checks.list(project_id="project-id", filter_builtin=False)

hub.checks.update("check-id", name="Updated name")

hub.checks.delete("check-id")
```
