---
title: Evaluations
description: Run remote and local evaluations, schedule recurring runs, inspect results, rerun errors, and integrate with CI/CD pipelines.
sidebar:
  order: 6
---

An **Evaluation** runs an agent against all test cases in a dataset, applies the configured checks to each response, and produces a per-test-case result with a pass/fail verdict.

## Remote evaluations

A remote evaluation calls your registered agent's HTTP endpoint for every test case in the dataset.

```python
import time
from giskard_hub import HubClient

hub = HubClient()

evaluation = hub.evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    criteria={"dataset_id": "dataset-id"},
    name="v2.1 regression run",
).data

# Poll until complete
while evaluation.status.state == "running":
    time.sleep(5)
    evaluation = hub.evaluations.retrieve(evaluation.id).data

print(f"Evaluation finished with status: {evaluation.status.state}")
```

### Filter by tags

Run the evaluation only against test cases with specific tags:

```python
evaluation = hub.evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    criteria={"dataset_id": "dataset-id"},
    name="Shipping-only run",
    tags=["shipping"],
).data
```

### Run multiple times

Set `run_count` to run each test case multiple times (useful for measuring consistency across stochastic outputs):

```python
evaluation = hub.evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    criteria={"dataset_id": "dataset-id"},
    run_count=3,
    name="Consistency check — 3x",
).data
```

---

## Local evaluations

A local evaluation runs inference using a Python function in your process rather than an HTTP endpoint. This is ideal for evaluating models during development without exposing an API.

Define a function that accepts a list of `ChatMessage` objects and returns a string:

```python
from giskard_hub.types import ChatMessage

def my_agent(messages: list[ChatMessage]) -> str:
    # Call your local model or chain here
    user_input = messages[-1].content
    return f"Echo: {user_input}"  # replace with real inference

evaluation = hub.evaluations.create_local(
    project_id="project-id",
    agent_fn=my_agent,
    dataset_id="dataset-id",
    name="Local agent evaluation",
).data
```

The SDK handles the evaluation loop: it fetches each test case, calls `my_agent`, submits the output to the Hub, and triggers check evaluation. Progress and results are stored in the Hub UI just like remote evaluations.

---

## Inspect results

### List all results

```python
results = hub.evaluations.results.list("evaluation-id").data

for result in results:
    print(f"{result.test_case.id}: {result.state}")
    for check in result.results:
        verdict = "✓" if check.passed else "✗"
        print(f"  {verdict} {check.name}")
```

### Search and filter results

```python
page = hub.evaluations.results.search(
    "evaluation-id",
    status="failed",
    limit=50,
).data
```

### Retrieve a single result with its test case

```python
result = hub.evaluations.results.retrieve(
    "result-id",
    evaluation_id="evaluation-id",
    include=["test_case"],
).data

print(result.data.state)
print(result.included)  # the associated TestCase
```

### Update a result (manual review)

```python
hub.evaluations.results.update(
    "result-id",
    evaluation_id="evaluation-id",
    reviewed=True,
    review_comment="Checked manually — response is correct despite the failed judge.",
)
```

### Control result visibility

You can hide individual results from the default view (for example, noisy outliers):

```python
hub.evaluations.results.update_visibility(
    "result-id",
    evaluation_id="evaluation-id",
    visible=False,
)
```

---

## Rerun errored results

If some test cases failed due to transient agent errors (timeouts, 5xx responses), rerun only the errored ones without triggering a full re-evaluation:

```python
hub.evaluations.rerun_errored_results("evaluation-id")
```

Rerun a single specific result:

```python
hub.evaluations.results.rerun_test_case("result-id", evaluation_id="evaluation-id")
```

---

## CI/CD integration

Use evaluations as a quality gate in your CI/CD pipeline. Exit with a non-zero code if any metric falls below your threshold:

```python
import os
import sys
import time
from giskard_hub import HubClient

hub = HubClient()

evaluation = hub.evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    criteria={"dataset_id": "dataset-id"},
    name=f"CI run — {os.environ.get('CI_COMMIT_SHA', 'local')}",
).data

while evaluation.status.state == "running":
    time.sleep(10)
    evaluation = hub.evaluations.retrieve(evaluation.id).data

if evaluation.status.state == "error":
    print("Evaluation encountered errors.")
    sys.exit(1)

results = hub.evaluations.results.list(evaluation.id).data
failed = [r for r in results if r.state == "failed"]
pass_rate = (len(results) - len(failed)) / len(results) * 100

print(f"Pass rate: {pass_rate:.1f}% ({len(results) - len(failed)}/{len(results)})")

THRESHOLD = 90.0
if pass_rate < THRESHOLD:
    print(f"Quality gate failed: pass rate {pass_rate:.1f}% < {THRESHOLD}%")
    sys.exit(1)

print("Quality gate passed.")
```

---

## List and manage evaluations

```python
evaluations = hub.evaluations.list(project_id="project-id").data

hub.evaluations.update("evaluation-id", name="Renamed evaluation")

hub.evaluations.delete("evaluation-id")
```

---

## Scheduled evaluations

**Scheduled Evaluations** automatically run an evaluation on a regular cadence — daily, weekly, or monthly. They're the foundation of continuous quality monitoring: set them up once and the Hub will run them automatically, so you catch regressions without any manual effort.

### Create a scheduled evaluation

```python
schedule = hub.scheduled_evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    dataset_id="dataset-id",
    name="Weekly regression check",
    frequency="weekly",
    time="09:00",       # UTC time of day
    day_of_week=1,      # 1 = Monday, 7 = Sunday
).data

print(f"Scheduled evaluation created: {schedule.id}")
```

### Frequency options

| `frequency` | Description | Required extra params |
|---|---|---|
| `"daily"` | Runs every day at the specified time | `time` |
| `"weekly"` | Runs once a week | `time`, `day_of_week` (1–7) |
| `"monthly"` | Runs once a month | `time`, `day_of_month` (1–28) |

```python
# Daily at 06:00 UTC
hub.scheduled_evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    dataset_id="dataset-id",
    name="Daily smoke test",
    frequency="daily",
    time="06:00",
)

# Monthly on the 1st at 08:00 UTC
hub.scheduled_evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    dataset_id="dataset-id",
    name="Monthly full regression",
    frequency="monthly",
    time="08:00",
    day_of_month=1,
)
```

### List scheduled evaluations

```python
schedules = hub.scheduled_evaluations.list(project_id="project-id").data

for s in schedules:
    print(f"{s.name} — {s.frequency} — next run: {s.next_run_at}")
```

### Retrieve a schedule with its recent runs

```python
schedule = hub.scheduled_evaluations.retrieve(
    "scheduled-evaluation-id",
    include=["evaluations"],
).data

print(f"Schedule: {schedule.data.name}")
for run in schedule.included:
    print(f"  Run {run.id}: {run.status} at {run.created_at}")
```

### List past evaluation runs

```python
runs = hub.scheduled_evaluations.list_evaluations(
    "scheduled-evaluation-id",
    limit=10,
).data

for run in runs:
    print(f"Run: {run.id} — {run.status} — {run.created_at}")
```

### Update and delete scheduled evaluations

```python
hub.scheduled_evaluations.update(
    "scheduled-evaluation-id",
    name="Updated schedule name",
    frequency="daily",
    time="07:30",
)

hub.scheduled_evaluations.delete("scheduled-evaluation-id")
```
