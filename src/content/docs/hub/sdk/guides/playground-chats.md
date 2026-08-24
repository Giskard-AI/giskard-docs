---
title: Playground Chats
description: List, retrieve, export, and delete Hub playground chat conversations with hub.playground_chats, and promote them into datasets as test cases.
sidebar:
  order: 7
---

The Hub's **Playground** lets you chat with registered agents interactively from the UI. Each conversation is automatically saved as a **Playground Chat**, which you can then access programmatically for analysis, export, or import into a dataset. To create test cases manually from the UI, see the [manual dataset creation page](/hub/ui/datasets/manual).

Playground chats are read-only records: the SDK can list, retrieve, and delete them, but chats are only created by chatting with an agent in the Hub UI. Each `PlaygroundChat` carries its `id`, the parent `project_id`, the `user` who started the conversation, the `agent` that responded, the full list of `messages`, and `created_at` / `updated_at` timestamps. Messages are `ChatMessageWithMetadata` objects, so alongside `role` and `content` each turn can carry an arbitrary `metadata` dictionary.

## List playground chats

```python
from giskard_hub import HubClient

hub = HubClient()

chats = hub.playground_chats.list(project_id="project-id")

for chat in chats:
    print(f"{chat.id} — agent: {chat.agent.name} — {chat.created_at}")
```

`project_id` is required — chats are always scoped to a single project. On a busy project, pass `limit` and `offset` to page through the results, and `include=["agent"]` to embed the related agent object in each chat.

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

A common use case is to promote interesting playground conversations into a dataset as new test cases. This turns manual exploration into regression coverage: whenever someone finds a prompt that makes the agent misbehave in the Playground, the same conversation can be replayed on every future evaluation. The pattern below takes the trailing assistant turn as the `demo_output` (the reference answer reviewers compare against) and attaches a check to each test case:

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

The `checks` you attach here are the same ones described in [Datasets and checks](/hub/sdk/guides/datasets-and-checks) — start with a built-in identifier such as `no-harmful-content`, then add a `correctness` check with an expected output when you know what the agent should have said. Once the dataset exists, run it against any agent with `hub.evaluations.create()` as shown in [Evaluations](/hub/sdk/guides/evaluations).

---

## Delete playground chats

Chats accumulate quickly once a team starts using the Playground, so clean up once you have exported everything worth keeping. Use `bulk_delete` rather than a loop when removing many chats at once.

```python
hub.playground_chats.delete("chat-id")

# Delete multiple chats at once
hub.playground_chats.bulk_delete(chat_ids=["chat-id-1", "chat-id-2"])
```
