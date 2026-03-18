---
title: Migration Guide
description: Migrate from the Giskard Hub SDK v2.x to v3.x — breaking changes, renamed resources, and updated patterns.
sidebar:
  order: 7
---

This guide covers only the features that existed in v2.x. For new features introduced in v3, see the [Release Notes](/hub/sdk/release-notes).

## Install v3

```bash
pip install --upgrade giskard-hub
```

Verify the installed version:

```bash
python -c "import giskard_hub; print(giskard_hub.__version__)"
```

---

## Feature mapping

Use this table as a quick reference for every renamed API, parameter, and pattern.

| v2.x | v3.x |
|---|---|
| `from giskard_hub.data import ChatMessage` | `from giskard_hub.types import ChatMessage` |
| `HubClient(url=..., token=...)` | `HubClient(base_url=..., api_key=...)` |
| `GISKARD_HUB_URL` / `GISKARD_HUB_TOKEN` | `GISKARD_HUB_BASE_URL` / `GISKARD_HUB_API_KEY` |
| `hub.models.create(...)` | `hub.agents.create(...)` |
| `model.chat(messages=[...])` | `hub.agents.generate_completion(agent_id, messages=[...])` |
| `hub.chat_test_cases.create(...)` | `hub.test_cases.create(...)` |
| `hub.evaluate(model=, dataset=, name=)` | `hub.helpers.evaluate(agent=, dataset=, project=, name=)` |
| `hub.evaluate(model=fn, dataset=, name=)` | `hub.helpers.evaluate(agent=fn, dataset=, name=)` |
| `entity.wait_for_completion()` | `entity = hub.helpers.wait_for_completion(entity)` |
| `entity.print_metrics()` | `hub.helpers.print_metrics(entity)` |
| `hub.evaluations.create(model_id=, dataset_id=)` | `hub.evaluations.create(agent_id=, dataset_id=, project_id=)` |
| `hub.scans.create(model_id=)` | `hub.scans.create(agent_id=, project_id=)` |
| `hub.scheduled_evaluations.create(model_id=)` | `hub.scheduled_evaluations.create(agent_id=)` |
| `hub.knowledge_bases.create(...)` | `hub.knowledge_bases.create(...)` |
| `ScanResult` / `scan_result.grade.value` | `Scan` / `scan.grade` |
| `ScanResult.model` | `Scan.agent` |
| `hub.datasets.generate_adversarial(model_id=, categories=, ...)` | `hub.datasets.generate_scenario_based(agent_id=, scenario_id=, project_id=)` |
| `hub.datasets.generate_document_based(model_id=, n_questions=)` | `hub.datasets.generate_document_based(agent_id=, n_examples=, project_id=)` |
| `dataset.chat_test_cases` | `hub.datasets.search_test_cases(dataset.id)` |
| `Metric.percentage` | `Metric.success_rate` (multiply by 100 for %) |

---

## Features new in v3 (no v2 equivalent)

The following resources have no equivalent in v2.x and require no migration -- they are purely additive:

- `hub.projects.scenarios` -- scenario management and dataset generation
- `hub.tasks` -- issue tracking
- `hub.playground_chats` -- playground conversation access
- `hub.audit_logs` -- audit log
- `hub.test_cases.comments` -- test case annotations
- `hub.scans.probes` / `hub.scans.attempts` -- granular scan probe access
- `hub.evaluations.results.search()` -- filtered result queries
- `hub.evaluations.run_single()` -- evaluate a single test case ad hoc
- `hub.evaluations.rerun_errored_results()` -- rerun only errored results
- `hub.knowledge_bases.search_documents()` -- semantic search over documents
- `hub.datasets.upload()` -- import datasets from files
- `AsyncHubClient` -- async client

---

## Breaking changes

### 1. Environment variables renamed

| v2.x | v3.x |
|---|---|
| `GISKARD_HUB_URL` | `GISKARD_HUB_BASE_URL` |
| `GISKARD_HUB_TOKEN` | `GISKARD_HUB_API_KEY` |

Update your shell configuration, `.env` files, and CI/CD secrets accordingly.

```bash
# v2.x
export GISKARD_HUB_URL="https://your-hub.example.com"
export GISKARD_HUB_TOKEN="gsk_..."

# v3.x
export GISKARD_HUB_BASE_URL="https://your-hub.example.com"
export GISKARD_HUB_API_KEY="gsk_..."
```

### 2. Constructor parameter names changed

| v2.x | v3.x |
|---|---|
| `HubClient(url=..., token=...)` | `HubClient(base_url=..., api_key=...)` |

```python
# main.py
# v2.x
from giskard_hub import HubClient
hub = HubClient(url="https://...", token="gsk_...")

# v3.x
from giskard_hub import HubClient
hub = HubClient(base_url="https://...", api_key="gsk_...")
```

### 3. Type import path changed

In v2.x, data types were imported from `giskard_hub.data`. In v3.x, they are imported from `giskard_hub.types`:

```python
# main.py
# v2.x
from giskard_hub.data import ChatMessage

# v3.x
from giskard_hub.types import ChatMessage
```

### 4. `hub.models` -> `hub.agents`

The resource for LLM applications was renamed from `models` to `agents`, and the corresponding type from `ModelOutput` to `AgentOutput`.

```python
# main.py
# v2.x
model = hub.models.create(
    project_id=project_id,
    name="My Bot",
    url="https://...",
    supported_languages=["en"],
    headers={},
)
output = model.chat(messages=[...])
print(output.message.content)

# v3.x
agent = hub.agents.create(
    project_id=project_id,
    name="My Bot",
    url="https://...",
    supported_languages=["en"],
    headers={},
)
output = hub.agents.generate_completion(agent.id, messages=[...])
print(output.response)
```

Note that `model.chat()` no longer exists as an entity method. Instead, call `hub.agents.generate_completion()` passing the agent ID.

### 5. `hub.chat_test_cases` -> `hub.test_cases`

The resource for creating and managing test cases was renamed.

```python
# main.py
# v2.x
hub.chat_test_cases.create(
    dataset_id=dataset_id,
    messages=[{"role": "user", "content": "Hello"}],
    checks=[{"identifier": "correctness"}],
)

# v3.x
hub.test_cases.create(
    dataset_id=dataset_id,
    messages=[{"role": "user", "content": "Hello"}],
    checks=[{"identifier": "correctness"}],
)
```

### 6. `model_id` -> `agent_id` and `project_id` now required

Across all resources, `model_id` was renamed to `agent_id`. In addition, `project_id` is now a required parameter for `evaluations.create` and `scans.create`.

```python
# main.py
# v2.x
hub.evaluations.create(model_id=model_id, dataset_id=dataset_id, ...)
hub.scans.create(model_id=model_id, ...)
hub.scheduled_evaluations.create(model_id=model_id, ...)

# v3.x
hub.evaluations.create(agent_id=agent_id, dataset_id=dataset_id, project_id=project_id, ...)
hub.scans.create(agent_id=agent_id, project_id=project_id, ...)
hub.scheduled_evaluations.create(agent_id=agent_id, ...)
```

### 7. Entity methods moved to `hub.helpers`

In v2.x, `hub.evaluate()` was a top-level shortcut, and entities had `wait_for_completion()` and `print_metrics()` methods. In v3.x, all of these have been moved to `hub.helpers`:

| v2.x | v3.x |
|---|---|
| `hub.evaluate(model=..., dataset=...)` | `hub.helpers.evaluate(agent=..., dataset=..., project=...)` |
| `entity.wait_for_completion()` | `entity = hub.helpers.wait_for_completion(entity)` |
| `entity.print_metrics()` | `hub.helpers.print_metrics(entity)` |

This applies to **all** entity types that previously had these methods -- evaluations, scans, datasets, and knowledge bases.

**Remote evaluations:**

```python
# main.py
# v2.x
remote_eval = hub.evaluate(model=my_model, dataset=my_dataset, name="eval run")
remote_eval.wait_for_completion()
remote_eval.print_metrics()

# v3.x
remote_eval = hub.evaluations.create(
    name="eval run",
    project_id=my_project.id,
    agent_id=my_agent.id,
    dataset_id=my_dataset.id,
)
remote_eval = hub.helpers.wait_for_completion(remote_eval)
hub.helpers.print_metrics(remote_eval)
```

**Local evaluations:**

```python
# main.py
# v2.x
def my_agent(messages):
    return "Hello from local model"

local_eval = hub.evaluate(model=my_agent, dataset=my_dataset, name="local run")

# v3.x
def my_agent(messages):
    return "Hello from local model"

local_eval = hub.helpers.evaluate(agent=my_agent, dataset=my_dataset, name="local run")
```

**Knowledge bases:**

```python
# main.py
# v2.x
kb = hub.knowledge_bases.create(...)
kb.wait_for_completion()

# v3.x
kb = hub.knowledge_bases.create(...)
kb = hub.helpers.wait_for_completion(kb)
```

:::note
`hub.helpers.wait_for_completion()` **returns** the refreshed entity. Always reassign the result: `entity = hub.helpers.wait_for_completion(entity)`.
:::

### 8. Scan type and access patterns changed

The scan result type was renamed from `ScanResult` to `Scan`. Several properties and access patterns changed:

| v2.x | v3.x |
|---|---|
| `ScanResult` | `Scan` |
| `scan_result.model` | `scan.agent` |
| `scan_result.grade.value` | `scan.grade` |
| `scan_result.wait_for_completion(timeout=600)` | `scan = hub.helpers.wait_for_completion(scan, poll_interval=5, max_retries=120)` |
| `scan_result.print_metrics()` | `hub.helpers.print_metrics(scan)` |

```python
# main.py
# v2.x
scan_result = hub.scans.create(model_id=model_id)
scan_result.wait_for_completion(timeout=600)
print(scan_result.grade.value)
print(scan_result.model.name)
scan_result.print_metrics()

# v3.x
scan = hub.scans.create(agent_id=agent_id, project_id=project_id)
scan = hub.helpers.wait_for_completion(scan, poll_interval=5, max_retries=120)
print(scan.grade)
print(scan.agent.name)
hub.helpers.print_metrics(scan)
```

:::tip
In v2.x, `wait_for_completion(timeout=600)` accepted a single timeout in seconds. In v3.x, use `poll_interval` (seconds between polling) and `max_retries` to control the total timeout. For example, `poll_interval=5, max_retries=120` gives a 10-minute timeout (5s x 120 = 600s).
:::

### 9. Dataset generation methods changed

#### `generate_adversarial` removed

The `hub.datasets.generate_adversarial()` method has been removed. Use `hub.datasets.generate_scenario_based()` instead. Note that the new method takes a `scenario_id` instead of `categories`:

```python
# main.py
# v2.x
dataset = hub.datasets.generate_adversarial(
    model_id=model_id,
    categories=["prompt_injection", "harmful_content"],
    description="Security test cases",
    dataset_name="Adversarial Suite",
)

# v3.x — use generate_scenario_based instead
dataset = hub.datasets.generate_scenario_based(
    agent_id=agent_id,
    project_id=project_id,
    scenario_id=scenario_id,
    dataset_name="Adversarial Suite",
    n_examples=20,
)
```

See [Projects & Scenarios](/hub/sdk/guides/projects#scenarios) for how to create scenarios.

#### `generate_document_based` parameters changed

```python
# main.py
# v2.x
dataset = hub.datasets.generate_document_based(
    model_id=model_id,
    knowledge_base_id=kb_id,
    n_questions=20,
    dataset_name="KB suite",
)

# v3.x
dataset = hub.datasets.generate_document_based(
    agent_id=agent_id,
    project_id=project_id,
    knowledge_base_id=kb_id,
    n_examples=20,  # renamed from n_questions
    dataset_name="KB suite",
)
```

#### `dataset.chat_test_cases` property removed

The convenience property for accessing a dataset's test cases was removed. Use the resource method instead:

```python
# main.py
# v2.x
test_cases = dataset.chat_test_cases

# v3.x
test_cases = hub.datasets.search_test_cases(dataset.id)
```

#### `dataset.wait_for_completion()` moved to helpers

```python
# main.py
# v2.x
dataset = hub.datasets.generate_document_based(...)
dataset.wait_for_completion()

# v3.x
dataset = hub.datasets.generate_document_based(...)
dataset = hub.helpers.wait_for_completion(dataset)
```

### 10. Response objects are now Pydantic models

In v2.x, most responses were plain Python objects with simple attribute access. In v3.x, responses are `pydantic.BaseModel` instances:

```python
# main.py
# v2.x
project = hub.projects.retrieve(project_id)
print(project.name)

# v3.x — attribute access works the same
project = hub.projects.retrieve(project_id)
print(project.name)

# v3.x — new Pydantic methods available
print(project.model_dump()["name"])
print(project.model_dump_json())
```

All data objects are now Pydantic models. This means you have access to convenient methods like `.model_dump()`, `.model_dump_json()`, and the full range of Pydantic introspection features. Note that you cannot access properties using square bracket syntax (e.g., `my_object["key"]`); instead, use `.model_dump()` to convert the object to a dictionary if you need key-based access.

### 11. Knowledge base creation -- CSV support removed (since v2.0.0)

CSV files are no longer accepted when creating knowledge bases. Use JSON/JSONL or a list of dicts:

```python
# main.py
# v2.x (CSV no longer supported even in v2.0.0+)
# hub.knowledge_bases.create(..., data="my_kb.csv")  # removed

# v3.x — from a Python list
hub.knowledge_bases.create(
    project_id=project_id,
    name="My KB",
    data=[
        {"text": "Document text here.", "topic": "Topic A"},
    ],
)

# v3.x — from a file on disk
hub.knowledge_bases.create(
    project_id=project_id,
    name="My KB",
    data="documents.json",
)
```

### 12. `Metric.percentage` -> `Metric.success_rate`

In v2.x, `eval_run.metrics` was a list of `Metric` objects with a `.percentage` field. In v3.x, the field was renamed to `.success_rate` (a float between 0 and 1):

```python
# main.py
# v2.x
eval_run.wait_for_completion()

for metric in eval_run.metrics:
    print(f"{metric.name}: {metric.percentage}%")

eval_run.print_metrics()

# v3.x
eval_run = hub.helpers.wait_for_completion(eval_run)

for metric in eval_run.metrics:
    print(f"{metric.name}: {metric.success_rate * 100}%")

hub.helpers.print_metrics(eval_run)
```
