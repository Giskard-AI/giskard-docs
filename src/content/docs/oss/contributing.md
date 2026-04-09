---
title: Contribute to Giskard
description: "How to contribute to the Giskard open-source project: prerequisites, workflow, and community."
sidebar:
  order: 2
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

| Command | What it does |
| :--- | :--- |
| `make setup` | Runs `uv sync`, installs dev CLI tools, and enables **pre-commit** hooks so formatting and checks run before you push |
| `make format` | **Ruff** format plus safe auto-fixes (`ruff check --fix`) — use this to normalize code you touched |
| `make lint` | **Ruff** check only (no file writes) — quick feedback without changing files |
| `make check` | Full local gate: lint, format check, Python 3.12 compatibility (**vermin**), **basedpyright** types, security, and license checks — run before opening a PR |
| `make test` | **pytest** for packages under `libs/` |

Run `make help` in the repo for other targets (for example scoped tests with `PACKAGE=giskard-checks`).

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
   make format    # auto-format your code
   make check     # full lint + type + security gate
   make test      # run the test suite
   ```
6. **Commit and push** to your fork, then **open a pull request** against `main`

CI will run the same checks. A maintainer will review your PR — most PRs receive a first review within a few days.

### Contributing to the documentation

This docs site (<a href="https://github.com/Giskard-AI/giskard-docs" target="_blank">giskard-docs ↗</a>) is a separate Astro / Starlight project. To contribute:

1. Fork and clone `giskard-docs`
2. Install dependencies: `npm install`
3. Preview locally: `npm run dev`
4. Edit pages under `src/content/docs/` and open a PR

## Star our repositories on GitHub

If you find Giskard useful, please consider starring these projects to improve their discoverability:

- **<a href="https://github.com/Giskard-AI/giskard-oss" target="_blank">Giskard-AI/giskard-oss ↗</a>** — main open-source monorepo (library, checks, contribution entry)
- **<a href="https://github.com/Giskard-AI/giskard-agents" target="_blank">Giskard-AI/giskard-agents ↗</a>** — Giskard Agents
- **<a href="https://github.com/Giskard-AI/giskard-hub-python" target="_blank">Giskard-AI/giskard-hub-python ↗</a>** — Giskard Hub Python client
- **<a href="https://github.com/Giskard-AI/giskard-docs" target="_blank">Giskard-AI/giskard-docs ↗</a>** — this documentation site
- **<a href="https://github.com/Giskard-AI/flare" target="_blank">Giskard-AI/flare ↗</a>** — Flare evaluation runner (e.g. Phare benchmark workflows)
- **<a href="https://github.com/Giskard-AI/realharm" target="_blank">Giskard-AI/realharm ↗</a>** — collection of real failure cases of LLM-based applications
- **<a href="https://github.com/Giskard-AI/phare" target="_blank">Giskard-AI/phare ↗</a>** — Phare benchmark (LLM safety & security evaluation)

With the <a href="https://cli.github.com/" target="_blank">GitHub CLI ↗</a> installed, you can star them all from the terminal:

```bash
for repo in giskard-oss giskard-agents giskard-hub-python giskard-docs flare realharm phare; do
  gh api -X PUT "user/starred/Giskard-AI/$repo" --silent
done
```

## Community

Questions, discussion, or just want to say hi? Join us on **<a href="https://discord.com/invite/ABvfpbu69R" target="_blank">Discord ↗</a>**.
