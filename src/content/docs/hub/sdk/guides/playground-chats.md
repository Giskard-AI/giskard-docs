---
title: Playground Chats
description: Access, export, and analyze playground chat conversations from the Giskard Hub using the Python SDK, and turn real chats into scenarios.
sidebar:
  order: 7
---

The Hub's **Playground** lets you chat with registered agents interactively from the UI. Each conversation is automatically saved as a **Playground Chat**, which you can then access programmatically for analysis, export, or import into a dataset. To create scenarios manually from the UI, see the [manual dataset creation page](/hub/ui/datasets/manual).

## List playground chats

```python
from giskard_hub import HubClient

hub = HubClient()

chats = hub.playground_chats.list(project_id="project-id", include=["agent"])

for chat in chats:
    print(f"{chat.id} — agent: {chat.agent.name} — {chat.created_at}")
```

---

## Retrieve a chat with its messages

```python
chat = hub.playground_chats.retrieve("chat-id", include=["agent"])

print(f"Chat with: {chat.agent.name}")

for exchange in chat.exchanges:
    user_msg = exchange.input["messages"][-1]
    print(f"[{user_msg['role']}] {user_msg['content']}")

    response = exchange.output["response"]
    print(f"[{response['role']}] {response['content']}")
```

---

## Export conversations to a dataset

A common use case is to promote interesting playground conversations into a dataset as new scenarios:

```python
chats = hub.playground_chats.list(project_id="project-id")

dataset = hub.datasets.create(
    project_id="project-id",
    name="Playground-sourced scenarios",
)

for chat in chats:
    interactions = [
        {"input": exchange.input, "output": exchange.output}
        for exchange in chat.exchanges
    ]

    if interactions:
        # Attach the check to the final assistant turn.
        interactions[-1]["checks"] = [
            {
                "identifier": "hub_conformity",
                "params": {
                    "rules": ["The agent must not produce harmful or offensive content"]
                },
            }
        ]
        hub.scenarios.create(
            dataset_id=dataset.id,
            interactions=interactions,
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
