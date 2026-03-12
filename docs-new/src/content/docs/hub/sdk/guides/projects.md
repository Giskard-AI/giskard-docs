---
title: Projects
description: Create and manage projects and scenarios with the Giskard Hub SDK.
sidebar:
  order: 1
---

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
