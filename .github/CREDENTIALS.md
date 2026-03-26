# Credentials & Security Posture

Last updated: 2026-03-26

## Secrets

| Secret | Scope | Used in | Purpose |
|---|---|---|---|
| `RELEASE_PAT_TOKEN` | **Org-level** | `update-docs.yml` | Push to `docs` branch and trigger downstream workflows |

Zero repo-level secrets — good.

### Recommended improvements

- **Scope the job to an environment.** Add `environment: docs-deploy` to the
  `Build and publish docs` job so the org-level secret is only accessible when
  the job runs in that environment context.
- **Replace the PAT with a GitHub App.** A dedicated GitHub App with
  `Contents: Read & Write` permission (installed on this repo only) would provide
  a short-lived token (1-hour TTL) with narrower scope than a PAT. Store the App
  credentials (`APP_ID` variable + `APP_PRIVATE_KEY` secret) in the `docs-deploy`
  environment.

## GitHub Environments

| Environment | Secrets | Variables | Protection Rules |
|---|---|---|---|
| `github-pages` | *(none)* | *(none)* | Custom branch policy |

### Recommended environments

- **`docs-deploy`** — for the `update-docs.yml` workflow, scoped to `main` branch.
  Add the replacement App credentials (or scope `RELEASE_PAT_TOKEN` access) here.

## Actions & Pinning

All third-party actions are pinned by full 40-character commit SHA:

| Action | SHA | Version |
|---|---|---|
| `actions/checkout` | `08c6903cd8c0fde910a37f88322edcfb5dd907a8` | v5 |
| `astral-sh/setup-uv` | `2ddd2b9cb38ad8efd50337e8ab201519a34c9f24` | v7.1.1 |
| `zizmorcore/zizmor-action` | `71321a20a9ded102f6e9ce5718a2fcec2c4f70d8` | v0.5.2 |

Dependabot for GitHub Actions is configured (`.github/dependabot.yml`) with weekly
update checks. It will open PRs when pinned action SHAs have newer versions.

## OIDC Federation

Not applicable — no container registry pushes in this repository.

## Rulesets

No tag or branch rulesets configured. Consider adding:

- Deletion-blocking ruleset on `docs` branch (if it should never be deleted)

## CI Security Scanning

- **zizmor** runs on every push to `main`/`dev` and on PRs (pedantic persona,
  SARIF upload to GitHub Advanced Security)
- **detect-secrets** runs as a pre-commit hook (baseline: `.secrets.baseline`)
