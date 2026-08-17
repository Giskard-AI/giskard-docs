---
title: Giskard Library
description: "Open-source Python library for testing and evaluating LLM applications, RAG systems, and AI agents."
---

**Giskard Library** is a Python package for testing and evaluating AI applications. It provides a solid foundation for developers to ensure quality and reliability in LLM-based systems, RAG applications, and AI agents.

An LLM gives a different answer every time, so you cannot assert on an exact string the way you would for ordinary code. Giskard lets you assert on behavior instead: "the answer stays on topic", "the answer is supported by the retrieved documents", "the agent refuses to reveal its system prompt".

The library is available on [GitHub ↗](https://github.com/Giskard-AI/giskard-oss) and formed the basis for the [Red Teaming LLM Applications ↗](https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/) course on DeepLearning.AI.

Giskard is pytest-native, async-first, and framework-agnostic behavioral testing for LLM apps and agents: you write scenarios and checks that pass or fail instead of metric scores, run them locally against your own LLM provider, and red-team the same agent with the same library.

In practice you write two things. A scenario is one test case: a message, or a short conversation, to send to your agent. A check is a rule the reply has to satisfy, either plain Python or a rule written in English and graded by an LLM (a judge). Tests run under pytest and report pass or fail, not a score you then have to interpret. Red teaming is the other half: instead of testing that normal requests work, you send hostile ones on purpose, such as attempts to make the agent leak its instructions ([prompt injection](/start/glossary/security/injection)), produce [harmful content](/start/glossary/security/harmful-content), or [state things that are not true](/start/glossary/business/hallucination). See the [glossary](/start/glossary) for the failure types Giskard looks for.

Beyond Giskard's own generators, the scan can run garak's probes and deepteam's attacks against the same agent through the optional `giskard-scan[garak]` and `giskard-scan[deepteam]` extras. See [Scan for vulnerabilities](/oss/solutions/scan-vulnerabilities).

Verdicts from an LLM judge are evidence, not certification. A judge is sometimes wrong in both directions, and a suite that passes means those scenarios did not break your agent, not that the agent is safe.

## A first check

Write a scenario, send one message to your agent, and state the rule its reply has to satisfy:

```python
import asyncio

from giskard.checks import Conformity, Scenario


async def my_agent(inputs: str) -> str:
    # Call your own LLM app, chain, or agent here
    ...


scenario = (
    Scenario("stays_on_topic")
    .interact(inputs="What is your refund policy?", outputs=my_agent)
    .check(Conformity(rule="The answer only discusses the company's refund policy."))
)

result = asyncio.run(scenario.run())
result.print_report()
```

## A first scan

Describe the agent in plain language, and the scan generates hostile inputs for it, runs them, and prints a report:

```python
import asyncio

from giskard.scan import vulnerability_scan

suite_result = asyncio.run(
    vulnerability_scan(
        target=my_agent,
        description="A customer-support agent for a bank that answers questions about accounts and cards.",
        languages=["en"],
    )
)
```

v3 is a major rewrite, with new features such as [Checks](/oss/checks) and a redesigned [Scan](/oss/solutions/scan-vulnerabilities).

:::note
Coming from Giskard v2? Scan has shipped in v3 with a new design, see [Scan for vulnerabilities](/oss/solutions/scan-vulnerabilities). RAGET is not part of v3; for it, use the [Giskard v2 documentation ↗](https://legacy-docs.giskard.ai).
:::

## Resources and support

- **Checks**: Explore the [Checks documentation](/oss/checks) for detailed guides
- **Scan**: Probe your agent for vulnerabilities with [Scan](/oss/solutions/scan-vulnerabilities)
- **Agent Skills**: Install [Giskard Agent Skills](/oss/agent-skills) to give Claude Code, Cursor, and other coding agents drop-in workflows for Giskard tasks
- **Contributing**: See [Contribute to Giskard](/oss/contributing) for the official guide, AI-agent notes, and repos to star
- **Examples**: Check our [GitHub repository ↗](https://github.com/Giskard-AI/giskard-oss) for more examples
- **Community**: Join our [Discord ↗](https://discord.com/invite/ABvfpbu69R) for support and discussions

## Next Steps

- **Install & Configure**: Set up the packages and your LLM provider in [Install & Configure](/oss/checks/installation)
- **Your First Test**: Write your first scenario in [Your First Test](/oss/checks/tutorials/your-first-test)
