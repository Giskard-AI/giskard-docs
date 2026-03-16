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

### 3. `hub.models` → `hub.agents`

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

### 4. `hub.chat_test_cases` → `hub.test_cases`

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

### 5. `hub.evaluate()`, `entity.wait_for_completion()` and `entity.print_metrics()` moved to `hub.helpers`

In v2.x, there was a top-level `hub.evaluate()` shortcut for creating both remote and local evaluations. In v3.x, this shortcut has been moved to `hub.helpers.evaluate()`. The `model` parameter was renamed to `agent`, and a `project` parameter is now required when running a remote evaluation. Entity methods such as `wait_for_completion()` and `print_metrics()` have also been moved to `hub.helpers.wait_for_completion()` and `hub.helpers.print_metrics()`.

```python
# main.py
# v2.x — remote evaluation
remote_eval = hub.evaluate(model=my_model, dataset=my_dataset, name="eval run")
remote_eval.wait_for_completion()
remote_eval.print_metrics()

# v3.x
remote_eval = hub.evaluations.create(
    name="eval run",
    project=my_project, # my_project.id
    agent=my_agent, # or my_agent.id
    dataset=my_dataset, # or my_dataset.id
)
remote_eval = hub.helpers.wait_for_completion(evaluation)
hub.helpers.print_metrics(remote_eval)
```

For local Python agents, use `hub.helpers.evaluate()` passing a `Callable` as `agent`:

```python
# main.py
# v2.x — passing a local function
def my_agent(messages):
    return "Hello from local model"

local_eval = hub.evaluate(model=my_agent, dataset=my_dataset, name="local run")

# v3.x
from giskard_hub.types import ChatMessage, AgentOutput

def my_agent(messages):
    return "Hello from local model"

local_eval = hub.helpers.evaluate(agent=my_agent, dataset=my_dataset, name="local run")
```

### 6. Response objects are now Pydantic models

In v2.x, most responses were plain Python objects with simple attribute access. In v3.x, responses return as `pydantic.BaseModel`:

```python
# main.py
# v2.x
project = hub.projects.retrieve(project_id)
print(project.name)

# v3.x
project = hub.projects.retrieve(project_id)
print(project.name)
print(project.model_dump()["name"])
```

All data objects are now Pydantic models. This means you have access to convenient methods like `.model_dump()`, `.model_dump_json()`, and the full range of Pydantic introspection features. Note that you cannot access properties using square bracket syntax (e.g., `my_object["key"]`); instead, use `.model_dump()` to convert the object to a dictionary if you need key-based access.

### 7. Knowledge base creation — CSV support removed (since v2.0.0)

CSV files are no longer accepted when creating knowledge bases. Use JSON/JSONL or a list of dicts:

```python
# main.py
# v2.x (CSV no longer supported even in v2.0.0+)
# hub.knowledge_bases.create(..., data="my_kb.csv")  # ❌

# v3.x — from a Python list
import json

hub.knowledge_bases.create(
    project_id=project_id,
    name="My KB",
    file=("documents.json", json.dumps([
        {"text": "Document text here.", "topic": "Topic A"},
    ]).encode("utf-8")),
)

# v3.x — from a file on disk
from pathlib import Path

hub.knowledge_bases.create(
    project_id=project_id,
    name="My KB",
    file=Path("documents.json"),
)
```

### 8. `model_id` → `agent_id`

In v2.x, the evaluation resource used `model_id` to refer to the agent. In v3.x, use `agent_id`:

```python
# main.py
# v2.x
hub.evaluations.create(model_id=model_id, dataset_id=dataset_id, ...)

# v3.x
hub.evaluations.create(agent_id=agent_id, dataset_id=dataset_id, ...)
```

### 9. `EvaluationRun.metrics` shape changed

In v2.x, `eval_run.metrics` was a list of `Metric` objects with `.name` and `.percentage`. In v3.x, metrics are available on the `EvaluationAPIResource` object and the individual results:

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

---

## Feature mapping

| v2.x feature | v3.x equivalent |
|---|---|
| `hub.models.create(...)` | `hub.agents.create(...)` |
| `model.chat(messages=[...])` | `hub.agents.generate_completion(agent_id, messages=[...])` |
| `hub.chat_test_cases.create(...)` | `hub.test_cases.create(...)` |
| `hub.evaluate(model=, dataset=, name=)` | `hub.helpers.evaluate(project=, agent=, dataset=, name=)` |
| `hub.evaluate(model=fn, dataset=, name=)` | `hub.helpers.evaluate(agent=fn, dataset_id=, name=)` |
| `entity.wait_for_completion()` | `entity = hub.helpers.wait_for_completion(entity)` |
| `entity.print_metrics()` | `hub.helpers.print_metrics(entity)` |
| `hub.knowledge_bases.create(...)` | `hub.knowledge_bases.create(...)` |
| `kb.wait_for_completion()` | `kb = hub.helpers.wait_for_completion(kb)` |
| `hub.evaluations.create(model_id=, ...)` | `hub.evaluations.create(agent_id=, ...)` |
| `hub.scans.create(model_id=, ...)` | `hub.scans.create(agent_id=, ...)` |
| `hub.scheduled_evaluations.create(model_id=, ...)` | `hub.scheduled_evaluations.create(agent_id=, ...)` |

---

## Features new in v3 (no v2 equivalent)

The following resources have no equivalent in v2.x and require no migration — they are purely additive:

- `hub.projects.scenarios` — scenario management and dataset generation
- `hub.tasks` — issue tracking
- `hub.playground_chats` — playground conversation access
- `hub.audit_logs` — audit log
- `hub.test_cases.comments` — test case annotations
- `hub.scans.probes` / `hub.scans.attempts` — granular scan probe access
- `hub.evaluations.results.search()` — filtered result queries
- `AsyncHubClient` — async client
