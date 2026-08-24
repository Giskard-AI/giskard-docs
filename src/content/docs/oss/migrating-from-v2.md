---
title: Migrating from v2
description: "What changed between Giskard v2 and v3: the new scan and RAG APIs, the packages that replaced the monolith, and the v2 features that stay on v2."
---

Giskard v3 is a rewrite, not an in-place upgrade. v2 code does not run on v3, and some v2 features are deliberately not part of v3. This page summarizes the breaking changes and the migration path; the authoritative list is the [CHANGELOG ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/CHANGELOG.md).

## Breaking changes

- **Python 3.12 or newer is required.** 3.9, 3.10, and 3.11 are no longer supported.
- **The v2 monolith and its ML-model workflow are gone.** `giskard.Model`, `giskard.Dataset`, the automatic tabular/ML scan, the `giskard.testing` ML test suite, and Giskard Hub integration from the OSS package are not part of v3.
- **The LLM Scan and RAGET have new APIs.** `giskard.scan.vulnerability_scan` replaces the v2 LLM scan; `giskard.scan.quality_scan` with a `KnowledgeBase` replaces RAGET. v2 scan reports, test sets, and scripts need migration.
- **Imports use focused packages.** The testing and scanning APIs live under `giskard.checks` and `giskard.scan`. `giskard.agents`, `giskard.llm`, and `giskard.core` are public but rarely used directly.

## Install

```bash
pip install --pre giskard             # checks
pip install --pre "giskard[scan]"     # + vulnerability and quality scan
pip install --pre "giskard[openai]"   # provider SDK for judges and generators
```

`--pre` is required: every v3 release so far is a release candidate. Uninstall the v2 `giskard` distribution first — the two share the `giskard` import namespace and v3 raises `ImportError: Package conflict detected` if both are present.

## Migration steps

1. **Move agent tests to `giskard.checks`.** Wrap the system under test as a sync or async callable, then model each evaluation as a `Scenario` made of interactions and checks. Start from [Check Agentic Systems](/oss/solutions/check-agentic-systems).

2. **Replace v2 LLM Scan calls with `vulnerability_scan`.** Describe the target agent and choose the threat coverage, languages, concurrency, and target mode. See [Scan Vulnerabilities](/oss/solutions/scan-vulnerabilities).

3. **Replace RAGET test-set generation and evaluation with `quality_scan` and a `KnowledgeBase`.** Review the new scenario-based result model before porting any thresholds or report processing — see the [knowledge base reference](/oss/scan/reference/knowledge-base).

4. **Keep tabular/ML scanning, Hub integration, and the legacy ML test suite on v2.** Those features are deliberately outside the v3 scope:

   ```bash
   pip install "giskard[llm]>2,<3"
   ```

   The [v2 documentation ↗](https://legacy-docs.giskard.ai) stays available. v2 remains installable but is no longer actively maintained.

5. **Rebuild suites and report processing around the new result models.** `Suite`, `SuiteResult`, and `ScenarioResult` replace the v2 test-suite objects; `SuiteResult.to_junit_xml()` covers CI reporting. Then re-run your suite.

## What v3 adds

- An async-first `Scenario` API with multi-turn traces, sync and async targets, parallel execution, JUnit export, and LLM-as-judge checks.
- Built-in checks for comparisons, text and regex matching, JSON validity, semantic similarity, readability, Rego policies, composition, and custom functions.
- Native red teaming in `giskard-scan`: generators for adversarial prompts, indirect prompt injection, Crescendo, GOAT, GCG, HarmBench, refusal, sycophancy, and knowledge-base quality.
- Experimental third-party scanners (`garak`, `deepteam`) through `third_party_scan`.
- Provider-agnostic LLM routing with optional OpenAI, Google, Anthropic, Azure, and LiteLLM integrations.
- Optional aggregated telemetry. Prompts, outputs, and scenario text are not sent; set `DO_NOT_TRACK=1` or `GISKARD_TELEMETRY_DISABLED=1` before import to opt out.

Hitting an error during the move? See [Troubleshooting](/oss/troubleshooting).
