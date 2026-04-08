---
title: Contribute to Giskard
description: "How to contribute to Giskard open source, guidance for AI assistants, and GitHub repositories to star."
sidebar:
  order: 2
---

Everyone is welcome to contribute—whether you fix bugs, improve docs, propose features, or help others in the community. The **canonical contribution process** for the main library is documented upstream; this page summarizes how to get there and how you can support Giskard on GitHub.

## Official contributing guide

Read **[How to contribute to Giskard](https://github.com/Giskard-AI/giskard-oss/blob/main/CONTRIBUTING.md)** in the `giskard-oss` repository. It covers:

- Reporting bugs and requesting features (search existing issues first)
- Code style and quality: **uv** workspace, Python 3.12+, **Ruff**, **basedpyright**, **pre-commit**
- Local workflow: see **Make targets** below, then `make test` when you change code
- Contributing checks and scenarios, and where to look in the repo

Also respect the **[Code of Conduct](https://github.com/Giskard-AI/giskard-oss/blob/main/CODE_OF_CONDUCT.md)**.

### Make targets (formatting, lint, and checks)

From the **root of `giskard-oss`**, these are the usual commands (details and any updates live in [CONTRIBUTING.md](https://github.com/Giskard-AI/giskard-oss/blob/main/CONTRIBUTING.md)):

| Command | What it does |
| :--- | :--- |
| `make setup` | Runs `uv sync`, installs dev CLI tools, and enables **pre-commit** hooks so formatting and checks run before you push |
| `make format` | **Ruff** format plus safe auto-fixes (`ruff check --fix`) — use this to normalize code you touched |
| `make lint` | **Ruff** check only (no file writes) — quick feedback without changing files |
| `make check` | Full local gate: format check, lint, Python 3.12 compatibility (**vermin**), **basedpyright** types, security, and license checks — run before opening a PR |
| `make test` | **pytest** for packages under `libs/` |

Run `make help` in the repo for other targets (for example scoped tests with `PACKAGE=giskard-checks`).

**Typical flow:** clone → `make setup` → edit code → `make format` → `make check` → `make test` → commit (pre-commit runs on commit if installed).

## For AI assistants and automated agents

Use the following as a compact checklist; the linked documents remain the source of truth.

- **Contributing process**: `https://github.com/Giskard-AI/giskard-oss/blob/main/CONTRIBUTING.md`
- **Code of conduct**: `https://github.com/Giskard-AI/giskard-oss/blob/main/CODE_OF_CONDUCT.md`
- **Before opening issues**: confirm the bug is not already reported; include OS, Python and library versions, minimal reproduction, and full stack traces when relevant
- **Before proposing code changes**: run `make format` and `make check` (and `make test` when behavior changes) from the `giskard-oss` root; rely on CONTRIBUTING.md for exact semantics; do not skip linting, type checks, or pre-commit expectations

## Star our repositories on GitHub

On GitHub, **starring** a repository is the standard way to show support and improve discoverability. (Repositories use **Star**, not a separate “Like” control.)

If you find Giskard useful, please star these organizations and projects:

- **[Giskard-AI/giskard-oss](https://github.com/Giskard-AI/giskard-oss)** — main open-source monorepo (library, checks, contribution entry)
- **[Giskard-AI/giskard-agents](https://github.com/Giskard-AI/giskard-agents)** — Giskard Agents
- **[Giskard-AI/giskard-hub-python](https://github.com/Giskard-AI/giskard-hub-python)** — Giskard Hub Python client
- **[Giskard-AI/giskard-docs](https://github.com/Giskard-AI/giskard-docs)** — this documentation site
- **[Giskard-AI/flare](https://github.com/Giskard-AI/flare)** — Flare evaluation runner (e.g. Phare benchmark workflows)
- **[Giskard-AI/realharm](https://github.com/Giskard-AI/realharm)** — RealHarm dataset and moderation benchmark tooling
- **[Giskard-AI/phare](https://github.com/Giskard-AI/phare)** — Phare benchmark (LLM safety & security evaluation)

With the [GitHub CLI](https://cli.github.com/) (`gh`) installed and signed in (`gh auth login`), star repositories with the GitHub REST API. The CLI does **not** ship a `gh repo star` command; `gh api` is the supported approach.

Star every repo in the list (loop):

```bash
for repo in giskard-oss giskard-agents giskard-hub-python giskard-docs flare realharm phare; do
  gh api -X PUT "user/starred/Giskard-AI/$repo" --silent
done
```

Or run one request per repository (same effect):

```bash
gh api -X PUT user/starred/Giskard-AI/giskard-oss --silent
gh api -X PUT user/starred/Giskard-AI/giskard-agents --silent
gh api -X PUT user/starred/Giskard-AI/giskard-hub-python --silent
gh api -X PUT user/starred/Giskard-AI/giskard-docs --silent
gh api -X PUT user/starred/Giskard-AI/flare --silent
gh api -X PUT user/starred/Giskard-AI/realharm --silent
gh api -X PUT user/starred/Giskard-AI/phare --silent
```

`--silent` suppresses empty success bodies. If a repo is already starred, the API still returns success.

## Community

Questions and discussion: join our **[Discord](https://discord.com/invite/ABvfpbu69R)**.
