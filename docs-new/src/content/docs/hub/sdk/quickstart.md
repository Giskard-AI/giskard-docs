---
title: Quickstart
description:
  Install the Giskard Hub SDK, authenticate, and run your first LLM evaluation
  in minutes.
sidebar:
  order: 2
---

This tutorial walks you through installing the SDK, connecting to the Hub, and
running a complete evaluation against an LLM agent — from dataset creation to
reading results.

## Prerequisites

- Python 3.10 or later
- A running Giskard Hub instance (cloud or self-hosted)
- An API key from the Hub UI (User Settings → API Keys)

## 1. Install the SDK

```bash
pip install giskard-hub
```

## 2. Configure authentication

The SDK reads your Hub URL and API key from environment variables. Set them
before running any code:

```bash
export GISKARD_HUB_BASE_URL="https://your-hub-instance.example.com"
export GISKARD_HUB_API_KEY="gsk_..."  # pragma: allowlist secret
```

Alternatively, pass them directly to the client constructor:

```python
from giskard_hub import HubClient

hub = HubClient(
    base_url="https://your-hub-instance.example.com",
    api_key="gsk_...",  # pragma: allowlist secret
)
```

:::tip For CI/CD pipelines, always use environment variables rather than
hard-coding credentials. :::

## 3. Create a project

Projects are the top-level container for all your resources. Create one or
retrieve an existing one:

```python
# Create a new project
project = hub.projects.create(
    name="Customer Support Bot",
    description="Evaluation project for our support chatbot",
)

# Or list existing projects and pick one
projects = hub.projects.list()
project = projects[0]

print(f"Using project: {project.name} ({project.id})")
```

## 4. Register an agent

An agent points to your LLM application. The Hub calls this endpoint during
evaluations.

```python
agent = hub.agents.create(
    project_id=project.id,
    name="Support Bot v1",
    description="GPT-4o-based customer support chatbot",
    url="https://your-app.example.com/api/chat",
    supported_languages=["en"],
    headers={"Authorization": "Bearer <your-app-token>"},
)

print(f"Agent registered: {agent.id}")
```

:::note Your agent endpoint must accept a JSON body with a `messages` array and
return a response in the format the Hub expects. See
[Agents & Knowledge Bases](/hub/sdk/guides/agents-and-knowledge-bases) for
details on local Python agents. :::

## 5. Run a vulnerability scan

Before building a dataset, run a quick scan to surface security weaknesses in
your agent:

```python
scan = hub.scans.create(
    project_id=project.id,
    agent_id=agent.id,
    tags=["gsk:threat-type='prompt-injection'"],
)

print(f"Scan started: {scan.id}")

scan = hub.helpers.wait_for_completion(scan)

print(f"Scan complete. Grade: {scan.grade}")
```

The grade ranges from **A** (no issues found) to **D** (critical vulnerabilities
detected). See [Vulnerability Scanning](/hub/sdk/guides/scans) for the full tag
catalogue, KB-grounded scans, and how to review probe results and turn
successful attacks into test cases.

## 6. Create a dataset and add test cases

A dataset is a collection of test cases — conversations with expected outcomes
and quality checks.

```python
dataset = hub.datasets.create(
    project_id=project.id,
    name="Core Q&A Suite",
    description="Basic correctness and tone checks",
)

# Add a test case
hub.test_cases.create(
    dataset_id=dataset.id,
    messages=[
        {"role": "user", "content": "What is your return policy?"},
    ],
    demo_output="We offer a 30-day return policy for all items.",
    checks=[
        {
            "identifier": "correctness",
            "params": {
                "type": "correctness",
                "reference": "We offer a 30-day return policy for all items.",
            },
        },
    ],
)
```

The `checks` field controls which criteria are applied to each agent response —
these can be LLM-judge, embedding similarity, or rule-based checks. See
[Checks & Metrics](/hub/sdk/guides/checks) for the full list of built-in checks
and how to define custom ones.

## 7. Run an evaluation

Now trigger an evaluation that sends every test case to your agent and scores
the responses:

```python
evaluation = hub.evaluations.create(
    project_id=project.id,
    agent_id=agent.id,
    dataset_id=dataset.id,
    name="v1 baseline",
)

print(f"Evaluation started: {evaluation.id}")

evaluation = hub.helpers.wait_for_completion(evaluation)

print("Evaluation complete!")
```

## 8. Read the results

Once complete, fetch the per-test-case results and inspect the metrics:

```python
evaluation_results = hub.evaluations.results.list(evaluation.id)

for eval_result in evaluation_results:
    print(f"Test case {eval_result.test_case.id}: {eval_result.state}")
    for check_result in eval_result.results:
        print(
            f"  {check_result.details.get('check_name', 'Unknown')}: {'✓' if check_result.passed else '✗'}"
        )
```

You can also view the full evaluation with aggregated metrics in the Hub UI.

## Next steps

- **Local agents**: evaluate a Python function directly without an HTTP endpoint
  — see [Evaluations](/hub/sdk/guides/evaluations#local-evaluations)
- **Generate test cases automatically**: use scenarios or knowledge bases — see
  [Datasets](/hub/sdk/guides/datasets)
- **Vulnerability scanning**: find security weaknesses with
  [Scans](/hub/sdk/guides/scans)
- **Schedule recurring runs**: see
  [Scheduled Evaluations](/hub/sdk/guides/evaluations#scheduled-evaluations)
- **Full API details**: see the [API Reference](/hub/sdk/reference)
