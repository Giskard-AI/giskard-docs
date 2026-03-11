---
title: Playground Chats
description: Access and export conversations captured from the Giskard Hub playground.
sidebar:
  order: 8
---

The Hub's **Playground** lets you chat with registered agents interactively from the UI. Each conversation is automatically saved as a **Playground Chat**, which you can then access programmatically for analysis, export, or import into a dataset.

## List playground chats

```python
from giskard_hub import HubClient

hub = HubClient()

chats = hub.playground_chats.list(project_id="project-id").data

for chat in chats:
    print(f"{chat.id} — agent: {chat.agent_id} — {chat.created_at}")
```

---

## Retrieve a chat with its messages

```python
chat = hub.playground_chats.retrieve(
    "chat-id",
    include=["agent"],
).data

print(f"Chat with: {chat.included.name}")

for msg in chat.data.messages:
    print(f"[{msg.role}] {msg.content}")
```

---

## Export conversations to a dataset

A common use case is to promote interesting playground conversations into a dataset as new test cases:

```python
chats = hub.playground_chats.list(project_id="project-id").data

dataset = hub.datasets.create(
    project_id="project-id",
    name="Playground-sourced test cases",
).data

for chat in chats:
    full_chat = hub.playground_chats.retrieve(chat.id).data
    messages = [{"role": m.role, "content": m.content} for m in full_chat.data.messages]

    # If the conversation ends with an assistant turn, treat it as the demo_output
    demo_output = None
    if messages and messages[-1]["role"] == "assistant":
        demo_output = messages.pop()

    if messages:
        hub.test_cases.create(
            dataset_id=dataset.id,
            messages=messages,
            demo_output=demo_output,
            checks=[{"identifier": "correctness"}],
        )

print(f"Imported {len(chats)} conversations into dataset {dataset.id}")
```

---

## Delete playground chats

```python
hub.playground_chats.delete("chat-id")

# Delete multiple chats at once
hub.playground_chats.bulk_delete(chat_ids=["chat-id-1", "chat-id-2"])
```
