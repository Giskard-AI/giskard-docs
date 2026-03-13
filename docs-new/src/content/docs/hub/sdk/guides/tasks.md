---
title: Tasks
description: Create and manage tasks to track issues found during evaluations and scans.
sidebar:
  order: 6
---

**Tasks** are a lightweight issue tracker built into the Hub. When an evaluation or scan surfaces a problem, you can create a task to track the fix, assign it to a team member, and mark it as resolved — all from the SDK.

## Create a task

```python
from giskard_hub import HubClient

hub = HubClient()

task = hub.tasks.create(
    project_id="project-id",
    priority="high",
    status="open",
    description="Evaluation result #eval-result-id shows the agent quoting 3-5 days when the correct answer is 1-2 days.",
    evaluation_result_id="eval-result-id",
    assignee_ids=["user-id-1", "user-id-2"],
)

print(f"Task created: {task.id}")
```

### Status values

| Status | Meaning |
|---|---|
| `"open"` | Newly created, not yet picked up |
| `"in_progress"` | Actively being worked on |
| `"resolved"` | Fixed and verified |

### Priority values

| Priority | When to use |
|---|---|
| `"low"` | Nice-to-fix, no urgency |
| `"medium"` | Should be addressed in the next cycle |
| `"high"` | Needs attention soon |

---

## List tasks

```python
tasks = hub.tasks.list(project_id="project-id")

open_tasks = [t for t in tasks if t.status == "open"]
print(f"{len(open_tasks)} open tasks")
```

---

## Update a task

```python
# Pick up a task
hub.tasks.update("task-id", status="in_progress")

# Resolve it
hub.tasks.update("task-id", status="resolved")
```

---

## Retrieve a task

```python
task = hub.tasks.retrieve("task-id")
print(task.description, task.status, task.priority)
```

---

## Delete tasks

```python
hub.tasks.delete("task-id")

hub.tasks.bulk_delete(task_ids=["task-id-1", "task-id-2"])
```

---

## Workflow example: create tasks from failed evaluation results

A common pattern is to automatically create tasks for every failed test case after an evaluation:

```python
import time

evaluation = hub.evaluations.create(
    project_id="project-id",
    agent_id="agent-id",
    criteria={"dataset_id": "dataset-id"},
    name="CI run",
)

while evaluation.status.state == "running":
    time.sleep(5)
    evaluation = hub.evaluations.retrieve(evaluation.id)

failed_results = hub.evaluations.results.search(
    evaluation.id,
    filters={"sample_success": {"selected_options": ["fail"]}},
)

for result in failed_results:
    hub.tasks.create(
        project_id="project-id",
        description=f"Test case {result.test_case.id} failed checks: "
                    + ", ".join(c.name for c in result.results if not c.passed),
        status="open",
        priority="medium",
        evaluation_result_id=result.id,
    )

print(f"Created {len(failed_results)} tasks from failed results.")
```
