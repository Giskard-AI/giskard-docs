---
title: "Launch an audit"
description: "Launch an autonomous agent audit in Giskard Hub. Choose Light or Full effort, provide input evaluations, and monitor attack progress and logs."
sidebar:
  order: 2
---

Start an [Autonomous Agent Audit](/hub/ui/autonomous-agent-audit) to test your agent for security vulnerabilities, safety risks, and quality issues.

## Before you start

[Create a project](/hub/ui/setup/projects) and [connect the agent](/hub/ui/setup/agents) you want to audit. Check that the Hub can reach the agent's endpoint.

## How to launch an audit

1. **Open Audits** in the project sidebar, then click **New audit**.
2. **Select your agent** from the **Agent** dropdown.
3. **Choose the effort**: **Light** or **Full**. Light is selected by default.
4. **Add input evaluations (optional)**: expand **Advanced** and select previous evaluations or [upload results from other tools](#use-results-from-other-testing-tools) to use as leads for attacker agents.
5. Click **Launch audit** to start the run.

![Audit setup with agent, effort, and input evaluation options](@assets/images/hub/audit/launch-audit.png)

:::tip[Input evaluations]
Any evaluation from the same project can serve as a lead for attacker agents, such as results from another scanner that you [uploaded as a Hub evaluation](#use-results-from-other-testing-tools), or an evaluation on an internal dataset of known failure cases.
:::

## Choose the audit effort

The effort determines how many of the identified risk scenarios are tested and how deeply they are explored:

| Effort    | Coverage                                                                         | Typical duration |
| --------- | -------------------------------------------------------------------------------- | ---------------- |
| **Light** | Tests a prioritized subset of the risk scenarios in a single attack wave.        | Around one hour  |
| **Full**  | Tests all risk scenarios in the audit's risk model across multiple attack waves. | Several hours    |

A Light audit gives you a quick first look, but it leaves at least half of the risk scenarios untested and its attacker agents are less persistent, so [follow it with a Full audit](/hub/ui/autonomous-agent-audit/review-audit-results#run-a-full-audit-after-a-light-audit).

Times are approximate and depend on your agent's response time. A Light audit can send hundreds to thousands of requests; a Full audit sends more requests and uses more tokens. Check your endpoint's capacity and rate limits before launching.

## Use results from other testing tools

To use results from other testing tools as leads for attacker agents to investigate further, expand **Advanced** and click **Get import prompt**. Share the prompt and your results with your coding assistant to convert and upload them as a Hub evaluation, then select it under **Input evaluations**.

## Monitor progress

The audit progresses through three stages:

1. **Reconnaissance** explores your agent and reviews any input evaluations.
2. **Risk modeling and attacks** identify relevant risk scenarios and test them. Full audits use multiple attack waves.
3. **Report generation** summarizes the findings and recommendations.

The page updates automatically with the current phase, attack activity, and findings so far. Scroll to **Live logs** for execution details. You can leave the page and return to the run from **Audit history**.

![Light audit progress showing attack activity and findings](@assets/images/hub/audit/audit-progress.png)

## Next steps

- [Review audit results](/hub/ui/autonomous-agent-audit/review-audit-results) to inspect findings, recommendations, and evidence.
- [Automate audits with the Hub SDK](/hub/sdk/guides/autonomous-agent-audit).
