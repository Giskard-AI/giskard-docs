---
title: "Autonomous Agent Audit"
description: "Launch autonomous agent audits with the Giskard Hub Python SDK. Monitor progress, retrieve output datasets and evaluations, and manage audits."
sidebar:
  order: 2.5
---

An **Autonomous Agent Audit** investigates security vulnerabilities, safety risks, and quality issues in your agent through targeted attacks and returns a risk model, findings, and recommendations. Use `hub.red_team_audits` to run audits from Python. You can also [launch and review audits in the Hub UI](/hub/ui/autonomous-agent-audit).

## Before you start

Follow the [SDK quickstart](/hub/sdk/quickstart) to connect to the Hub, then [register the agent](/hub/sdk/guides/agents-and-knowledge-bases) you want to audit.

The audit calls your agent's endpoint and can send hundreds to thousands of requests. Check the endpoint's capacity and rate limits before launching.

## Launch an audit

Use `target_agent_id` to identify the agent you want to audit. It must belong to the selected project.

```python
from giskard_hub import HubClient

hub = HubClient()

audit = hub.red_team_audits.create(
    project_id="project-id",
    target_agent_id="agent-id",
    name="Customer support agent audit",
    mode="light",
)

print(audit.id, audit.status)
```

The audit runs in the Hub. Save `audit.id` to check its progress and retrieve the results.

Use `mode="light"` for a Light audit or `mode="regular"` for a Full audit.

### Provide existing evaluations

Pass `input_evaluation_ids` to use previous results as leads for attacker agents, choosing evaluations from the same project:

```python
audit = hub.red_team_audits.create(
    project_id="project-id",
    target_agent_id="agent-id",
    name="Audit informed by existing evaluations",
    mode="light",
    input_evaluation_ids=["evaluation-id-1", "evaluation-id-2"],
)
```

## Monitor progress

Retrieve the audit to inspect its current `status` and optional progress details:

```python
audit = hub.red_team_audits.retrieve("audit-id")
print(audit.status)

if audit.progress is not None:
    print("Phase:", audit.progress.phase)
    print("Findings so far:", audit.progress.findings)
```

Retrieve the audit again to refresh its progress while it runs.

## Retrieve the output dataset and evaluation

Use `output_dataset_id` to retrieve the audit's generated scenarios and `output_evaluation_id` to retrieve the evidence supporting its findings:

```python
if audit.output_dataset_id:
    dataset = hub.datasets.retrieve(audit.output_dataset_id)
    print("Audit dataset:", dataset.id, dataset.name)

if audit.output_evaluation_id:
    evaluation = hub.evaluations.retrieve(audit.output_evaluation_id)
    print("Evidence evaluation:", evaluation.id, evaluation.name)
```

See [Datasets and Checks](/hub/sdk/guides/datasets-and-checks) to refine the scenarios and [Evaluations](/hub/sdk/guides/evaluations) to test your fixes.

## List and delete audits

List audits in a project:

```python
for previous_audit in hub.red_team_audits.list(project_id="project-id"):
    print(previous_audit.id, previous_audit.name, previous_audit.status)
```

To delete an audit you no longer need:

```python
hub.red_team_audits.delete("audit-id")
```

Deleting an audit that is still running cancels it first.

## Next steps

- [Review the report in the Hub UI](/hub/ui/autonomous-agent-audit/review-audit-results).
- [Run evaluations](/hub/sdk/guides/evaluations) using your audit's regression dataset.
- [Run vulnerability scans](/hub/sdk/guides/scans) for testing with selected categories or probes.
