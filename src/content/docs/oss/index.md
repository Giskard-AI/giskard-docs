---
title: Giskard Library
description: "Open-source Python library for testing and evaluating LLM applications, RAG systems, and AI agents."
---

import { LinkCard, CardGrid } from "@astrojs/starlight/components";

**Giskard** is a Python library for testing and evaluating LLM applications, RAG systems, and AI agents. You wrap the system under test as a callable, write scenarios against it, and get pass or fail.

```python
import asyncio

from giskard.checks import Groundedness, Scenario


def get_answer(inputs: str) -> str:
    return "Paris"  # replace with your model or agent


async def main() -> None:
    scenario = (
        Scenario("test_france_capital")
        .interact(inputs="What is the capital of France?", outputs=get_answer)
        .check(
            Groundedness(
                name="answer is grounded",
                context="France is in Western Europe. Its capital is Paris.",
            )
        )
    )
    result = await scenario.run()
    result.print_report()


asyncio.run(main())
```

`Groundedness` is an LLM judge, so this needs a provider and an API key:

```bash
pip install --pre "giskard[openai]"
export OPENAI_API_KEY=...
```

The default judge model is `openai/gpt-4o-mini`. If you would rather start without a key, [Your First Test](/oss/checks/tutorials/your-first-test) uses only deterministic checks.

## Start here

<CardGrid>
  <LinkCard
    title="Check Agentic Systems"
    description="Write the assertions yourself: state a rule in plain English, collect scenarios into a suite, run it in CI."
    href="/oss/solutions/check-agentic-systems"
  />
  <LinkCard
    title="Scan Vulnerabilities"
    description="Describe your agent and let the scan red-team it. Install, wrap, run, read the report."
    href="/oss/solutions/scan-vulnerabilities"
  />
  <LinkCard
    title="Giskard Checks"
    description="The testing library: scenarios, built-in checks, LLM judges, suites, JUnit export."
    href="/oss/checks"
  />
  <LinkCard
    title="Giskard Scan"
    description="The red-teaming and RAG-quality scanner: vulnerability_scan and quality_scan."
    href="/oss/scan"
  />
  <LinkCard
    title="Troubleshooting"
    description="The errors you are most likely to hit on a first run, and what each one means."
    href="/oss/troubleshooting"
  />
  <LinkCard
    title="Migrating from v2"
    description="What changed between Giskard v2 and v3, and what stays on v2."
    href="/oss/migrate-from-v2"
  />
</CardGrid>

## What Giskard v3 does not cover

v3 is a rewrite scoped to agentic and LLM-based systems. Deliberately outside that scope:

- The automatic tabular/ML scan, `giskard.Model`, `giskard.Dataset`, and the `giskard.testing` ML test suite. Keep those on `giskard[llm]>2,<3`.
- Giskard Hub integration from the open-source package. The [Hub](/hub/ui) has its own [Python client](/hub/sdk).
- Python 3.11 and older. v3 requires Python 3.12+.

What a scan or a check *does* need is small: an async or sync Python callable, and an API key for whichever provider judges the answers. There is no server to run, no account, and no instrumentation of your code.

## Versions and stability

Everything in v3 is currently a pre-release, which is why every install command on this site passes `--pre`:

| Package          | Version    | Status |
| :--------------- | :--------- | :----- |
| `giskard`        | `3.0.0rc1` | Beta   |
| `giskard-checks` | `1.0.2rc1` | Beta   |
| `giskard-scan`   | `1.0.0rc1` | Beta   |

`giskard.checks` and `giskard.scan` are the public APIs. `giskard.core`, `giskard.llm`, and `giskard.agents` are pulled in automatically and are rarely used directly. Signatures may still change between release candidates; pin a version if you need reproducible CI, and read the [CHANGELOG ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/CHANGELOG.md) before upgrading.

:::note[Coming from Giskard v2?]
The v2 **Scan** is now `giskard.scan.vulnerability_scan`, and **RAGET** is replaced by `giskard.scan.quality_scan` with a `KnowledgeBase`. Both ship in the `scan` extra: `pip install --pre "giskard[scan]"`. See [Migrating from v2](/oss/migrate-from-v2), or the [v3 announcement ↗](https://github.com/orgs/Giskard-AI/discussions/2250).
:::

## Resources and support

- **Agent Skills**: install [Giskard Agent Skills](/oss/agent-skills) to give Claude Code, Cursor, and other coding agents drop-in workflows for Giskard tasks
- **Contributing**: see [Contribute to Giskard](/oss/contributing) for the dev setup, the verification commands, and how to report a bug
- **Examples**: the [`examples/` directory ↗](https://github.com/Giskard-AI/giskard-oss/tree/main/examples) in `giskard-oss` holds runnable files that CI keeps green
- **Bugs and feature requests**: [open an issue ↗](https://github.com/Giskard-AI/giskard-oss/issues). Security vulnerabilities go to `security@giskard.ai`, never to a public issue — see [SECURITY.md ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/SECURITY.md)
- **Questions and individual support**: the [Discord ↗](https://discord.com/invite/ABvfpbu69R), not the issue tracker

The library is on [GitHub ↗](https://github.com/Giskard-AI/giskard-oss) and was used in DeepLearning.AI's [Red Teaming LLM Applications ↗](https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/) course.
