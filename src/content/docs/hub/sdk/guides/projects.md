---
title: "Projects"
description: Create and manage projects with the Giskard Hub Python SDK. Projects organize your agents, datasets, evaluations, and scans in one workspace.
sidebar:
  order: 1
---

Projects are the top-level organisational unit in the Hub. All agents, datasets, evaluations, and scans belong to a project.

### Create a project

```python
from giskard_hub import HubClient

hub = HubClient()

project = hub.projects.create(
    name="My Agent App",
    description="Evaluation workspace for the production chatbot",
)

print(project.id)
```

### List and retrieve projects

```python
# List all projects you have access to
projects = hub.projects.list()

# Retrieve a specific project by ID
project = hub.projects.retrieve("project-id")
```

### Update and delete a project

```python
hub.projects.update("project-id", name="Renamed Project")

hub.projects.delete("project-id")
```

---

## Prompt Presets

**Prompt Presets** are reusable templates that describe a persona, a topic, or a behaviour pattern within a project. They are used as input when generating preset-based datasets via `hub.datasets.generate_preset_based()`.

### Create a prompt preset

```python
prompt_preset = hub.projects.prompt_presets.create(
    "project-id",
    name="Angry customer asking for refund",
    description="The user is frustrated and demands an immediate refund for a defective product.",
    rules=[
        "The agent should not ask for the user's credit card number",
    ],
)

print(prompt_preset.id)
```

### Preview generated questions from a prompt preset

Before generating a full dataset, you can preview a single sample conversation that a prompt preset would produce:

```python
preview = hub.projects.prompt_presets.preview(
    "project-id",
    agent_id="agent-id",
    description="The user is frustrated and demands an immediate refund for a defective product.",
)

print(preview.inputs)
```

### List and manage prompt presets

```python
prompt_presets = hub.projects.prompt_presets.list("project-id")

hub.projects.prompt_presets.update(
    "prompt-preset-id", project_id="project-id", name="Updated name"
)

hub.projects.prompt_presets.delete("prompt-preset-id", project_id="project-id")
```
