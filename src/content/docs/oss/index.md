---
title: Giskard Library
description: "Pytest-native, async-first, framework-agnostic behavioral testing of LLM applications and AI agents. Scenarios and checks instead of metric scores, running fully local."
---

**Giskard Library** is a Python package for testing and evaluating AI applications: LLM-based systems, RAG applications, and AI agents.

The library is available on [GitHub](https://github.com/Giskard-AI/giskard-oss) and formed the basis for the [Red Teaming LLM Applications](https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/) course on DeepLearning.AI.

:::caution
Giskard v3 is currently in Pre-release (Beta). We are actively refining the APIs and welcome early adopters to provide feedback and report issues as we move toward a stable 3.0.0 release.
:::

Giskard is pytest-native, async-first, and framework-agnostic: you test agent *behavior* with scenarios and checks rather than chasing metric scores. It runs fully local, and the same library that tests your app also red-teams it.

v3 is a major rewrite, with new features such as [Checks](/oss/checks) and a redesigned [Scan](/oss/solutions/scan-vulnerabilities).

:::note
Coming from Giskard v2? Scan has shipped in v3 with a new design, see [Scan for vulnerabilities](/oss/solutions/scan-vulnerabilities). RAGET is still v2-only; until it lands, use the [Giskard v2 documentation ↗](https://legacy-docs.giskard.ai). Follow our progress on the [v3 roadmap ↗](https://github.com/Giskard-AI/giskard-oss/issues/2252).
:::

## Resources and support

- **Checks**: Explore the [Checks documentation](/oss/checks) for detailed guides
- **Scan**: Probe your app for vulnerabilities with [Scan](/oss/solutions/scan-vulnerabilities)
- **Agent Skills**: Install [Giskard Agent Skills](/oss/agent-skills) to give Claude Code, Cursor, and other coding agents drop-in workflows for Giskard tasks
- **Contributing**: See [Contribute to Giskard](/oss/contributing) for the official guide, AI-agent notes, and repos to star
- **Examples**: Check our [GitHub repository ↗](https://github.com/Giskard-AI/giskard-oss) for more examples
- **Community**: Join our [Discord ↗](https://discord.com/invite/ABvfpbu69R) for support and discussions
