---
title: Contribute to Giskard
description: "Contribute to the Giskard open-source project: set up uv and Python 3.12, follow the giskard-oss workflow for bugs, docs, and checks, and find the community."
---

Everyone is welcome to contribute — whether you fix bugs, improve docs, propose features, or help others in the community. The **canonical contribution process** for the main library is documented in the `giskard-oss` repository; this page summarizes how to get started and where to find help.

## Prerequisites

Before contributing, make sure you have:

- **<a href="https://git-scm.com/" target="_blank">Git</a>** installed
- **Python 3.12+**
- **<a href="https://docs.astral.sh/uv/" target="_blank">uv</a>** — the project's package manager and workspace tool
- **make** — used for all dev commands (on Windows, use WSL or an equivalent)

## Official contributing guide

Read **<a href="https://github.com/Giskard-AI/giskard-oss/blob/main/CONTRIBUTING.md" target="_blank">How to contribute to Giskard ↗</a>** in the `giskard-oss` repository. It covers:

- Reporting bugs and requesting features (search existing issues first)
- Code style and quality: **uv** workspace, Python 3.12+, **Ruff**, **basedpyright**, **pre-commit**
- Contributing checks and scenarios, and where to look in the repo

Also please review and follow the **<a href="https://github.com/Giskard-AI/giskard-oss/blob/main/CODE_OF_CONDUCT.md" target="_blank">Code of Conduct ↗</a>**.

### Make targets (formatting, lint, and checks)

From the **root of `giskard-oss`**, these are the usual commands (details and any updates live in <a href="https://github.com/Giskard-AI/giskard-oss/blob/main/CONTRIBUTING.md" target="_blank">CONTRIBUTING.md ↗</a>):

| Command       | What it does                                                                                                                                                |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make setup`  | Runs `uv sync`, installs dev CLI tools, and enables **pre-commit** hooks so formatting and checks run before you push                                       |
| `make format` | **Ruff** format plus safe auto-fixes (`ruff check --fix`) — use this to normalize code you touched                                                          |
| `make lint`   | **Ruff** check only (no file writes) — quick feedback without changing files                                                                                |
| `make check`  | Full local gate: lint, format check, Python 3.12 compatibility (**vermin**), **basedpyright** types, security, and license checks — run before opening a PR |
| `make test-unit` | Unit tests only — this is the one to run locally. Scope it with `PACKAGE=<lib>`, for example `make test-unit PACKAGE=giskard-checks` |
| `make test`   | **All** tests, unit and functional. Functional tests call live providers and need `OPENAI_API_KEY`, `GOOGLE_API_KEY`, and `ANTHROPIC_API_KEY`; without them they fail |
| `make test-examples` | Runs the canonical files under `examples/` and lints README Python fences. Required whenever you change a public API that documentation shows |

Run `make help` in the repo for other targets.

:::caution[`make setup` fails with a global hooks path]
If you have `core.hooksPath` set globally, the `pre-commit-install` step dies with `Cowardly refusing to install hooks with core.hooksPath set`. Run `make install` followed by `make install-tools` instead; the git hooks are not required to validate your work, and CI runs the same checks.
:::

### Fork-to-PR workflow

1. **Fork** <a href="https://github.com/Giskard-AI/giskard-oss" target="_blank">giskard-oss ↗</a> on GitHub
2. **Clone your fork** and enter the directory:
   ```bash
   git clone https://github.com/<your-username>/giskard-oss.git
   cd giskard-oss
   ```
3. **Set up the dev environment:** `make setup`
4. **Create a feature branch:** `git checkout -b my-feature`
5. **Make your changes**, then run:
   ```bash
   make format                          # auto-format your code
   make check                           # full lint + type + security gate
   make test-unit PACKAGE=<affected-lib>  # unit tests for the library you touched
   ```
   If you changed a public API that the documentation shows, also run `make test-examples`.
6. **Commit** using [Conventional Commits ↗](https://www.conventionalcommits.org/) — for example `fix(llm): update google interactions translator`. Every commit message is expected to follow this format.
7. **Push** to your fork, then **open a pull request** against `main`

CI will run the same checks. A maintainer will review your PR — most PRs receive a first review within a few days.

Integration tests do not run automatically on pull requests from forks: a maintainer has to add the **`safe for build`** label. The label is removed again on every new push, so it is re-applied per revision. This is expected, not a failure of your PR.

### Contributing to the documentation

This docs site (<a href="https://github.com/Giskard-AI/giskard-docs" target="_blank">giskard-docs ↗</a>) is a separate Astro / Starlight project. To contribute:

1. Fork and clone `giskard-docs`
2. Install dependencies: `pnpm install`
3. Preview locally: `pnpm dev`
4. Edit pages under `src/content/docs/` and open a PR

## Reporting a bug

Issues are for bugs, performance problems, feature requests, build problems, and documentation problems. Individual support questions belong on the [Discord ↗](https://discord.com/invite/ABvfpbu69R) instead — that policy is spelled out in [ISSUES.md ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/ISSUES.md). For a small documentation fix, send a PR rather than an issue.

Search the existing issues first. If the bug is new, fill in the issue template and include:

- Your **OS type and version**
- Your **Python version** and the versions of the Giskard packages and other libraries involved
- A short, self-contained snippet that **reproduces the bug in under 30 seconds**
- The **full stack trace**, not just the last line

:::caution[Security vulnerabilities]
Do not report a security vulnerability through a public issue, discussion, or pull request. Submit a private [security advisory ↗](https://github.com/Giskard-AI/giskard/security/advisories) or email `security@giskard.ai`. See [SECURITY.md ↗](https://github.com/Giskard-AI/giskard-oss/blob/main/SECURITY.md).
:::

## Star our repositories on GitHub

If you find Giskard useful, a star helps others find it:

- **<a href="https://github.com/Giskard-AI/giskard-oss" target="_blank">Giskard-AI/giskard-oss ↗</a>** — the main open-source monorepo
- **<a href="https://github.com/Giskard-AI/giskard-docs" target="_blank">Giskard-AI/giskard-docs ↗</a>** — this documentation site

## Community

Questions, discussion, or just want to say hi? Join us on **<a href="https://discord.com/invite/ABvfpbu69R" target="_blank">Discord ↗</a>**.
