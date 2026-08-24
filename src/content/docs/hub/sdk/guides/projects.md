---
title: Projects
description: Create, list, update, and delete Hub projects with hub.projects, and define reusable scenarios for scenario-based dataset generation.
sidebar:
  order: 1
---

Projects are the top-level organisational unit in the Hub. All agents, datasets, evaluations, and scans belong to a project. Almost every other SDK call takes a `project_id`, so creating a project is normally the first thing you do after connecting the client — see [Core concepts](/hub/sdk/concepts) for how the resources relate to one another.

In practice one project maps to one application under test. Keeping a customer-support chatbot and an internal RAG assistant in separate projects keeps their datasets, agents, and scan histories from mixing, and makes access and audit trails easier to read later.

### Create a project

```python
from giskard_hub import HubClient

hub = HubClient()

project = hub.projects.create(
    name="My LLM App",
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

# Delete several projects in one call
hub.projects.bulk_delete(project_ids=["project-id-1", "project-id-2"])
```

`update()` also accepts `failure_categories`, the project-level classifications used to label why a test case failed. A returned `Project` exposes `id`, `name`, `description`, `failure_categories`, `created_at`, and `updated_at`.

Deleting a project removes everything inside it — agents, datasets, evaluations, and scans — so it is not reversible from the SDK. The deletion is recorded in the [audit log](/hub/sdk/guides/audit) if you need to trace who removed what.

---

## Scenarios

**Scenarios** are reusable templates that describe a persona, a topic, or a behaviour pattern within a project. They are used as input when generating scenario-based datasets via `hub.datasets.generate_scenario_based()`, which takes the `scenario_id` along with a `project_id`, an `agent_id`, and `n_examples`. Because they live on the project, one well-written scenario can seed datasets for every agent in that project.

A scenario is defined by a `description` — the situation the simulated user is in — and an optional list of `rules` the generated conversations should respect. Write the description from the user's point of view, and use the rules for behaviour the agent must or must not exhibit.

### Create a scenario

```python
scenario = hub.projects.scenarios.create(
    "project-id",
    name="Angry customer asking for refund",
    description="The user is frustrated and demands an immediate refund for a defective product.",
    rules=[
        "The agent should not ask for the user's credit card number",
    ],
)

print(scenario.id)
```

### Preview generated questions from a scenario

Before generating a full dataset, you can preview a single sample conversation that a scenario would produce:

```python
preview = hub.projects.scenarios.preview(
    "project-id",
    agent_id="agent-id",
    description="The user is frustrated and demands an immediate refund for a defective product.",
)

print(preview.conversation)
```

`preview()` returns a `ScenarioPreview` with the generated `conversation` and `generated_rules`, the rules inferred from your description. Nothing is persisted, so iterate on the description here until the sample conversation looks like the traffic you actually expect, then generate the full dataset. See [Datasets and checks](/hub/sdk/guides/datasets-and-checks) for the generation step and [Evaluations](/hub/sdk/guides/evaluations) for running the result against an agent.

### List and manage scenarios

```python
scenarios = hub.projects.scenarios.list("project-id")

hub.projects.scenarios.update(
    "scenario-id", project_id="project-id", name="Updated name"
)

hub.projects.scenarios.delete("scenario-id", project_id="project-id")
```
