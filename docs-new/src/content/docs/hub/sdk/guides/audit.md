---
title: Audit Log
description: Search and retrieve audit log events for compliance reporting, change history, and debugging.
sidebar:
  order: 8
---

Every significant action in the Hub — creating, updating, or deleting a resource — is recorded in the **Audit Log**. Use the SDK to query these events for compliance reporting, change history, or debugging unexpected changes.

## Search audit events

```python
from giskard_hub import HubClient

hub = HubClient()

events = hub.audit.search(
    filters={"project_id": {"selected_options": ["project-id"]}},
    limit=50,
).data

for event in events:
    print(f"[{event.created_at}] {event.action} on {event.entity_type} {event.entity_id} by {event.user_id}")
```

### Filter by time range

```python
from datetime import datetime, timedelta, timezone

# ISO 8601
since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
now = datetime.now(timezone.utc).isoformat()

events = hub.audit.search(
    filters={"created_at": {"from": since, "to": now}},
    limit=200,
).data
```

### Filter by entity type and action

```python
events = hub.audit.search(
    filters={
        "project_id": {"selected_options": ["project-id"]},
        "entity_type": {"selected_options": ["evaluation"]},
        "action": {"selected_options": ["delete"]},
    },
).data

for event in events:
    print(f"Evaluation {event.entity_id} deleted by {event.user_id} at {event.created_at}")
```

---

## Retrieve audit history for a specific entity

If you want to see every change made to a particular resource — for example, a specific agent or dataset — use `list_entities`:

```python
history = hub.audit.list_entities(
    entity_id="dataset-id",
    entity_type="dataset",
).data

for entry in history:
    print(f"[{entry.created_at}] {entry.action}")
    print("Diff:")
    for diff in entry.diffs:
        print(f"  {diff.kind} {diff.scope} {diff.root}")
        if diff.before_str:
            print(f"    before: {diff.before_str}")
        if diff.after_str:
            print(f"    after: {diff.after_str}")
    print("---")
```

---

## Common use cases

**Compliance report — who deleted evaluations this month:**

```python
from datetime import datetime, timezone

now = datetime.now(timezone.utc)
start_of_month = now.replace(day=1, hour=0, minute=0, second=0).isoformat()

deletions = hub.audit.search(
    filters={
        "project_id": {"selected_options": ["project-id"]},
        "entity_type": {"selected_options": ["evaluation"]},
        "action": {"selected_options": ["delete"]},
        "created_at": {"from": start_of_month},
    },
    limit=500,
).data

print(f"{len(deletions)} evaluations deleted this month:")
for event in deletions:
    print(f"  {event.entity_id} — by {event.user_id} at {event.created_at}")
```
