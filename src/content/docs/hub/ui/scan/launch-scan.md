---
title: "Launch a scan"
description: "Launch vulnerability scans for AI agents. Configure scan parameters, select vulnerability categories, and monitor real-time progress."
sidebar:
  order: 2
---

Start testing your AI agent for security vulnerabilities.

## Before you launch

A scan runs against a deployed agent, so two things must already exist in your project. First, an agent connected through its API endpoint, as described in [Setup agents](/hub/ui/setup/agents) - the scan sends its attack prompts to that endpoint and reads the responses, so anything your production stack does (guardrails, filters, rate limits) is part of what gets tested. Second, if you want the scan to probe your agent's grounding in your own content, a knowledge base, as described in [Setup knowledge bases](/hub/ui/setup/knowledge-bases). The hallucination probes generate their questions from the documents it contains.

## How to launch a scan

1. **Navigate to the scan page**
   Click **Scan** in the left sidebar

2. **Select your agent**
   Choose which AI agent you want to test from the dropdown

3. **Choose vulnerability categories**
   Select which types of attacks to test (all categories are included by default)

4. **Add knowledge base (optional)**
   Select a knowledge base to enable more targeted testing scenarios

5. **Start the scan**
   Click **Launch Scan** to begin the red teaming process

![Scan configuration with agent, vulnerability categories, and options](/_static/images/hub/scan/launch-scan.png)

## Monitor scan progress

Once started, you can track the scan's progress in real-time:

![Live scan progress showing probe execution and results](/_static/images/hub/scan/scan-running.png)

The scan typically takes 5-15 minutes depending on your agent's complexity and the number of categories selected.

## What the scan runs

The scan executes specialized red teaming probes that adapt to your agent's capabilities and use case, grouped into vulnerability categories: prompt injection, harmful content generation, excessive agency, data exfiltration and others aligned with the OWASP GenAI Top 10. All categories are selected by default. Narrowing the selection makes the scan shorter and the results easier to act on, which is useful when you are re-testing a specific fix, but a full run is the better baseline for a first scan. See [Vulnerability categories](/hub/ui/scan/vulnerability-categories) for what each one probes for.

You do not need to keep the page open while the scan runs, and the results remain available afterwards on the scan results page.


## Next steps

Now that you have launched a scan, you can review the scan results and take action on the detected vulnerabilities.

- **Review scan results** - [Review scan results](/hub/ui/scan/review-scan-results)
