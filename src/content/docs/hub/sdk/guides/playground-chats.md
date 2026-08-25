---
title: Playground Chats
description: Access, export, and analyze playground chat conversations from the Giskard Hub using the Python SDK for LLM testing.
sidebar:
  order: 7
---

The Hub's **Playground** lets you chat with registered agents interactively from the UI. Each conversation is automatically saved as a **Playground Chat**, which you can then access programmatically for analysis, export, or import into a dataset. To create test cases manually from the UI, see the [manual dataset creation page](/hub/ui/datasets/manual).

## List playground chats

```python
from giskard_hub import HubClient

hub = HubClient()

chats = hub.playground_chats.list(project_id="project-id")

for chat in chats:
    print(f"{chat.id} — agent: {chat.agent.name} — {chat.created_at}")
```

---

## Retrieve a chat with its messages

```python
chat = hub.playground_chats.retrieve(
    "chat-id",
)

print(f"Chat with: {chat.agent.name}")

for msg in chat.messages:
    print(f"[{msg.role}] {msg.content}")
```

---

## Export conversations to a dataset

A common use case is to promote interesting playground conversations into a dataset as new test cases:

```python
chats = hub.playground_chats.list(project_id="project-id")

dataset = hub.datasets.create(
    project_id="project-id",
    name="Playground-sourced test cases",
)

for chat in chats:
    messages = chat.messages

    # If the conversation ends with an assistant turn, treat it as the demo_output
    demo_output = None
    if messages and messages[-1].role == "assistant":
        demo_output = messages.pop()

    if messages:
        hub.test_cases.create(
            dataset_id=dataset.id,
            messages=messages,
            demo_output=demo_output,
            checks=[{"identifier": "no-harmful-content"}],
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
