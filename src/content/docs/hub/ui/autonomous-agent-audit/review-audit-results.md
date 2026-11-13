---
title: "Review audit results"
description: "Review autonomous audit results in Giskard Hub. Inspect trust grades, risk coverage, findings, and recommendations, and reuse audit datasets."
sidebar:
  order: 3
---

Open a completed audit from **Audit history** to understand the risks found in your agent and decide what to fix first.

## AI Trust level and assessment

The **AI Trust level** summarizes your agent's behavior during the audit with a grade from A to D:

| Grade | Label        | Meaning                                                                     |
| ----- | ------------ | --------------------------------------------------------------------------- |
| **A** | Excellent    | No issues were found in the tested behavior.                                |
| **B** | Good         | No high-severity issues were found; improvements are recommended.           |
| **C** | Insufficient | Exploitable attacks were identified and need remediation before production. |
| **D** | Poor         | Failures were found that undermine trust in the agent.                      |

Review the grade alongside the severity counts and overall assessment to prioritize your investigation. For a Light audit, check how many scenarios were covered: untested scenarios still need investigation. The **OWASP coverage** section groups findings that have OWASP category mappings.

![Audit results with trust grade, severity counts, scenario coverage, and assessment](@assets/images/hub/audit/audit-results.png)

## Risk model

The **Risk model** tab lists the risk scenarios identified for your agent. Expand a scenario to understand what could go wrong, which assets are at risk, and why the scenario matters. Linked findings show the issues discovered while testing it.

For a Light audit, the table separates covered scenarios from those left uncovered. Use this to decide whether to run a Full audit for broader coverage.

![Expanded risk scenario with affected assets, rationale, and a linked finding](@assets/images/hub/audit/audit-risk-model.png)

## Findings and recommendations

Open the **Findings** tab and expand a finding to inspect:

- The issue description and severity.
- Its likelihood, impact, and taxonomy categories.
- **Attack examples** linking to recorded test results.
- Related risk scenarios and recommendations.

Follow an attack example to inspect the agent's inputs and responses. Open **Recommendations** to review the proposed fixes and their priorities. Each recommendation links back to the findings it addresses.

![Expanded finding with attack examples and linked recommendations](@assets/images/hub/audit/audit-finding.png)

## Use the audit outputs

### Download the report

When the PDF report is ready, click **Download Report** to save a copy and share the assessment with your team.

![Download Report button on a completed audit](@assets/images/hub/audit/audit-download-report.png)

![Audit report contents, including methodology, risk model, findings, and remediation roadmap](@assets/images/hub/audit/audit-report-contents.png)

### Review evidence and build regression tests

Use the resources in **Audit outputs** to investigate findings and test your fixes:

- **Audit dataset** contains generated scenarios that you can review, refine, and reuse in evaluations.
- **Evidence findings** links to an evaluation containing the results that support the findings.

![Audit dataset and evidence evaluation with scenario and result counts](@assets/images/hub/audit/audit-outputs.png)

Review the generated scenarios before using them as regression tests. After improving your agent, [run an evaluation](/hub/ui/evaluations/create) against the audit dataset and [compare results](/hub/ui/evaluations/compare) to check whether the fixes worked.

If no issues were found, there may be no evidence evaluation. Any problems saving the results are shown in this section.

### Run a Full audit after a Light audit

For a more thorough assessment, click **Run Full Audit** from a completed Light audit. This launches a separate Full audit using the same agent and input evaluations. Both runs remain accessible from **Audit history**.

![Run full audit button on a completed Light audit](@assets/images/hub/audit/audit-run-full.png)

## Next steps

- [Automate audits with the Hub SDK](/hub/sdk/guides/autonomous-agent-audit).
- [Review and annotate test results](/hub/ui/annotate/review-test-results).
- [Schedule evaluations](/hub/ui/evaluations/schedule) to monitor your regression tests.
- [Run vulnerability scans](/hub/ui/scan) for testing with selected categories or probes.
