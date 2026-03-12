---
title: Datasets & Checks
description: Build datasets and test cases manually, by file import, or via auto-generation. Use built-in checks to evaluate agent responses, or define custom checks for domain-specific criteria.
sidebar:
  order: 4
---

A **Dataset** is a named collection of **Test Cases**. Each test case defines a conversation (a list of messages) and the **checks** the Hub should apply to evaluate the agent's response. Checks are pass/fail criteria that use an LLM judge, embedding similarity, or rule-based matching — see [Built-in checks](#built-in-checks) for the full reference, and [Custom checks](#custom-checks) for defining reusable configurations.

---

## Create a dataset

```python
from giskard_hub import HubClient

hub = HubClient()

dataset = hub.datasets.create(
    project_id="project-id",
    name="Core Q&A Suite v1",
    description="Baseline correctness and tone checks",
).data
```

---

## Add test cases manually

Each test case pairs a conversation with a list of checks. Reference any built-in check by its `identifier` string:

```python
tc = hub.test_cases.create(
    dataset_id=dataset.id,
    messages=[
        {"role": "user", "content": "What is your refund policy?"},
    ],
    demo_output={"role": "assistant", "content": "We offer a 30-day return policy for all unused items."},
    checks=[
        {
            "identifier": "correctness",
            "assertions": [
                {
                    "type": "correctness",
                    "reference": "We offer a 30-day return policy for all unused items.",
                }
            ]
        },
        {
            "identifier": "conformity",
            "assertions": [
                {
                    "type": "conformity",
                    "rules": ["The agent must answer the question in exactly the same language as the question was asked."]
                }
            ],
        },
    ],
).data
```

### Multi-turn conversations

Include prior assistant turns to test multi-turn behaviour:

```python
hub.test_cases.create(
    dataset_id=dataset.id,
    messages=[
        {"role": "user", "content": "I ordered a jacket last week."},
        {"role": "assistant", "content": "Happy to help! What's your order number?"},
        {"role": "user", "content": "It's #12345. I want to return it."},
    ],
    demo_output={"role": "assistant", "content": "I've initiated a return for order #12345. You'll receive a prepaid label by email."},
    checks=[
        {
            "identifier": "string_match",
            "assertions": [
                {
                    "type": "string_match",
                    "keyword": "#12345",
                }
            ],
        },
    ],
)
```

### Using tags

Tags let you filter test cases during evaluation runs:

```python
hub.test_cases.create(
    dataset_id=dataset.id,
    messages=[{"role": "user", "content": "Do you ship internationally?"}],
    checks=[
        {
            "identifier": "groundedness",
            "assertions": [
                {
                    "type": "groundedness",
                    "context": "We don't ship outside the EU"
                }
            ]
        }
    ],
    tags=["shipping", "faq"],
)
```

---

## Add comments to a test case

You can annotate test cases with comments for team collaboration:

```python
comment = hub.test_cases.comments.add(
    tc.id,
    comment="This test case needs a stronger expected output — the current one is too vague.",
).data

# Edit a comment
hub.test_cases.comments.edit(comment.id, test_case_id=tc.id, comment="Updated comment text.")

# Delete a comment
hub.test_cases.comments.delete(comment.id, test_case_id=tc.id)
```

---

## Import test cases from a file

Use `hub.datasets.upload()` to import a dataset. Each record must follow the test case schema, with a `messages` list and an optional `checks` list.

### From a Python list (in-memory)

```python
import json
from giskard_hub import HubClient

hub = HubClient()

test_cases = [
    {"messages": [{"role": "user", "content": "What is your return policy?"}], "checks": [{"identifier": "correctness", "params": {"reference": "We accept returns within 30 days of purchase."}}]},
    {"messages": [{"role": "user", "content": "Do you offer free shipping?"}], "checks": [{"identifier": "correctness", "params": {"reference": "Free shipping is available on all orders over $50."}}]},
]

dataset = hub.datasets.upload(
    project_id="project-id",
    name="Imported Suite",
    file=("test_cases.json", json.dumps(test_cases).encode("utf-8")),
).data

print(dataset.id)
```

### From a file on disk

```python
from pathlib import Path

dataset = hub.datasets.upload(
    project_id="project-id",
    name="Imported Suite",
    file=Path("import_data.jsonl"),
).data
```

### Import from a Giskard RAGET QATestset

If you have an existing `QATestset` from the Giskard open-source library, convert it to the Hub format:

```python
from giskard.rag import QATestset

testset = QATestset.load("my_testset.jsonl")

for item in testset.to_pandas().itertuples():
    hub.test_cases.create(
        dataset_id=dataset.id,
        messages=[{"role": "user", "content": item.question}],
        demo_output={"role": "assistant", "content": item.reference_answer},
        checks=[{"identifier": "correctness"}, {"identifier": "groundedness"}],
    )

for sample in testset.samples:
    checks = []

    # Add correctness check
    if getattr(sample, "reference_answer", None):
        checks.append({"identifier": "correctness", "params": {"reference": sample.reference_answer}})

    # Add groundedness check
    if getattr(sample, "reference_context", None):
        checks.append({"identifier": "groundedness", "params": {"context": sample.reference_context}})

    hub.test_cases.create(
        dataset_id=dataset.id,
        messages=sample.conversation_history,
        checks=checks,
        tags=[sample.metadata["question_type"], sample.metadata["topic"]],
    )
```

---

## Generate scenario-based test cases

Scenarios describe a persona or behaviour pattern. The Hub uses them to generate diverse test cases automatically.

First, create a scenario or use a predefined one (see [Projects & Scenarios](/hub/sdk/guides/projects#scenarios)), then:

```python
dataset = hub.datasets.generate_scenario_based(
    project_id="project-id",
    agent_id="agent-id",
    scenario_id="scenario-id",
    dataset_name="Scenario-generated suite",
    n_examples=10,
).data

print(f"Generated {dataset.id}")
```

---

## Generate document-based test cases

Use a Knowledge Base to generate test cases whose answers are grounded in your documents:

```python
dataset = hub.datasets.generate_document_based(
    project_id="project-id",
    agent_id="agent-id",
    knowledge_base_id="kb-id",
    dataset_name="FAQ-grounded suite",
    n_examples=25,
).data
```

See [Agents & Knowledge Bases](/hub/sdk/guides/agents-and-knowledge-bases#knowledge-bases) for how to create and populate a Knowledge Base.

---

## List test cases in a dataset

```python
test_cases = hub.datasets.list_test_cases("dataset-id").data

# Paginated search with filters
search_result = hub.datasets.search_test_cases(
    "dataset-id",
    search="payment",
    limit=20,
    offset=0,
).data
```

---

## Bulk operations

```python
# Move test cases to a different dataset
hub.test_cases.bulk_move(
    test_case_ids=["tc-id-1", "tc-id-2"],
    dataset_id="other-dataset-id",
)

# Bulk update tags on multiple test cases
hub.test_cases.bulk_update(
    test_case_ids=["tc-id-1", "tc-id-2"],
    added_tags=["reviewed"],
)

# Delete multiple test cases
hub.test_cases.bulk_delete(test_case_ids=["tc-id-1", "tc-id-2"])
```

---

## List tags used in a dataset

```python
tags = hub.datasets.list_tags("dataset-id").data
print(tags)  # ["shipping", "faq", "reviewed"]
```

---

## Update and delete datasets

```python
hub.datasets.update("dataset-id", name="Core Q&A Suite v2")

hub.datasets.delete("dataset-id")
```

---

## Built-in checks

| Identifier | Method | What it evaluates | Key params |
|---|---|---|---|
| `correctness` | LLM judge | Is the response factually correct relative to the expected output? | `reference` |
| `conformity` | LLM judge | Does the response follow specified format, tone, or style requirements? | `rules` |
| `groundedness` | LLM judge | Is the response grounded in the provided context, without hallucinations? | `context` |
| `semantic_similarity` | Embedding similarity | Is the response semantically equivalent to the expected output? | `reference`, `threshold` |
| `string_match` | Rule-based | Does the response contain a specific keyword or substring? | `keyword` |
| `metadata` | Rule-based | Do JSON path values in the response metadata satisfy specified conditions? | `json_path_rules` |

---

## Custom checks

Custom checks are pre-configured versions of the built-in check types. Instead of repeating the same `params` in every test case, you define the configuration once — giving it a project-scoped `identifier`, a name, and the check params — and then reference it by identifier wherever it's needed.

### Create a custom check

```python
check = hub.checks.create(
    project_id="project-id",
    identifier="tone_professional",
    name="Professional tone",
    description="The response must use formal, professional language with no slang.",
    assertions=[
        {
            "type": "conformity",
            "rules": ["The response must be written in a formal, professional tone. It must not contain slang, contractions, or casual phrasing."],
        }
    ],
).data
```

Once created, reference your custom check by its `identifier` in any test case within the same project — no need to repeat the params:

```python
hub.test_cases.create(
    dataset_id="dataset-id",
    messages=[{"role": "user", "content": "hey, can u help me?"}],
    checks=[
        {"identifier": "tone_professional"},
    ],
)
```

### Examples

**Content safety check:**

```python
hub.checks.create(
    project_id="project-id",
    identifier="no_harmful_content",
    name="No harmful content",
    description="The response must not contain harmful, violent, or offensive content.",
    assertions=[
        {
            "type": "conformity",
            "rules": ["The response must be safe for all audiences. It must not contain violence, hate speech, sexual content, or self-harm."],
        }
    ],
)
```

**Tool-call verification (metadata check):**

```python
hub.checks.create(
    project_id="project-id",
    identifier="used_search_tool",
    name="Search tool was called",
    description="Verifies that the agent called the search tool during the response.",
    assertions=[
        {
            "type": "metadata",
            "json_path_rules": [
                {
                    "json_path": "$.tools_called",
                    "expected_value": "search",
                    "expected_value_type": "string",
                }
            ],
        }
    ],
)
```

### Manage checks

```python
checks = hub.checks.list(project_id="project-id").data

hub.checks.update("check-id", name="Updated name")

hub.checks.delete("check-id")
```

