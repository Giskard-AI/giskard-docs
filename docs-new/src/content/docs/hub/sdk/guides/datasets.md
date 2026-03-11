---
title: Datasets & Test Cases
description: Create datasets and test cases manually, import them from files, or auto-generate them from scenarios or knowledge bases.
sidebar:
  order: 4
---

A **Dataset** is a named collection of **Test Cases**. Each test case defines a conversation (a list of messages) and the checks the Hub should apply to the agent's response.

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

```python
tc = hub.test_cases.create(
    dataset_id=dataset.id,
    messages=[
        {"role": "user", "content": "What is your refund policy?"},
    ],
    demo_output={"role": "assistant", "content": "We offer a 30-day return policy for all unused items."},
    checks=[
        {"identifier": "correctness"},
        {"identifier": "conformity"},
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
        {"identifier": "correctness"},
        {"identifier": "groundedness"},
    ],
)
```

### Using tags

Tags let you filter test cases during evaluation runs:

```python
hub.test_cases.create(
    dataset_id=dataset.id,
    messages=[{"role": "user", "content": "Do you ship internationally?"}],
    checks=[{"identifier": "correctness"}],
    tags=["shipping", "faq"],
)
```

---

## Add comments to a test case

You can annotate test cases with comments for team collaboration:

```python
comment = hub.test_cases.comments.add(
    tc.id,
    text="This test case needs a stronger expected output — the current one is too vague.",
).data

# Edit a comment
hub.test_cases.comments.edit(comment.id, test_case_id=tc.id, text="Updated comment text.")

# Delete a comment
hub.test_cases.comments.delete(comment.id, test_case_id=tc.id)
```

---

## Import test cases from a file

Use `hub.datasets.upload()` to import a dataset from a JSONL or JSON file. Each record must follow the test case schema:

```python
# import_data.jsonl — each line is a JSON object:
# {"messages": [{"role": "user", "content": "..."}], "expected_output": "...", "checks": [...]}

dataset = hub.datasets.upload(
    project_id="project-id",
    name="Imported Suite",
    file_path="import_data.jsonl",
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
```

---

## Generate scenario-based test cases

Scenarios describe a persona or behaviour pattern. The Hub uses them to generate diverse test cases automatically.

First, create a scenario (see [Projects & Agents](/hub/sdk/guides/projects-and-agents#scenarios)), then:

```python
dataset = hub.datasets.generate_scenario_based(
    project_id="project-id",
    scenario_ids=["scenario-id-1", "scenario-id-2"],
    name="Scenario-generated suite",
    num_questions_per_scenario=10,
).data

print(f"Generated {dataset.id}")
```

---

## Generate document-based test cases

Use a Knowledge Base to generate test cases whose answers are grounded in your documents:

```python
dataset = hub.datasets.generate_document_based(
    project_id="project-id",
    knowledge_base_id="kb-id",
    name="FAQ-grounded suite",
    num_questions=25,
).data
```

See [Knowledge Bases](/hub/sdk/guides/knowledge-bases) for how to create and populate a KB.

---

## List test cases in a dataset

```python
test_cases = hub.datasets.list_test_cases("dataset-id").data

# Paginated search with filters
page = hub.datasets.search_test_cases(
    "dataset-id",
    tags=["shipping"],
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
    target_dataset_id="other-dataset-id",
)

# Bulk update tags on multiple test cases
hub.test_cases.bulk_update(
    test_case_ids=["tc-id-1", "tc-id-2"],
    tags=["reviewed"],
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
