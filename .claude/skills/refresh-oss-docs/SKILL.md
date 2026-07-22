---
name: refresh-oss-docs
description: Use when the Giskard OSS documentation needs updating against a giskard-oss revision (main or a tag), when giskard-checks has been released or bumped, or when the docs may be stale relative to the library.
---

# Refresh OSS docs

Bring `src/content/docs/oss/` back in line with a revision of
[giskard-oss](https://github.com/Giskard-AI/giskard-oss), and open a review-ready PR.

**Your context stays small.** You hold the API delta and the work order. You do
**not** read doc pages, and you do **not** run the notebook tests — subagents do
both and hand you back short summaries.

## Argument

The giskard-oss ref. Defaults to `main`. May be a tag (`v1.1.0`) or a commit.

## Phase 0 — Preflight

```bash
gh pr list --state open --search "head:docs-refresh-oss-" --json number,headRefName,url
```

- **A refresh PR is already open** → do not open a second one. Check out its
  branch, rebase on `main`, and continue: this run updates that PR.
- Working tree dirty → stop and tell the user.
- `gh` not authenticated → stop.
- `AZURE_AI_API_KEY` or `AZURE_AI_ENDPOINT` unset → note it; the run continues in
  **degraded mode** (notebooks cannot be executed, and the PR opens as a draft).
  These are the variables the notebook harness itself gates on — check these, not
  `OPENAI_API_KEY`.

## Phase 1 — Acquire

Clone into the scratchpad, never into the repo:

```bash
git clone --depth 1 --branch <ref> https://github.com/Giskard-AI/giskard-oss.git "$SCRATCH/giskard-oss"
uv venv "$SCRATCH/.venv-target"
VIRTUAL_ENV="$SCRATCH/.venv-target" uv pip install "$SCRATCH/giskard-oss/libs/giskard-checks"
```

Use a separate venv. Installing the target version into the repo's own `.venv`
would leave the working tree in a state the user did not ask for.

## Phase 2 — Snapshot and diff

```bash
"$SCRATCH/.venv-target/bin/python" scripts/snapshot-api.py giskard.checks \
    --distribution giskard-checks --ref <ref> --follow-referenced \
    -o "$SCRATCH/new-snapshot.json"

python3 scripts/diff-api.py docs/api-baseline/giskard-checks.json \
    "$SCRATCH/new-snapshot.json" -o "$SCRATCH/delta.json"
```

`--follow-referenced` also records the giskard types named in `giskard.checks`
signatures but defined elsewhere — the message types in `giskard.llm`, the
generator bases in `giskard.agents`. They are boundary types the documented API
hands to users, so a rename on one breaks pages just as hard: dropping
`AssistantMessage.is_refusal` produced no delta at all and shipped six failing
notebooks. Field-level changes on pydantic models are tracked the same way, and
for the same reason.

`diff-api.py` exits **0 when there are no changes**. In that case the docs are
already current: say so and **stop**. No branch, no subagents, no PR — an
unnecessary run should cost nothing.

## Phase 3 — Triage

```bash
python3 scripts/triage-docs.py "$SCRATCH/delta.json" -o "$SCRATCH/work-order.json"
```

This produces `work_by_type` (one work order per Diataxis type) and
`undocumented` (new symbols no page mentions).

The work order already resolves each hit to the file that must actually be
edited — a notebook, never its git-ignored `.mdx` shadow. **Do not second-guess
that resolution.** Pass each type's entry through verbatim.

Do treat the delta itself as a **lower bound** on what broke. It is built from
`inspect.signature`, so it sees only what a signature can express. Behaviour that
moved inside a validator, a runtime allowlist or a default factory produces no
delta at all — a signature that still reads `outputs: Target[...]` can reject a
callable it used to accept. Notebook and snippet execution in Phase 5 is the only
thing that catches this class; a clean delta is not proof the docs still run.

Pages typed `other` (e.g. `oss/solutions/`, `oss/agent-skills.mdx`) have no owning
editor. Do not edit them; list them in the PR body for a human.

## Phase 4 — Edit

Dispatch one subagent per **non-empty** type, in parallel:

| Type in work order | Agent                  |
| ------------------ | ---------------------- |
| `reference`        | `doc-refresh-reference`   |
| `tutorial`         | `doc-refresh-tutorial`    |
| `how-to`           | `doc-refresh-how-to`      |
| `explanation`      | `doc-refresh-explanation` |

Give each agent **only its own slice** of `work_by_type`, plus the path to
`$SCRATCH/new-snapshot.json`. Never paste page contents into the prompt — the
agent reads the files itself.

Each returns a small JSON report. Collect them; do not summarise them yet.

## Phase 5 — Verify

Dispatch `doc-refresh-verifier` with the target version. It bumps the pin, runs
the notebooks read-only, rebuilds the site, and executes snippets on hand-written
pages. It returns a verdict, not a log.

If it reports failures, dispatch the owning editor again with the failure list.
**Do not fix the pages yourself** — that is what puts page content in your context.

## Phase 6 — Land

1. Update the baseline — this is the reviewable record of what changed:

   ```bash
   cp "$SCRATCH/new-snapshot.json" docs/api-baseline/giskard-checks.json
   ```

   **Only when the verifier returned `PASS` or `PRE_EXISTING`.** The baseline is
   what the *next* run diffs against, so advancing it declares "these symbols are
   handled". Advance it over pages that never got fixed and the next run sees no
   delta for them — the debt stops being visible to the tooling at all. On
   `REGRESSION` or `BLOCKED`, leave the baseline untouched, open the PR as a
   draft, and say in the body that the baseline was deliberately not advanced.

2. Branch `docs-refresh-oss-<ref>` (or stay on the existing refresh branch).

   The separator is a hyphen, not a slash. A branch named `docs` already exists on
   `origin`, and git cannot create `docs/anything` while it does — the ref
   namespace collides. Keep this prefix in step with the Phase 0 search above.

3. Commit with Conventional Commits:
   `docs(oss): refresh checks docs for <ref>`

4. Open the PR. Draft if notebooks were not verified.

### PR body

```markdown
## Refresh: giskard-checks <from> → <to>

Ref: `<ref>` (<short-sha>)

### API changes
<counts by kind; list every symbol_removed — those are breaking>

### Pages updated
<path — what changed, one line each, from the editors' reports>

### Needs human decision
<flagged pages, with the editor's reason>

### Undocumented new features
<new symbols no page mentions — someone must decide whether they deserve one>

### Verification
<notebooks / build / tables / snippets — or "NOT VERIFIED: no AZURE_AI_API_KEY">
```

## Rules

- **Never edit a `.mdx` that has an `.ipynb` sibling.** It is git-ignored build
  output; `make regen-mdx` will erase the edit. Triage already resolves this — trust it.
- **Never author a tutorial, how-to or explanation for a new feature.** Report it.
  Whether a feature deserves a page is a human's decision.
- **Never claim verification you did not run.** No API key means the PR says so.
- **Never widen the scope.** `giskard-checks` and `src/content/docs/oss/` only.
  Three files outside that tree are still yours to touch, because other phases
  require them: `pyproject.toml` (version pins only), `uv.lock` (whatever
  `uv sync` writes), and `docs/api-baseline/giskard-checks.json`. Nothing else —
  and never `git add -A`. Stage the paths you edited by name, so formatter churn
  in files you never opened stays out of the commit.
