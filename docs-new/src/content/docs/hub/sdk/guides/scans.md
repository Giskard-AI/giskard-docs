---
title: Vulnerability Scanning
description: Run automated vulnerability scans against your agents covering OWASP LLM Top 10 and additional custom categories, review probe results, and assess your security posture.
sidebar:
  order: 3
---

A **Scan** runs a set of automated adversarial probes against your agent to detect security and safety vulnerabilities. Giskard covers the [OWASP LLM Top 10 (2025)](https://owasp.org/www-project-top-10-for-large-language-model-applications/) as well as additional categories that go beyond the OWASP framework — Harmful Content Generation, Brand Damaging & Reputation, Legal & Financial Risk, and Misguidance & Unauthorized Advice. See the full [attack category catalogue](https://docs.giskard.ai/hub/ui/scan/vulnerability-categories/index.html) for details.

## Launch a scan

```python
import time
from giskard_hub import HubClient

hub = HubClient()

scan = hub.scans.create(
    project_id="project-id",
    agent_id="agent-id",
)

print(scan.id)

# Poll until complete
while scan.status.state == "running":
    time.sleep(10)
    scan = hub.scans.retrieve(scan.id)

print(f"Scan complete. Grade: {scan.grade}")
```

The `grade` property gives an overall security posture rating: **A** (best) through **D** (worst), or `N/A` if not enough data was collected.

---

## Scope scans with tags

Use tags to focus the scan on specific vulnerability categories. Giskard covers a subset of the [OWASP LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) as well as additional categories that go beyond the OWASP framework.

| Tag | Category | OWASP mapping |
|---|---|---|
| `gsk:threat-type='prompt-injection'` | Prompt Injection | LLM01 |
| `gsk:threat-type='data-privacy-exfiltration'` | Data Privacy & Exfiltration | LLM05 |
| `gsk:threat-type='excessive-agency'` | Excessive Agency | LLM06 |
| `gsk:threat-type='internal-information-exposure'` | Internal Information Exposure | LLM01-07 |
| `gsk:threat-type='training-data-extraction'` | Training Data Extraction | LLM02 |
| `gsk:threat-type='denial-of-service'` | Denial of Service | LLM10 |
| `gsk:threat-type='hallucination'` | Misinformation / Hallucination | LLM09 |
| `gsk:threat-type='harmful-content-generation'` | Harmful Content Generation | — |
| `gsk:threat-type='misguidance-and-unauthorized-advice'` | Misguidance & Unauthorized Advice | — |
| `gsk:threat-type='legal-and-financial-risk'` | Legal & Financial Risk | — |
| `gsk:threat-type='brand-damaging-and-reputation'` | Brand Damaging & Reputation | — |

```python
scan = hub.scans.create(
    project_id="project-id",
    agent_id="agent-id",
    tags=[
        "gsk:threat-type='prompt-injection'",
        "gsk:threat-type='hallucination'",
    ],
)
```

### Discover available categories

Use `hub.scans.list_categories()` to retrieve the authoritative, up-to-date list of all available categories and their tags at runtime:

```python
categories = hub.scans.list_categories()
for cat in categories:
    print(cat.title, cat.owasp_id)
```

---

## Scan with a Knowledge Base

Pass a `knowledge_base_id` to anchor the probes to your actual document content. This is recommended for RAG-based agents because the attacks will reference real topics from your corpus:

```python
scan = hub.scans.create(
    project_id="project-id",
    agent_id="agent-id",
    knowledge_base_id="kb-id",
)
```

See [Agents & Knowledge Bases](/hub/sdk/guides/agents-and-knowledge-bases#knowledge-bases) for how to create and populate a KB.

---

## Review probe results

### List probes for a scan

```python
probes = hub.scans.list_probes("scan-id")

for probe in probes:
    if probe.status.state == "skipped":
        continue
    print(f"{probe.probe_category} — {probe.probe_name}: {probe.metrics} ({probe.status.state})")
```

### Retrieve a specific probe

```python
probe = hub.scans.probes.retrieve("probe-result-id")
print(probe.probe_description)
```

### List individual probe attempts

Each probe may generate multiple adversarial prompt attempts. Inspect them to understand exactly what the agent was asked and how it responded:

```python
attempts = hub.scans.probes.list_attempts("probe-result-id")

for attempt in attempts:
    print(f"Prompt: {[m.content for m in attempt.messages[:-1]]}")
    print(f"Response: {attempt.messages[-1].content}")
    print(f"Severity: {attempt.severity}")  # higher than 0 means the attack succeeded
    print("---")
```

### Mark an attempt as reviewed

If a flagged attempt is a false positive, update its review status:

```python
from giskard_hub.types import ReviewStatus

hub.scans.attempts.update(
    "probe-attempt-id",
    review_status="ignored",
)
```

---

## Create test cases from successful attacks

When a probe attempt succeeds (the attack elicited an undesired response), you can promote it directly into a dataset test case. This turns one-off scan findings into permanent regression tests that run on every future evaluation.

```python
# Fetch all probes for a completed scan
probes = hub.scans.list_probes("scan-id")

dataset = hub.datasets.create(
    project_id="project-id",
    name=f"Regression tests from scan {'scan-id'}",
)

for probe in probes:
    attempts = hub.scans.probes.list_attempts(probe.id)

    for attempt in attempts:
        # severity > 0 means the agent misbehaved
        if attempt.severity > 0:
            hub.test_cases.create(
                dataset_id=dataset.id,
                messages=[{"role": m.role, "content": m.content} for m in attempt.messages[:-1]],
                demo_output={"role": "assistant", "content": attempt.messages[-1].content},
                checks=[{"identifier": "no-harmful-content"}],  # or any relevant check
                tags=[probe.probe_category],
            )

print(f"Imported attacks into dataset {dataset.id}")
```

---

## List and manage scans

```python
scans = hub.scans.list(project_id="project-id")

hub.scans.delete("scan-id")

hub.scans.bulk_delete(scan_ids=["scan-id-1", "scan-id-2"])
```

---

## CI/CD integration

Use scans as a security gate in your CI/CD pipeline. Exit with a non-zero code if the scan grade falls below your acceptable threshold:

```python
import sys
import time
from giskard_hub import HubClient

hub = HubClient()

scan = hub.scans.create(
    project_id="project-id",
    agent_id="agent-id",
)

while scan.status.state == "running":
    time.sleep(10)
    scan = hub.scans.retrieve(scan.id)

if scan.status.state == "error":
    print("Scan encountered errors.")
    sys.exit(1)

print(f"Scan grade: {scan.grade}")

ACCEPTABLE_GRADES = ["A", "B"]

if scan.grade not in ACCEPTABLE_GRADES:
    print(f"Security gate failed: grade {scan.grade} is not enough.")
    sys.exit(1)

print("Security gate passed.")
```

---

## Interpreting scan grades

| Grade | Meaning |
|---|---|
| **A** | No vulnerabilities detected |
| **B** | Minor issues — low severity findings only |
| **C** | Moderate issues — some high severity findings |
| **D** | Serious issues — critical severity findings |
| **N/A** | Insufficient data to compute a grade |

Grades are computed from the proportion and severity of probes that successfully elicited harmful or undesired behaviour from the agent.
