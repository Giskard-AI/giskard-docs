---
title: Projects & Agents
description: Create and manage projects, agents, and scenarios with the Giskard Hub SDK.
sidebar:
  order: 1
---

## Projects

Projects are the top-level organisational unit in the Hub. All agents, datasets, evaluations, and scans belong to a project.

### Create a project

```python
from giskard_hub import HubClient

hub = HubClient()

project = hub.projects.create(
    name="My LLM App",
    description="Evaluation workspace for the production chatbot",
).data

print(project.id)
```

### List and retrieve projects

```python
# List all projects you have access to
projects = hub.projects.list().data

# Retrieve a specific project by ID
project = hub.projects.retrieve("project-id").data
```

### Update and delete a project

```python
hub.projects.update("project-id", name="Renamed Project")

hub.projects.delete("project-id")
```

---

## Scenarios

**Scenarios** are reusable templates that describe a persona, a topic, or a behaviour pattern within a project. They are used as input when generating scenario-based datasets via `hub.datasets.generate_scenario_based()`.

### Create a scenario

```python
scenario = hub.projects.scenarios.create(
    project.id,
    name="Angry customer asking for refund",
    description="The user is frustrated and demands an immediate refund for a defective product.",
    rules=[
        "The agent should not ask for the user's credit card number",
    ],
).data
```

### Preview generated questions from a scenario

Before generating a full dataset, you can preview a single sample conversation that a scenario would produce:

```python
preview = hub.projects.scenarios.preview(
    project.id,
    agent_id="agent-id",
    description="The user is frustrated and demands an immediate refund for a defective product.",
).data

print(preview.conversation)
```

### List and manage scenarios

```python
scenarios = hub.projects.scenarios.list(project.id).data

hub.projects.scenarios.update(scenario.id, project_id=project.id, name="Updated name")

hub.projects.scenarios.delete(scenario.id, project_id=project.id)
```

---

## Agents

An **Agent** is your LLM application. The Hub calls your agent's HTTP endpoint during evaluations and scans.

### Register a remote agent

```python
agent = hub.agents.create(
    project_id=project.id,
    name="Support Bot v2",
    description="GPT-4o chatbot with RAG over the product knowledge base",
    url="https://your-app.example.com/api/chat",
    supported_languages=["en", "fr"],
    headers=[{"name": "Authorization", "value": "Bearer <token>"}],
).data

print(agent.id)
```

The Hub sends a POST request to `url` with a JSON body containing a `messages` array of `{role, content}` objects. Your endpoint must return a JSON object with a `message` field.

### Test the connection

Before running an evaluation, verify your agent endpoint is reachable and responds correctly:

```python
ping = hub.agents.test_connection(
    url="https://your-app.example.com/api/chat",
    headers={"Authorization": "Bearer <token>"},
).data

print(ping.response)
```

### Generate a completion

You can invoke a registered agent directly from the SDK without running a full evaluation:

```python
output = hub.agents.generate_completion(
    agent.id,
    messages=[
        {"role": "user", "content": "What is the capital of France?"},
    ],
).data

print(output.response)
print(output.metadata)  # any metadata returned by your agent
```

### Auto-generate a description

If your agent's description is missing or stale, the Hub can generate one by observing how the agent behaves:

```python
description = hub.agents.autofill_description(agent.id).data
hub.agents.update(agent.id, description=description)
```

### Using a local Python function as an agent

For evaluations where you don't want to expose an HTTP endpoint — for example, when evaluating a model locally during development — pass a Python callable to `hub.evaluations.create_local()`. See [Evaluations](/hub/sdk/guides/evaluations#local-evaluations) for details.

### List, update, and delete agents

```python
agents = hub.agents.list(project_id=project.id).data

hub.agents.update(agent.id, name="Support Bot v2.1")

hub.agents.delete(agent.id)
```
