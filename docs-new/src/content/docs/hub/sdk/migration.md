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

### 5. `hub.evaluate()` convenience method removed

In v2.x, there was a top-level `hub.evaluate()` shortcut that combined evaluation creation and polling. In v3.x, these steps are explicit.

```python
# main.py
# v2.x
eval_run = hub.evaluate(model=my_model, dataset=my_dataset, name="eval run")
eval_run.wait_for_completion()
eval_run.print_metrics()

# v3.x — remote evaluation
import time

evaluation = hub.evaluations.create(
    name="eval run",
    project_id=project_id,
    agent_id=agent_id,
    dataset_id=dataset_id,
)

evaluation = hub.helpers.wait_for_completion(evaluation)

results = hub.evaluations.results.list(evaluation.id)
```

For local Python agents, use `create_local()`. Unlike v2.x, v3.x requires you to manually fetch the test cases and submit outputs for each one:

```python
# main.py
# v2.x — passing a local function
def my_agent(messages):
    return "Hello from local model"

eval_run = hub.evaluate(model=my_agent, dataset=my_dataset, name="local run")

# v3.x
from giskard_hub.types import ChatMessage

def my_agent(messages: list[ChatMessage]) -> ChatMessage:
    return ChatMessage(role="assistant", content="Hello from local model")

evaluation = hub.evaluations.create_local(
    name="local run",
    agent_info={"name": "my_agent", "description": "A simple local agent"},
    dataste_id="dataset_id",
)

results = hub.evaluations.results.list(
    evaluation_id=evaluation.id,
    include=["test_case"],
)

for result in results:
    agent_output = my_agent(result.test_case.messages)
    hub.evaluations.results.submit_local_output(
        evaluation_id=evaluation.id,
        result_id=result.id,
        output={"response": agent_output},
    )
```

### 6. Response objects are now Pydantic models

In v2.x, most responses were plain Python objects with simple attribute access. In v3.x, all responses are wrapped in `pydantic.BaseModel`:

```python
# main.py
# v2.x
project = hub.projects.retrieve(project_id)
print(project.name)

# v3.x
project = hub.projects.retrieve(project_id)
print(project.name)
```

All data objects are Pydantic models, so you can use `.model_dump()`, `.model_dump_json()`, and standard Pydantic introspection.

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

# v3.x
evaluation = hub.helpers.wait_for_completion(evaluation)
results = hub.evaluations.results.list(evaluation.id)

total = len(results)
passed = sum(1 for r in results if r.state == "passed")
print(f"Pass rate: {passed / total * 100:.1f}%")
```

---

## Feature mapping

| v2.x feature | v3.x equivalent |
|---|---|
| `hub.models.create(...)` | `hub.agents.create(...)` |
| `model.chat(messages=[...])` | `hub.agents.generate_completion(agent_id, messages=[...])` |
| `hub.chat_test_cases.create(...)` | `hub.test_cases.create(...)` |
| `hub.evaluate(model=, dataset=, name=)` | `hub.evaluations.create(project_id=, name=, agent_id=, dataset_id=, )` |
| `hub.evaluate(model=fn, dataset=, name=)` | `hub.evaluations.create_local(agent_info={...}, dataset_id=, name=)` + manual output submission loop — see [Local evaluations](/hub/sdk/guides/evaluations#local-evaluations) |
| `eval_run.wait_for_completion()` | `eval_run = hub.helpers.wait_for_completion(eval_run)` |
| `eval_run.print_metrics()` | Compute from `hub.evaluations.results.list(id)` |
| `hub.knowledge_bases.create(...)` | `hub.knowledge_bases.create(...)` |
| `kb.wait_for_completion()` | Poll `hub.knowledge_bases.retrieve(id).status` |
| `hub.evaluations.create(model_id=, ...)` | `hub.evaluations.create(agent_id=, ...)` |
| `hub.scans.create(model_id=, ...)` | `hub.scans.create(agent_id=, ...)` |
| `hub.scheduled_evaluations.create(...)` | `hub.scheduled_evaluations.create(...)` |
| `hub.checks.create(...)` | `hub.checks.create(...)` |

---

## Features new in v3 (no v2 equivalent)

The following resources have no equivalent in v2.x and require no migration — they are purely additive:

- `hub.projects.scenarios` — scenario management and dataset generation
- `hub.tasks` — issue tracking
- `hub.playground_chats` — playground conversation access
- `hub.audit` — audit log
- `hub.test_cases.comments` — test case annotations
- `hub.scans.probes` / `hub.scans.attempts` — granular scan probe access
- `hub.evaluations.results.search()` — filtered result queries
- `AsyncHubClient` — async client
