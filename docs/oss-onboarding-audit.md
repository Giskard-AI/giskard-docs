# Giskard OSS docs — onboarding-readiness audit

> **Status:** the findings below were applied in PR #207 (issue #206). The report is
> kept as the record of what was checked, what the evidence was, and what was
> deliberately left alone — not as an open worklist. Items the PR did not resolve are
> called out in its description.

**Date:** 2026-08-24
**Docs repo:** `giskard-docs` @ `seo/ubersuggest-audit-fixes` (`2b4a1a4`)
**Ground truth:** `Giskard-AI/giskard-oss` @ `main`, cloned to scratchpad; `giskard-checks 1.0.2rc1`, `giskard-scan 1.0.0rc1`, `giskard-agents 1.0.2rc1`, root meta-package `giskard 3.0.0rc1`, installed editable into a dedicated venv.
**Audience optimized for:** a developer who has never used Giskard, arriving from GitHub or search, who wants to run their first check within 10 minutes and know what to do next.
**Scope:** `src/content/docs/oss/**`, plus `src/content/docs/index.mdx` and `src/content/docs/start/comparison.mdx` where they route into OSS, plus `astro.config.mjs` sidebar. Hub docs out of scope except where OSS pages link into them.

Every drift claim below cites the `giskard-oss` file/symbol it was read from, and is tagged **VERIFIED** (checked against code, or executed) or **SUSPECTED** (reads badly, not code-checkable). Notebooks (`.ipynb`) are the source; the sibling `.mdx` is generated and not editable — every notebook fix points at the `.ipynb` with a cell index.

---

## Summary — the 5 things that most hurt a new developer today

1. **The quickstart cannot run, and never says why.** `oss/checks/quickstart.ipynb` configures `Generator(model="openai/gpt-5.4-nano")` — a model that exists nowhere in `giskard-oss` (the library default is `DEFAULT_MODEL = "openai/gpt-4o-mini"`, `libs/giskard-checks/src/giskard/checks/settings.py:10`). Worse, the setup cells are stripped from the rendered page, so a reader never sees that an API key is needed at all; the first visible cell dies with `WorkflowError: Step processing failed` and no mention of a key, provider, or model. The single most-landed-on OSS page is a dead end.
2. **Install instructions contradict each other four ways, and two variants are broken.** `--pre` is mandatory (everything shipped is a pre-release), yet `oss/solutions/scan-vulnerabilities.mdx:56,73,90,109` omits it and silently installs Giskard **2.19.2**, whose API has none of the documented symbols; `oss/checks/how-to/*.ipynb` cell 3 uses `!pip install giskard-checks openai`; `oss/solutions/check-agentic-systems.mdx:17` hard-pins `==3.0.0rc1`; the use-cases use the correct `--pre "giskard[openai]"`.
3. **The docs recommend API that does not exist.** `how-to/simulate-users.ipynb` cells 14–17 build an entire section on a `simulator_output` metadata key with zero occurrences in `giskard-oss` — and the notebook's own recorded output shows the branch never fires. `tutorials/dynamic-scenarios.ipynb` cell 16 names a `Persona` class that does not exist (it is `UserSimulator`). `how-to/structured-output.ipynb` documents an `Equals(key=...)` parameter that is not a field.
4. **`Suite` — the library's answer to "run many scenarios" — is documented nowhere in how-to or use-cases, so four pages hand-roll ~400 lines reimplementing it.** `Suite`, `SuiteResult.pass_rate`, `.group_by()`, `.to_junit_xml()`, `.print_report()` all ship (`libs/giskard-checks/src/giskard/checks/scenarios/suite.py`, `core/result.py:664-672`). The CI/CD guide has no CI report; the RAG page has a 134-line `RAGTestSuite` class.
5. **There is no single golden path, and no failure is ever shown.** Four peer sidebar groups (Get Started / Solutions / Scan / Checks) offer four plausible starts; three pages nominate three different first destinations; `oss/index.md` never links to Scan or Solutions at all. Every recorded output in 13 how-to/use-case notebooks is a pass — a reader never sees what a red test looks like, and no page anywhere documents an error message.

**One good-news headline:** the mechanical API delta is empty. `scripts/snapshot-api.py` against the installed libs, diffed with `scripts/diff-api.py` against `docs/api-baseline/`, yields **zero real deltas** for both `giskard.checks` (74 raw deltas, all `X | Y` vs `Union[X, Y]` repr noise from the Python version) and `giskard.scan` (0 deltas). Nothing documented has been removed or re-signed. The problems are in prose, examples, coverage, and navigation — not in stale signatures.

**Also good:** `oss/scan/reference/*` and `oss/scan/explanation/*` were checked symbol-by-symbol and contain **no** wrong signature, default, tag, or constant. `how-to/custom-trace.ipynb` and `oss/scan/*` generally are the strongest writing in the tree.

---

## 0. Mechanical API delta (reference)

Reproduce with:

```bash
uv venv .venv-oss --python 3.12
VIRTUAL_ENV=.venv-oss uv pip install -e giskard-oss/libs/giskard-checks -e giskard-oss/libs/giskard-scan
.venv-oss/bin/python scripts/snapshot-api.py giskard.checks --ref <sha> -o checks-new.json
.venv-oss/bin/python scripts/diff-api.py docs/api-baseline/giskard-checks.json checks-new.json
```

| Package | Baseline | Installed | Raw deltas | Real deltas |
|---|---|---|---|---|
| `giskard.checks` | 1.0.2rc1 | 1.0.2rc1 | 74 | **0** (all `X \| Y` → `Union[X, Y]` repr) |
| `giskard.scan` | 1.0.0rc1 | 1.0.0rc1 | 0 | **0** |

**Recommendation (P2, one PR):** `scripts/diff-api.py` should normalize `typing.Union[A, B]` ↔ `A | B` and `typing.Optional[X]` ↔ `X | None` before comparing. Today a Python-version change produces 74 spurious "error"-severity deltas, which trains reviewers to skip the diff — exactly the failure mode `snapshot-api.py`'s own docstring warns about ("Stable. An unchanged API must produce a byte-identical file").

---

## 1. Wrong / drifted

### 1.1 Install commands

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 1.1.1 | `oss/solutions/scan-vulnerabilities.mdx:56,73,90,109` | **VERIFIED.** Missing `--pre`. PyPI's latest stable `giskard` is 2.19.2; the only 3.x releases are `3.0.0b3` and `3.0.0rc1`, both pre-releases. `pip install "giskard[scan,openai]"` resolves to 2.19.2, which has no `scan` extra — pip warns and installs anyway, then `from giskard.scan import vulnerability_scan` raises. Every code sample on the page then fails. | Add `--pre` to all four fences: `pip install --pre "giskard[scan,openai]"`. | **P0** |
| 1.1.2 | `oss/checks/quickstart.ipynb` cell 3; `oss/checks/tutorials/*.ipynb` cell 3; `oss/checks/how-to/*.ipynb` cell 3 | **VERIFIED.** `!pip install giskard-checks openai` — no `--pre`, so pip finds no candidate for the pre-release-only `1.0.2rc1` (`libs/giskard-checks/pyproject.toml:3`); and it names the internal sub-package rather than the documented meta-package + provider extra (root `pyproject.toml:26-31`). | `!pip install --pre "giskard[openai]"`. For notebooks that need no LLM (`test-suites`, `your-first-test`): `!pip install --pre giskard`. | **P0** |
| 1.1.3 | `oss/solutions/check-agentic-systems.mdx:17` | **VERIFIED.** Hard-pins `giskard[openai]==3.0.0rc1` (`giskard-oss/pyproject.toml:5`). Works today; goes stale on the next release, and is the only exact-RC pin on the site. | `pip install --pre "giskard[openai]"`. | **P1** |
| 1.1.4 | `oss/scan/tutorials/your-first-scan.ipynb` cell 3 | **VERIFIED.** Installs only `giskard[scan,openai]`, but cells 0–1 (which run first in Colab) import `nest_asyncio` and `dotenv`. The other four scan notebooks add them. | `!pip install --pre "giskard[scan,openai]" openai nest_asyncio python-dotenv`. | **P2** |
| 1.1.5 | `oss/checks/installation.md` | **VERIFIED omission.** `giskard[regorus]` (for `RegoPolicy`) and `giskard[all-checks]` (for `Readability`) exist (root `pyproject.toml:37,48`; `libs/giskard-checks/pyproject.toml:22-26`) and are undocumented. `Readability(name="r")` raises `ValidationError: The 'textstat' package is required for the Readability check` — reproduced. There is no `giskard[readability]`. `regorus` is unavailable on Windows and linux-aarch64 (platform marker at `libs/giskard-checks/pyproject.toml:25`). | Add both extras plus the platform caveat. | **P1** |
| 1.1.6 | `oss/scan/installation.md` | **VERIFIED omission.** `giskard[full]` and `giskard[all-llms]` exist (root `pyproject.toml:50-51`) and are the obvious "just give me everything" answer for a 10-minute first run. | Add one line. | **P2** |

**Net:** five install variants across the OSS tree, two of which are broken. Stripe/Prisma ship exactly one install string per surface. This is the single highest-leverage consistency fix in the audit.

### 1.2 Model IDs and provider setup

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 1.2.1 | `oss/checks/quickstart.ipynb` cell 1; `tutorials/single-turn.ipynb` cells 6 and 8; `how-to/simulate-users.ipynb` cell 6:8; `how-to/batch-evaluation.ipynb` cell 11:5; `use-cases/rag-evaluation.ipynb` cell 11:11; `use-cases/content-moderation.ipynb` cells 13:4, 21:4, 25 | **VERIFIED drift, SUSPECTED-invalid id.** `openai/gpt-5.4-nano` / `gpt-5.4-nano`, 15 occurrences. The string appears nowhere in `giskard-oss`. The repo's own ids are `gpt-4o` (42), `gpt-4o-mini` (17), `gpt-4.1-nano` (11), `gpt-4.1-mini` (6), `gpt-5-mini` (2, e.g. `libs/giskard-checks/src/giskard/checks/judges/conformity.py:38`); the library default is `DEFAULT_MODEL = "openai/gpt-4o-mini"` (`settings.py:10`). Nothing validates the string, so the reader gets an opaque provider 404 wrapped in `WorkflowError`. Within the docs the split is 15× `gpt-5.4-nano` / 12× `gpt-5-mini` / 3× `gpt-4o-mini` — three answers to one question. | Pick **one** id and use it everywhere. Recommend `openai/gpt-4o-mini` — it matches the library default, so the docs and a bare `set_default_generator()`-free setup agree. (Note: the two auditors independently recommended `gpt-4o-mini` and `gpt-5-mini`; either is defensible, but the value of this fix is uniformity, so choose once and enforce with a grep in CI.) | **P0** |
| 1.2.2 | `oss/checks/tutorials/single-turn.ipynb` cell 8 | **VERIFIED.** `base_url=os.environ["OPENAI_BASE_URL"]` raises `KeyError` for every reader who has only `OPENAI_API_KEY`. Nothing in `libs/giskard-llm/src/giskard/llm/providers/openai.py` requires it — this is an internal proxy setup leaked into a public doc. Compounded: `import os` lives in the stripped cell 1, so the rendered snippet also raises `NameError: name 'os' is not defined`. | Replace cell 8 (draft below, §Drafts D1). | **P0** |
| 1.2.3 | `oss/scan/installation.md:44` | **VERIFIED and runtime-breaking.** "install the `litellm` extra and pass any LiteLLM-supported model string, such as `mistral/mistral-large-latest`… `ollama/llama3`" sits directly under a `GiskardLLMGenerator(...)` snippet. `libs/giskard-llm/src/giskard/llm/routing.py:25` `_PROVIDER_REGISTRY` contains only `openai, google, gemini, anthropic, azure, azure_ai`; `_create_provider` raises `ValueError: Provider 'mistral' is not configured and not in the registry.` LiteLLM needs a **different class**, `LiteLLMGenerator` (`libs/giskard-agents/src/giskard/agents/generators/litellm_generator.py`). Provider construction is lazy, so this fails mid-scan, not at setup — the worst possible timing. Also `"azure/gpt-4o"` is listed as a LiteLLM example but is a native route. `oss/checks/installation.md:31-40` already gets this right. | Replace (draft D2). | **P0** |
| 1.2.4 | `oss/checks/installation.md:59-63`; `oss/scan/installation.md:46` | **VERIFIED incomplete.** Only `OPENAI_API_KEY` (checks) / three keys (scan) documented, while both pages sell a five-provider table. Real vars: `GEMINI_API_KEY` **or** `GOOGLE_API_KEY` (`libs/giskard-llm/src/giskard/llm/providers/google.py:203-204`); `AZURE_API_KEY` + `AZURE_API_BASE` + `AZURE_API_VERSION` (`azure_openai.py:6,75-77`); `AZURE_AI_API_KEY` + `AZURE_AI_ENDPOINT` + `AZURE_AI_API_VERSION` (`azure_ai.py:6,109-113`); `ANTHROPIC_API_KEY` via the SDK. | Add an env-var column to the provider table, or a tabbed per-provider block (see §5.1). | **P1** |
| 1.2.5 | `oss/solutions/check-agentic-systems.mdx:23-26` vs `oss/solutions/scan-vulnerabilities.mdx:60-63` vs `oss/checks/installation.md:80,91` | **VERIFIED.** Two names for one object: `libs/giskard-agents/src/giskard/agents/generators/__init__.py:13` sets `Generator = GiskardLLMGenerator` (confirmed `Generator is GiskardLLMGenerator → True`). Adjacent quickstarts use different names. | Standardize on `Generator`; `installation.md:91` already explains the alias. | **P1** |
| 1.2.6 | All checks reference/how-to pages | **VERIFIED undocumented.** `GISKARD_CHECKS_DEFAULT_MODEL` — the one-line alternative to `set_default_generator`. `GiskardChecksSettings` reads `GISKARD_CHECKS_*` from env **or a `.env` file** (`settings.py:15-36`), and `get_default_generator()` builds `Generator(model=get_settings().default_model)` (`settings.py:73-88`). Also undocumented: `GISKARD_CHECKS_DEFAULT_EMBEDDING_MODEL`, `GISKARD_CHECKS_MAX_REPORTED_FAILURES`, `GISKARD_CHECKS_DISABLE_RICH_PRETTY`. Also undocumented: deferred `os.environ/VAR_NAME` values in router config (`routing.py:36-39,98`). | Add to `checks/installation.md`, `reference/settings.mdx`, and the CI/CD guide. | **P1** |

### 1.3 API that does not exist / does not behave as documented

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 1.3.1 | `oss/checks/how-to/simulate-users.ipynb` cells 14–17 | **VERIFIED fabricated.** The whole §5 "Check `goal_reached` from simulator metadata" rests on a `simulator_output` metadata key. `grep -rn "simulator_output"` over all of `giskard-oss` → **zero hits**. `LLMGeneratorOutput` (`libs/giskard-checks/src/giskard/checks/generators/base.py:21`) is consumed inside `BaseLLMGenerator.__call__` (`base.py:118-122`), which reads `output.goal_reached` and then yields only `output.message`; it never reaches `Interaction.metadata` (fields: `inputs, outputs, metadata`, `core/interaction/interaction.py:37`). The notebook proves it: cell 15 produced no output and cell 17 printed the fallback string. | Delete cells 14–17. Replace with the observable signal (draft D3). If a `goal_reached` surface is genuinely wanted, file it as a library gap. | **P0** |
| 1.3.2 | `oss/checks/tutorials/dynamic-scenarios.ipynb` cell 16 | **VERIFIED.** Prose says "`Persona` is the built-in generator". No `Persona` symbol exists (`hasattr(giskard.checks, "Persona") == False`); it is `UserSimulator` (`libs/giskard-checks/src/giskard/checks/generators/user.py`), which the next code cell uses. | "…`UserSimulator` is the built-in generator that produces LLM-powered user messages from a `persona` description." | **P1** |
| 1.3.3 | `oss/checks/quickstart.ipynb` cell 7 (prose) | **VERIFIED.** Documents a parameter `answer_key`. `Groundedness.model_fields` = `answer, context, context_key, description, generator, name, target_key` (`judges/groundedness.py`); the code cell above correctly uses `target_key`. | Rename the bullet to `target_key`; add a sibling bullet for `answer` (static override). | **P1** |
| 1.3.4 | `oss/checks/how-to/structured-output.ipynb` cells 8:7, 10:1 | **VERIFIED.** Prose says "Use `Equals` with a `key` path" / "The `key` uses dot notation". `Equals` has no `key` field (`description, expected_value, expected_value_key, match, name, normalization_form, target_key`). The code cells correctly use `target_key` — only the headings are wrong, the worst case for a scanning reader. | Both lines → `target_key`. | **P1** |
| 1.3.5 | `oss/checks/how-to/custom-checks.ipynb` cell 23:2 | **VERIFIED.** "pass them to `.check()` with the variadic form". `Scenario.check(self, check: Check) -> Self` takes exactly one positional (`core/scenario.py`). The variadic method is `Scenario.checks(*checks)`, never mentioned; cell 24:26-27 works around the gap with a `for` loop. | Prose → `.checks(*...)`; rewrite cell 24 (draft D4). | **P1** |
| 1.3.6 | `oss/checks/how-to/custom-checks.ipynb` cell 20:1 | **VERIFIED.** Documents `{"reason": str \| None, "passed": bool}`. `judges/base.py:16-28`: `reason: str = Field(..., min_length=1)` with a `_strip_reason` validator, so whitespace-only also fails. `judges/judge.py:39-41` says "required non-blank". | `{"reason": str, "passed": bool}` + "a blank reason makes the check ERROR, not FAIL". | **P1** |
| 1.3.7 | `oss/checks/how-to/structured-output.ipynb` cell 13:4-9 vs cell 14 | **VERIFIED.** Cell 13 promises "use the `resolve` helper from `giskard.checks.core.extraction`" and explains `NoMatch`; cell 14 uses plain attribute access and never imports or calls it. Separately, `resolve` is a **top-level export** (`giskard/checks/__init__.py`), so the deep import taught here and in `custom-checks.ipynb` cell 15:2 is the private route. | Either drop the promise or deliver it (draft D5), and switch to `from giskard.checks import resolve`. Note that `resolve` operates on `trace.model_dump()` (`core/extraction.py:88-89`) — it sees dicts, not your Pydantic instances. | **P1** |
| 1.3.8 | `oss/checks/how-to/stateful-checks.ipynb` cell 9:22; `how-to/simulate-users.ipynb` cell 19:28 | **VERIFIED crash.** `asyncio.run(asyncio.gather(...))` → on Python 3.12.13, `ValueError: a coroutine was expected, got <_GatheringFuture pending>`. It "works" in these notebooks only because cell 0 applies `nest_asyncio`; both cells have recorded outputs, so a reader has every reason to trust them. | Wrap in an `async def main()` (draft D6). | **P0** |
| 1.3.9 | `oss/checks/tutorials/dynamic-scenarios.ipynb` cell 17 | **VERIFIED.** `from giskard.checks.generators.user import UserSimulator` — private path for a top-level export. | `from giskard.checks import UserSimulator`. | **P2** |
| 1.3.10 | `oss/checks/tutorials/test-suites.ipynb` cell 10 | **VERIFIED.** Table mislabels properties as fields and is incomplete. `SuiteResult` model fields are `suite, results, duration_ms, recommendation`; `pass_rate` is a *property*, as are `passed_count/failed_count/errored_count/skipped_count/failures_and_errors` (`core/result.py`). | Relabel "attributes and properties"; add `passed_count`, `failed_count`, `failures_and_errors` — the last is what a CI user actually needs. | **P2** |
| 1.3.11 | `oss/checks/how-to/ci-cd.ipynb` cell 11:34 | **VERIFIED reinvention.** Hand-rolled `[r for step in result.steps for r in step.results if not r.passed]` dumps raw `CheckResult` reprs into a CI log. `ScenarioResult.failures_and_errors` (`core/result.py:361-363`) and `TestCaseResult.format_failures()` (`core/result.py:512`) exist and render check name + status + reason. | `assert result.passed, [msg for step in result.failures_and_errors for msg in step.format_failures()]`. | **P2** |
| 1.3.12 | `oss/scan/tutorials/custom-scenario-generator.ipynb` cell 8 | **VERIFIED.** Tells the reader to "override `allow_commercial_use` to `False`". It is a read-only `@property` on `ScenarioGenerator` (`libs/giskard-scan/src/giskard/scan/generators/base.py:53`), not a field — `allow_commercial_use: bool = False` is rejected by Pydantic. `HuggingFaceDatasetScenarioGenerator:117` shows the field-backed alternative. | Show the property-override snippet (draft D7). | **P2** |

### 1.4 Wrong claims about behaviour

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 1.4.1 | `oss/checks/explanation/core-concepts.md:110` | **VERIFIED wrong.** "Checks run after each interaction in a scenario." Checks run once **per step**, after all of the step's interacts are applied (`core/scenario.py:13-38` `Step`; `scenarios/runner.py:179-236` — the inner `for interaction in step.interacts` loop completes, *then* one `TestCase` is built and run). A `UserSimulator` spec yields up to `max_steps` interactions inside one step; checks see only the final trace. | Rewrite (draft D8). | **P0** |
| 1.4.2 | `oss/checks/explanation/core-concepts.md:21-22` | **VERIFIED wrong.** "Each InteractionSpec is resolved into a concrete Interaction." A spec is an async **generator** that can yield many (`core/interaction/trace.py:156-174` drives `generate()` with `anext`/`asend` until `StopAsyncIteration`; `generators/base.py:52` `max_steps: int = 3`). | "…appends **one or more** Interactions to the Trace (a `UserSimulator` or `LLMGenerator` yields up to `max_steps` turns from a single spec)." | **P0** |
| 1.4.3 | `oss/checks/explanation/core-concepts.md:17-24` | **VERIFIED incomplete → misleading.** The runtime flow omits early-stop: `scenarios/runner.py:239-241` breaks on the first non-passing step, and `:243-259` materializes every remaining step as `CheckResult.skip("Step N was skipped due to previous failure")`. A reader whose step 1 fails sees SKIPs on steps 2–5 with no explanation. | Add the early-stop step to the flow (draft D8). | **P0** |
| 1.4.4 | `oss/checks/index.mdx:23` | **VERIFIED wrong.** "Checks that need no LLM call: … semantic similarity … so deterministic rules stay fast and free." `builtin/semantic_similarity.py:170,232` call `self._embedding_model.embed(texts)`, defaulting to `text-embedding-3-small` (`settings.py:11,91-100`) — a remote API call that needs a key and costs tokens. | "…string and regex matching, comparisons, JSON validity, and Rego policies, so deterministic rules stay fast and free. `SemanticSimilarity` needs no judge but does call an embeddings API." | **P1** |
| 1.4.5 | `oss/index.md:13` | **VERIFIED wrong.** "RAGET is not available in v3 yet." `CHANGELOG.md:19-22` and `README.md:166` both say `quality_scan` with a `KnowledgeBase` replaces RAGET; `quality_scan`, `KnowledgeBase`, `Document` all import from `giskard.scan`. This is the flagship v2→v3 question and the OSS landing page answers it wrongly, sending RAG users to legacy docs. | Rewrite the note (draft D9). | **P0** |
| 1.4.6 | `oss/checks/explanation/jsonpath-in-checks.md:44-48` | **VERIFIED incomplete.** Correct about `NoMatch` for single paths (executed: `StringMatching(keyword='a', target_key='trace.last.outputs.zz').run(trace)` → `CheckStatus.ERROR`), but never says what a multi-match path returns. Executed: `resolve(trace, "trace.interactions[*].outputs.x")` → `[1, 2]`, a plain list — `core/extraction.py:88-95` returns a list whenever there are multiple matches or `_is_list_expression()`. Comparison checks then need `match="any"/"all"/"none"` or they compare against the list object. | Add a "Multi-match paths" section (draft D10). | **P1** |
| 1.4.7 | `oss/checks/reference/checks.mdx:170` | **VERIFIED wrong type name.** `expected_value_key` documented as `JSONPathStr \| NotProvided`. There is no `NotProvided`; the sentinel is `pydantic.experimental.missing_sentinel.MISSING`. | `type="JSONPathStr \| MISSING" defaultValue="MISSING"`. | **P1** |
| 1.4.8 | `oss/checks/reference/checks.mdx:72-78,112-116,151-153,207-215,248-256,306-308,454-456`; `reference/core.mdx` | **VERIFIED wrong defaults, load-bearing.** Every "optional static value" field is `X \| MISSING` defaulting to `MISSING`, not `X \| None` / `None`: `StringMatching.keyword/.text`, `RegexMatching.pattern/.text`, `Equals.expected_value`, `Groundedness.answer/.context`, `Toxicity.output`, `AnswerRelevance.question/.answer`, `SemanticSimilarity.reference_text`. Passing `None` explicitly is a *value* and **does not** fall back to the `*_key` path. `Contradiction` (line 207) already uses `MISSING` — the page contradicts itself. | Normalize all to `MISSING`, and add one sentence per family: "`MISSING` means *not supplied*; the check falls back to the matching `*_key` JSONPath. Passing `None` supplies `None` as the value." | **P1** |
| 1.4.9 | `oss/checks/reference/checks.mdx:358,403` | **VERIFIED incomplete.** `AllOf` "short-circuits on the first failure or error" omits skip semantics (`builtin/composition.py:61-81`): skipped inner checks do not stop evaluation, and all-skipped returns `CheckResult.skip("All checks were skipped.")`, not a pass. `AnyOf` (`:136-153`) short-circuits on the first pass **or error** (`:138`) and also returns SKIP when all skipped. | Restate both descriptions. | **P1** |
| 1.4.10 | `oss/checks/reference/core.mdx:401-408` | **VERIFIED wrong return shape.** `resolve()` documented `Any \| NoMatch`; the list case is hidden. Also `resolve` itself does **not** enforce the `trace.` prefix (that is the `JSONPathStr` validator, `extraction.py:30-44`) — `resolve(trace, "last.outputs")` just returns `NoMatch`. | `returnType="Any \| list[Any] \| NoMatch"` plus a Returns note. | **P1** |
| 1.4.11 | `oss/checks/reference/core.mdx:91-93` | **VERIFIED.** "Use the **static** factory methods". They are `@classmethod` and **keyword-only** (`core/result.py:166-224`), so `CheckResult.success("ok")` raises `TypeError`. Also `skip()`/`error()` accept only `message` and `details` — not `metrics` — unlike `success`/`failure`. | Restate. | **P2** |
| 1.4.12 | `oss/checks/reference/scenarios.mdx:59,313`; `reference/core.mdx` | **VERIFIED wrong default.** `.run(target=...)` documented `Callable \| None` / `None`. Real: `target: Target[...] \| MISSING = MISSING` (`core/scenario.py:328-333`, `scenarios/runner.py:284`). | `type="Target \| MISSING" defaultValue="MISSING"`. | **P2** |
| 1.4.13 | `oss/checks/reference/core.mdx:31-35` | **VERIFIED imprecise.** `Check.run` "may be async". It is `async def` on the base (`core/check.py:34`) and raises `NotImplementedError`; subclasses must be `async def`. | Restate. | **P2** |
| 1.4.14 | `oss/checks/tutorials/dynamic-scenarios.ipynb` cell 18 | **Partly verified.** "Each call to the scenario replaces the fixed input string…" undersells `UserSimulator`, which also has `context`, `max_steps`, `max_retries`, `generator` and drives multiple turns. The cell also never runs (needs a key, unmentioned). | Expand; add the key warning. | **P2** |
| 1.4.15 | `oss/scan/tutorials/your-first-scan.ipynb` cell 11 | **VERIFIED.** "Two of the generators announce that they are skipping: `GOAT` and `Crescendo`" — the committed output for cell 10 contains no such lines (the skips go to the logger; `redteam-to-regression.ipynb` cell 10 *does* capture them). Rendered page `your-first-scan.mdx:118-132` confirms. | "Both multi-turn generators (`GOAT` and `Crescendo`) skip themselves and log a warning, because we asked for `target_mode="singleturn"`" — no claim about visible output. | **P1** |
| 1.4.16 | `oss/index.md:13` | **VERIFIED.** The "v3 roadmap" link points at `Giskard-AI/giskard-oss#2252`, which is **closed**. | Drop it, or point at the v3 discussion `https://github.com/orgs/Giskard-AI/discussions/2250`, still referenced by `README.md:28`. | **P1** |
| 1.4.17 | `oss/contributing.md:15` | **VERIFIED nuance.** "Python 3.12+" is right for consumers (`pyproject.toml:24`), but `.python-version` pins **3.13**, so `make setup` (`Makefile:33,50`) provisions 3.13. | "**Python 3.12+** (the repo's `.python-version` pins 3.13 for the dev environment)". | **P2** |
| 1.4.18 | `start/comparison.mdx:24` | **VERIFIED factual error.** "Tool/function calling tests ❌ Not available" for OSS. `WithSpy` is exported from `giskard.checks` and documented at `oss/checks/index.mdx:27` and `how-to/spy-on-calls`. **SUSPECTED** as to intent (the row may mean *Hub-managed* tool tests), but as written it steers an OSS-suitable reader to sales. | Clarify or remove the row. | **P2** |
| 1.4.19 | `oss/checks/how-to/index.mdx:69` | **VERIFIED unfulfilled promise.** The Custom Checks card advertises "metrics". `grep -rl Metric` across how-to and use-cases → no hits, though `Metric(name, value)` (`core/result.py:108-124`) is accepted by `CheckResult.success(metrics=[...])`. | Either deliver (§2) or drop the word. | **P2** |

**Verified-correct, no action (recorded so it is not re-flagged):** every symbol, module path and import on all eight checks reference pages resolves against the installed library — no phantom API. All of `oss/scan/reference/*` and `oss/scan/explanation/*` was checked symbol-by-symbol: `vulnerability_scan`/`quality_scan`/`generate_suite`/`third_party_scan`/`list_scan_items` signatures and defaults; `ScanOptions`/`SharedScanOptions`; `SuiteGeneratorRegistry`; the full generator catalog with every `max_turns`/`context_documents` bound; `DEFAULT_GOAT_MAX_TURNS`/`DEFAULT_CRESCENDO_MAX_TURNS` = 10, `DEFAULT_KNOWLEDGE_BASE_SCENARIOS` = 5, `DEFAULT_KNOWLEDGE_BASE_MAX_TURNS` = 3, `_DEFAULT_MAX_SCENARIOS` = 20, `MAX_RULES_PER_CATEGORY` = 10, `DEFAULT_RULES_PER_CATEGORY` = 5; the complete threat-type / `quality:` / `component:` tag taxonomy; garak's six `DEFAULT_PROBES`, `_HIT_THRESHOLD = 0.5`, `generations = 1`, `_MAX_PROBE_WORKERS = 8`; deepteam's five `DEFAULT_VULNERABILITIES` and five `DEFAULT_ATTACKS`; `KnowledgeBase`/`Document`; `Suite.run(parallel=False)` default vs the scans' `True`. `oss/contributing.md`'s commands all exist: `make setup` (`Makefile:50`), `format` (`:142`), `lint` (`:139`), `check` (`:211`), `test` (`:68`), `PACKAGE=` (`:20-25`). `agent-skills.mdx` is accurate against `Giskard-AI/giskard-skills`.

---

## 2. Missing

### 2.1 Structural gaps a newcomer hits (highest impact)

| # | Gap | Evidence | Fix | P |
|---|---|---|---|---|
| 2.1.1 | **The quickstart never tells the reader they need an API key.** Setup cells 0 (`nest_asyncio`), 1 (`load_dotenv` + `set_default_generator`) and 3 (`pip install`) are stripped from `quickstart.mdx`, so the rendered page goes straight from prose to `Groundedness`. With no key, cell 9 raises `giskard.agents.errors.workflow_errors.WorkflowError: Step processing failed` (reproduced; bottoms out at `libs/giskard-agents/src/giskard/agents/workflow.py:482`) — no mention of a key, provider, or model. | VERIFIED by rendering + execution | Add a visible markdown cell before cell 6 and a visible config cell (draft D11). | **P0** |
| 2.1.2 | **No "no API key required" path is marked anywhere.** LangSmith and Stripe both let you reach a working call before authenticating. Here the how-to section's designated first page cannot run at all, and 4 of 9 how-tos plus all 4 use-cases need a paid key that is never listed as a prerequisite. VERIFIED that the split is clean: `Equals`, `StringMatching`, `RegexMatching`, `FnCheck`, `JsonValid`, `Readability`, `AllOf`/`AnyOf`/`Not`, `RegoPolicy` and custom `Check` subclasses are key-free; only the six judges + `UserSimulator` + `SemanticSimilarity` need a provider. | | Add a "Requires an LLM API key" badge to the frontmatter/first line of every page that needs one; order the how-to section key-free-first. | **P0** |
| 2.1.3 | **No troubleshooting page or error-message reference anywhere in `oss/**`.** The only troubleshooting on any page is `scan-vulnerabilities.mdx:385-387` ("join our Discord"). Every predictable first-run failure is knowable and greppable: `WorkflowError: Step processing failed` (no key); `ValueError: Invalid JSONPath expression …: path must start with 'trace.'` (`core/extraction.py:30-32`); silent `NoMatch` (`extraction.py:46-62`) making a check pass/fail for the wrong reason — **the most dangerous behaviour in the library, documented in zero pages**; `pydantic ValidationError … extra_forbidden` because `Check` sets `extra="forbid"` (`core/check.py:29`) while `Scenario` deliberately does not (`core/scenario.py:101-111`); `TypeError: Parameter 'x' is required but not in the injection requirements` (`utils/injectable.py:32`); `RuntimeError: asyncio.run() cannot be called from a running event loop`; `InputGenerationException` (`generators/base.py:112`); `TypeError: from_fn callable must return bool or CheckResult` (`builtin/fn.py:73-76`); `ValidationError: The 'textstat' package is required…`; "Package conflict detected" for a co-installed v2 (`Makefile:120-137` shows the repo tests this path). | VERIFIED, each cited | One `oss/troubleshooting.md` (or a section per section-hub) mapping symptom → cause → fix. **A five-row symptom table would carry more first-run success than any other single addition in this audit.** | **P0** |
| 2.1.4 | **Callable parameter names are load-bearing and this is documented nowhere.** `Interact._validate_outputs` builds `ValueProvider(self.outputs, {"inputs", "trace"})` and `_validate_inputs` uses `{"trace", "input_type"}` (`core/interaction/interact.py:148-165`); any other required parameter name raises `TypeError: Parameter 'x' is required but not in the injection requirements` (`utils/injectable.py:32`) — reproduced with `lambda i: greet(i)`. Every tutorial writes `lambda inputs:` / `lambda trace:` without saying the names matter. | VERIFIED | Admonition in `tutorials/your-first-test.ipynb` cell 7 and `dynamic-scenarios.ipynb` cell 7 (draft D12). | **P1** |
| 2.1.5 | **No cost or latency figure anywhere on either golden path.** For scan: `explanation/how-scan-works.mdx:165` establishes the default is seven generators each at their own budget — `_DEFAULT_MAX_SCENARIOS = 20` (`generators/base.py:15`), 8 categories × `DEFAULT_RULES_PER_CATEGORY = 5` for adversarial, plus GOAT/Crescendo at 10 turns each — well over 100 scenarios, each one agent call plus one judge call. A reader copying `vulnerability_scan(target, description, languages)` from `how-to/wrap-your-agent.mdx:198` gets a long, expensive run with no warning. For checks: each judged check is one LLM call per scenario run, and `UserSimulator` costs one call per turn up to `max_steps` (`generators/base.py:118-124`; `simulate-users.ipynb` cell 13's own output shows 8 turns = 8 calls for one scenario). Only two notebooks state cost, and only for `max_scenarios=4`. | VERIFIED | One line on `scan/installation.md` and `scan/index.mdx`; one line on `checks/installation.md`; a number on `reference/scan-api.mdx:53`'s `max_scenarios`. Drafts D13. | **P0** (scan) / **P1** (checks) |
| 2.1.6 | **Telemetry is on by default and disclosed on no page in scope.** `libs/giskard-checks/README.md` carries an explicit Telemetry notice; opt-outs are `DO_NOT_TRACK`, `GISKARD_TELEMETRY_DISABLED`, `GISKARD_TELEMETRY_DISABLE_GEOIP`, `disable_telemetry()` (`libs/giskard-core/src/giskard/core/telemetry/telemetry.py:18-21`; `README.md:46-48`; `CHANGELOG.md:51-53`). `Suite.run` calls `telemetry_capture` (`scenarios/suite.py:6`). Importing `giskard.checks` also prints an enterprise welcome banner (`libs/giskard-core/src/giskard/core/welcome.py:19`, opt-out `GISKARD_QUIET`) — the literal first thing a newcomer sees, unexplained. | VERIFIED | A "Telemetry and output" section in `checks/installation.md`, and `GISKARD_TELEMETRY_DISABLED: "1"` in the CI/CD env block. Omitting this from a CI guide is what gets a library banned internally. | **P1** |
| 2.1.7 | **No versioning / stability policy.** Everything shipped is pre-release (`giskard 3.0.0rc1`, `giskard-checks 1.0.2rc1`, `giskard-scan 1.0.0rc1`; `pyproject.toml:11` = "Development Status :: 4 - Beta"; `README.md:56-57` tags both libs "✅ Beta"). No page says the API may break, why `--pre` is required, which of the five libs are public vs internal (`README.md:59`: core/llm/agents are "rarely used directly"), or which library version the docs target. | VERIFIED | A short stability note on `oss/index.md` + a version stamp in `reference/index.mdx`. | **P1** |
| 2.1.8 | **No migration page.** `CHANGELOG.md:11-26,67-86` contains a five-step v2→v3 migration guide and the full breaking-change list. Nothing in `oss/**` references CHANGELOG.md; the only v2 mention is the wrong one at `oss/index.md:13`. | VERIFIED | New `oss/migrating-from-v2.md`, linked from `oss/index.md`. | **P1** |
| 2.1.9 | **No security / vulnerability-reporting path, and no issue-reporting policy.** `SECURITY.md` (private advisories + `security@giskard.ai`) and `ISSUES.md` (bugs/features/build/docs only; template required; individual support → Discord) plus `CONTRIBUTING.md:20-29` (OS + Python versions, <30s repro, full stack trace) are all unreferenced. `contributing.md` says only "Reporting bugs … (search existing issues first)". | VERIFIED | Add a "Reporting a bug" section reproducing the four required fields, and link SECURITY.md from the Community section. | **P1** |
| 2.1.10 | **No "what Giskard is not".** `README.md:168` and `CHANGELOG.md:16-18,81-83` state plainly that tabular/ML auto-scan, `giskard.Model`/`Dataset`, `giskard.testing`, and Hub integration are deliberately out of v3 scope. `oss/index.md` says none of it. Related: no page states what a scan does **not** need (no server, no account, no dataset, no instrumentation — just an async function and a key), which is exactly what a 10-minute evaluator wants to know. | VERIFIED | A short scope section on `oss/index.md`; one line on `scan/index.mdx`. | **P2** |
| 2.1.11 | **Python floor not stated in the how-to install step.** `requires-python = ">=3.12"` (`libs/giskard-checks/pyproject.toml:7`); the library uses PEP 695 generics and `pydantic.experimental.missing_sentinel`, so this will not soften. `ci-cd.ipynb` cell 6:24 pins `python-version: "3.12"` without saying it is a floor. `checks/installation.md:11` states it correctly but buries it mid-sentence. | VERIFIED | Promote to a prerequisites bullet list (Python version + a provider key). | **P2** |

### 2.2 Public API that exists in code and is documented nowhere

Enumerated from `giskard.checks.__all__` (60 exports) against all eight reference pages plus every how-to and use-case. All **VERIFIED**.

| Symbol | Source | Why a newcomer needs it | P |
|---|---|---|---|
| **`Suite`** (and `SuiteResult.pass_rate`, `.passed_count`, `.failed_count`, `.errored_count`, `.skipped_count`, `.failures_and_errors`, `.print_report()`, `.group_by()`, `.to_junit_xml()`, `.to_hub_format()`) | `scenarios/suite.py`; `core/result.py:664-672`; `_SuiteProgress` at `suite.py:52-90` | Absent from **all** how-to and use-case pages, so four of them hand-roll it: `batch-evaluation.ipynb` (cells 6, 11, 13 use `asyncio.gather` + manual counting), `rag-evaluation.ipynb` cell 23 (134-line `RAGTestSuite`), `chatbot-testing.ipynb` cell 21, `testing-agents.ipynb` cell 21. All reimplement, badly and without concurrency limits, what ships. `libs/giskard-checks/README.md` has a "Running Multiple Scenarios with Suite" section the docs ignore. **This is the single highest-impact addition in the audit.** | **P0** |
| `SuiteResult.to_junit_xml(path=None)` | `core/result.py:668-671`; `export/junit.py` | The CI/CD guide has no CI report — it stops at `pytest -v --tb=short`. GitHub Actions, GitLab, Jenkins and Buildkite all render JUnit XML natively. Also referenced but never shown on the checks golden path (`oss/checks/index.mdx:29` claims it). | **P0** |
| `from_fn` | `builtin/fn.py:78-107` | The ergonomic decorator form of `FnCheck`; keyword-only `name`/`description`/`success_message`/`failure_message`/`details`. | **P1** |
| `InteractionGenerationError` (with `.partial_trace`), `InputGenerationException`, `TestCaseError` | `core/exceptions.py:7,11-24`; `core/result.py:390-418` | The objects a reader inspects when a run blows up mid-scenario. `InteractionGenerationError` is raised out of `Scenario.run()` unless `return_exception=True`; `.partial_trace` is the only way to see how far it got. `TestCaseError` carries `message`, `exception_type`, `traceback`, `phase`. | **P1** |
| `Scenario.checks(*checks)`, `.add_interactions()`, `.append()`, `.with_annotations()`, `.with_target()`, `.with_tags()` | `core/scenario.py:226,241,249,273,293,312` | Six of eleven public builder methods missing from `reference/scenarios.mdx:22-62`. `with_target()` is the documented way to bind a SUT, and `outputs` is optional *only* when a target is set — so a reader following that page alone cannot bind a target at all. | **P0** |
| `Scenario.multiple_runs` | `core/scenario.py:134-143` | Flakiness is *the* defining problem of LLM testing and this is the library's built-in answer — yet it appears in zero pages. Its docstring goes out of its way to warn: "Each run must pass for the next to run; execution stops on the first non-passing run… This is **not** a 'retry until one success' mode." That warning is a strong signal readers will get it wrong unaided. | **P1** |
| `Scenario.tags` + `.with_tags()` + `SuiteResult.group_by()` → `GroupedSuiteResult` / `GroupStats` | `core/scenario.py`; `core/result.py:829-864` | The "you ran 200 scenarios, now slice the results" story LangSmith leads with. `tags` is documented in-source as "Flat 'Key:Value' labels for grouping and Hub upload alignment". Entirely absent. | **P1** |
| `Toxicity` | `judges/toxicity.py` | Purpose-built moderation check, absent from `use-cases/content-moderation.ipynb`, which instead writes freeform `LLMJudge` prompts and a hand-rolled `Check` subclass (cell 17). The one page where a built-in exactly matches the topic ignores it. | **P1** |
| `AllOf` / `AnyOf` / `Not` | `builtin/composition.py` | Never mentioned in how-to/use-cases. Worse, `content-moderation.ipynb` cell 22:1 actively steers readers away: "you can use `LLMJudge` with a combined ruleset prompt". `AllOf([Conformity(...)])` costs the same and gives per-rule attribution. | **P1** |
| `AnswerRelevance` | `judges/answer_relevance.py` | `use-cases/rag-evaluation.ipynb` cell 2:3 and `use-cases/index.mdx:30` both promise "answer relevance checks"; the notebook never uses it. | **P1** |
| `DatasetInputGenerator` | `generators/dataset.py` | "Run the same scenario across many inputs from a dataset" is literally its job; `batch-evaluation.ipynb` hand-writes list comprehensions instead. | **P2** |
| `RegoPolicy` | `builtin/rego_policy.py` | Deterministic, zero-cost, auditable policy-as-code — the obvious complement to LLM-judged `Conformity` on a compliance page. Needs the `regorus` extra; unavailable on win32 and linux/aarch64. | **P2** |
| `Metric` | `core/result.py:108-124` | Promised by the Custom Checks card (`how-to/index.mdx:69`), delivered nowhere. | **P2** |
| `WithGeneratorMixin` / `WithEmbeddingMixin` | `core/mixin.py:7-32` | The documented way to give a *custom* check a `generator`/`embedding_model` field with default fallback. Exported specifically for user subclassing. | **P1** |
| `BaseLLMGenerator` | `generators/base.py:43-124` | `reference/generators.mdx` documents `LLMGenerator` and `UserSimulator` but never the base you subclass (`max_steps`, `max_retries`, abstract `get_prompt()`, `get_inputs()`). | **P2** |
| `Target` | `core/types.py:10-13` | The type of every `target=`/`outputs=` parameter in the API: `(inputs) -> outputs` or `(inputs, trace) -> outputs`, sync or async. Only described in scattered prose. | **P2** |
| `Interact` | `core/interaction/interact.py:17-230` | In `__all__` and used in the `Step` example at `reference/core.mdx:378`, but has no entry of its own — no field table, no `.set_outputs()`, no `.generate()`. | **P1** |
| `CheckStatus` values | `core/result.py:99-105` | The enum is `str, Enum` with **lowercase** values (`"pass"`, `"fail"`, `"error"`, `"skip"`); `reference/core.mdx:142-160` shows uppercase member names only, so `result.status == "PASS"` fails silently. Same trap for `ScenarioStatus` and `TestCaseStatus`, which have no entry anywhere. | **P1** |
| `TestCaseResult.error`, `.last_interaction_index`, `.format_failures()`, `.failures_and_errors`, `.print_report()` | `core/result.py:454-566` | `status` is ERROR whenever `error is not None`, and **`passed` is True when there are no checks** (`:474-476`) — an empty step silently passes. Undocumented. | **P1** |
| `Trace.from_interactions()`, `.with_interactions()`, `.with_interaction()`, `.for_target()` | `core/interaction/trace.py:87-197` | Public, all raising `InteractionGenerationError`. | **P2** |
| `Suite.scenarios` field; `Suite.run` raising `TypeError`/`ValueError` on bad `max_concurrency` even when `parallel=False` | `scenarios/suite.py:138-140,227-234` | | **P2** |
| `UserSimulator.context`, `.max_retries`, `.generator` | `generators/user.py:39-45` + `BaseLLMGenerator` | `simulate-users.ipynb` documents 2 of 5 fields. `context` is the documented per-scenario steering knob (`user.py:33-36`); the guide instead stuffs everything into one giant `persona` string. `max_retries`/`InputGenerationException` is what a reader whose simulator dies mid-suite needs to search for. `generator` lets you drive the user with a cheap model and judge with a strong one. | **P2** |
| `FnCheck.fn` is `Field(exclude=True)` and **not serializable** | `builtin/fn.py:30-44` | The class docstring says "cannot be reliably serialized/deserialized… intended for programmatic/test use only". `custom-checks.ipynb` cell 13 explains `@Check.register` *for serialization* and never warns that the `FnCheck` taught immediately above is exempt. Also cell 5:2's "wraps any boolean function" is incomplete — `run` also accepts a returned `CheckResult` or an awaitable (`fn.py:38-40,55-68`). | **P2** |
| `WithSpy` registered as `InteractionSpec` kind `"with_spy"` | `testing/spy.py:9` | So a suite containing it round-trips through serialization, unlike `FnCheck`. One line. | **P2** |
| `reference/index.mdx:64-116` quick reference | | Omits `Interact`, `Step`, `Metric`, `from_fn`, `WithSpy`, `TestCaseRunner`, `ScenarioRunner`, `Target`, both mixins, and both exception types — all in `__all__`. | **P2** |

### 2.3 Workflow gaps

| # | Gap | Evidence | P |
|---|---|---|---|
| 2.3.1 | `@pytest.mark.llm` is used without registering it. `how-to/ci-cd.ipynb` cell 13:4 tells the reader to split suites with `-m "not llm"` but never registers the marker: pytest emits `PytestUnknownMarkWarning`, and `--strict-markers` (common) hard-errors. giskard-oss registers all of its own markers explicitly (`libs/giskard-checks/pyproject.toml`, root `pyproject.toml`). VERIFIED. Fix: add `markers = ["llm: tests that call a real LLM provider (deselect with -m 'not llm')"]` next to the `asyncio_mode` block in cell 7. | | **P1** |
| 2.3.2 | `oss/contributing.md:53-58` does not match the repo's own verification recipe. `AGENTS.md:24` mandates `make format && make check && make test-unit PACKAGE=<lib>`; `CONTRIBUTING.md:78` requires `make test-examples` whenever a public API shown in docs changes. Neither `make test-unit` (`Makefile:71`) nor `make test-examples` (`Makefile:107`) appears in the docs, which recommend bare `make test` — that runs functional tests too (`Makefile:68`), needing live `OPENAI_API_KEY`/`GOOGLE_API_KEY`/`ANTHROPIC_API_KEY` (`AGENTS.md:60`). A first-time contributor following the docs gets red tests they cannot fix. VERIFIED. | | **P1** |
| 2.3.3 | `oss/contributing.md` omits Conventional Commits (`AGENTS.md:37`, required on every commit) and the `safe for build` label gate for external PRs (`.github/workflows/reset-safe-for-build-label.yml`, `pr-labeler.yml`). Both are things a contributor's PR is judged on. VERIFIED. | | **P2** |
| 2.3.4 | `oss/contributing.md:51` omits the known `make setup` failure: `AGENTS.md:58` — `pre-commit-install` dies with `Cowardly refusing to install hooks with core.hooksPath set`; workaround `make install` + `make install-tools`. Anyone with a global hooks path hits this on step 3. VERIFIED. | | **P2** |
| 2.3.5 | `oss/agent-skills.mdx` omits the `.claude-plugin` marketplace directory that also exists in `Giskard-AI/giskard-skills`, and gives no fallback for readers without `npx`. VERIFIED (repo public; both skills at `oss/checks/{scenario-generator,rag-evaluator}`, both `version: 1.0.0`). | | **P2** |
| 2.3.6 | `explanation/async-and-pytest.md` never mentions `multiple_runs`, and is silent on `Suite.run(parallel=True)` starting every scenario at once by default — on the one page about concurrency. VERIFIED. | | **P2** |
| 2.3.7 | `giskard-oss/examples/` contains two CI-verified runnable files (`examples/README.md`) — including `examples/checks_static/test_checks_static.py`, a 15-line self-contained passing test that needs **no API key**. The docs never link them, and the perfect starter example sits unused. VERIFIED. | | **P1** |

---

## 3. Structure & navigation

### 3.1 Entry points and the golden path

The sidebar is built statically in `astro.config.mjs:34-81` (Starlight `sidebar` array + `starlight-auto-sidebar` for `_meta.yaml`-ordered autogenerated directories). No `_meta.yaml` exists at `src/content/docs/oss/`, so the three Get Started entries are hand-listed at `astro.config.mjs:62-68`.

**3.1.1 — P0 — Four competing OSS top-level groups and no single start.** `astro.config.mjs:61-80` renders **Get Started / Solutions / Scan / Checks** as four peers. The actual click path from the site landing page to a running check:

1. `index.mdx:59-63` → LinkCard "Giskard Open Source" → `/oss`
2. `oss/index.md:18` → "Checks documentation" → `/oss/checks` (the only OSS link `/oss` offers — see 3.1.2)
3. `oss/checks/index.mdx:43` → "Install & Configure" → `/oss/checks/installation`
4. `installation.md:95` → "Your First Test" → `/oss/checks/tutorials/your-first-test`

Four clicks and at least three unforced decisions: Hub vs OSS vs Research on the landing page; eight LinkCards at `oss/checks/index.mdx:53-94` competing with the numbered Steps directly above them; Quickstart vs Your First Test at steps 3–4. Three pages nominate three different first destinations: `index.mdx:62` → `/oss`; `start/comparison.mdx:87` → `/oss/checks/quickstart`; `oss/solutions/index.mdx:19` → `/oss/solutions/scan-vulnerabilities`.
**Fix:** name one entry point and make every other page defer to it; collapse Solutions/Scan/Checks under one "Open Source" group so the sidebar shows one start.

**3.1.2 — P1 — `oss/index.md:16-22` never links to Scan or Solutions.** VERIFIED: its only in-site links are `/oss/checks` (twice), `/oss/agent-skills`, `/oss/contributing`. Half the library — the half `README.md:123-135` leads with — is reachable only from the sidebar. **Fix:** replace the flat bullet list with a card grid (Scan Vulnerabilities, Check Agentic Systems, Scan reference, Checks reference, then Agent Skills / Contributing / Discord).

**3.1.3 — P1 — Two competing checks entry points, and the weaker one is the one that fails.** `oss/checks/index.mdx:39` sends readers who want "to see the whole thing working first" to the Quickstart, whose first runnable cell needs an API key and a working provider; the no-key path (`your-first-test`) is offered as the alternative. For this audience the ordering is backwards. **Fix:** make `your-first-test` the default "see it work" link and label the Quickstart "Quickstart (needs an OpenAI key)".

**3.1.4 — P1 — Scan has no quickstart; its landing page sends you out of the section.** `oss/scan/index.mdx:25` links "Quickstart" to `/oss/solutions/scan-vulnerabilities` — a 19KB page in a different top-level section that substantially duplicates `how-to/wrap-your-agent`, `how-to/save-and-version-suites`, `how-to/scan-in-ci` and `how-to/customize-a-scan`, and never links back into the scan tree. `oss/checks/` by contrast ships `quickstart.ipynb` inside the section. **Fix:** add `oss/scan/quickstart.ipynb` (sidebar order 2, between installation and tutorials): wrap a five-line agent, `vulnerability_scan(..., max_scenarios=4, target_mode="singleturn")`, read one failure — under 10 minutes. Then redirect `/oss/solutions/scan-vulnerabilities` to it, or reduce that page to a signposting overview. Minimum viable version: retitle the link so the reader knows they are leaving the section.

**3.1.5 — P0 — `oss/scan/how-to/index.mdx` omits three of eight how-to pages, including the most important one.** Eight pages exist; the hub links five. Missing: `wrap-your-agent.mdx` (sidebar order **1** — *the* step between toy tutorial and first real use case, linked by nine other pages but not by its own hub), `customize-a-scan.mdx` (order 2), and `quality-scan.ipynb` (order 7 — the only `quality_scan` how-to, and step 6 of the landing page's golden path). The hub's own frontmatter description advertises "wrap your agent, customize generators". **Fix:** add three `<LinkCard>`s, ordered to match the sidebar, leading with Wrap Your Agent.

**3.1.6 — P1 — `oss/scan/tutorials/index.mdx` omits `redteam-to-regression.ipynb` entirely** (sidebar order 2 of four), from both the prose at line 13 (which narrates a three-tutorial path) and the CardGrid — while `scan/index.mdx:48` advertises "Four runnable notebooks". **Fix:** add the card and rewrite line 13 as four steps.

**3.1.7 — P2 — `oss/scan/index.mdx:27-36` golden path skips "your own agent".** Steps go Install → First Scan (toy agent) → How it Works → CI → Tune → Quality; `how-to/wrap-your-agent` never appears. **Fix:** insert as step 3.

### 3.2 Ordering conflicts

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 3.2.1 | `oss/checks/how-to/index.mdx:19-26` (prose) vs `:29-73` (CardGrid) vs notebook `sidebar.order` | **VERIFIED three-way conflict.** Sidebar order: pytest 2, custom-checks 3, simulate-users 4, ci-cd 5, spy 6, structured-output 7, batch 8, stateful 9, custom-trace 10. CardGrid order: pytest, simulate-users, spy, structured-output, batch, stateful, custom-checks, custom-trace, ci-cd. Prose says "finish with CI/CD Integration" — which the sidebar puts fourth, above six other guides. Custom Checks is 2nd in the sidebar and 7th in the grid. | Adopt the prose ordering (it is pedagogically right) and renumber each notebook's `sidebar.order` to match the grid: pytest 2, simulate-users 3, spy 4, structured-output 5, batch 6, stateful 7, custom-checks 8, custom-trace 9, ci-cd 10. | **P1** |
| 3.2.2 | `oss/checks/tutorials/index.mdx:17` vs `test-suites.ipynb` cell 4 vs the notebooks' Next-step links | **VERIFIED contradiction.** The index says the path is Your First Test → Your First LLM Call → Test Suites, with Multi-Turn and Dynamic Scenarios optional. But `test-suites.ipynb` cell 4 lists as prerequisite "Completed Dynamic Scenarios or Multi-Turn Scenarios", and `single-turn.ipynb` cell 13 / `multi-turn.ipynb` cell 12 chain single-turn → multi-turn → dynamic → test-suites. | Pick one. If the index path is canonical, change test-suites' prerequisite to "Completed Your First LLM Call" and point single-turn's Next step at Test Suites, demoting the other two to "See also". | **P1** |
| 3.2.3 | `oss/checks/use-cases/index.mdx:5-6` vs `rag-evaluation.ipynb` cell 2:5-6 | **VERIFIED.** Both set `sidebar.order: 1`; the tie-break is undefined. | `index.mdx` → `order: 0`. | **P2** |
| 3.2.4 | `oss/checks/reference/_meta.yaml` + page orders | **VERIFIED misprioritized.** Order is Overview, Core, Checks, Scenarios, Testing Utilities, Generators, Utilities, Settings — yet `utils.mdx:121-123` itself says its subjects are "primarily used internally… most users won't construct them directly", and it outranks Settings, which every user needs. | Move Settings to order 5. | **P2** |
| 3.2.5 | `oss/checks/tutorials/index.mdx` | "Next steps" (line 47) sits above "Prerequisites" (line 53), and the no-prerequisites line appears twice (line 51 and line 22's card description). | Move Prerequisites above the card grid; delete line 51. | **P2** |
| 3.2.6 | `oss/checks/tutorials/test-suites.ipynb` cell 18 vs `oss/checks/index.mdx:47` | Two different "what's next after suites" — `how-to/run-in-pytest` vs `how-to/ci-cd`. | Unify: run-in-pytest → ci-cd. | **P2** |
| 3.2.7 | `oss/index.md` | Has no `sidebar.order` while `contributing.md:4-5` sets `order: 2`; ordering actually comes from the explicit `astro.config.mjs:63-67` array, so the frontmatter is dead weight that will mislead the next editor. | Drop it, or move the group to an `_meta.yaml` + autogenerate like every other OSS directory. | **P1** |

### 3.3 Diataxis boundaries

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 3.3.1 | `oss/checks/reference/testing-utils.mdx:237-340` | 100 lines of task-oriented how-to ("Replaying recorded conversations", "Batch testing", "Parameterized tests", `asyncio.gather` recipes) inside a reference page. | Move to `how-to/`; leave a "See also". | **P1** |
| 3.3.2 | `oss/checks/reference/checks.mdx:537-656` | Same leak, and worse: "Creating custom checks" is duplicated in `reference/core.mdx:37-66` **and** here at 606-656, with a *different* example — two divergent tutorials for the same thing, both inside reference. | Keep one canonical walkthrough in `how-to/custom-checks` (already linked from `core-concepts.md:122`); reduce both reference occurrences to a signature-level note plus a link. | **P1** |
| 3.3.3 | `oss/checks/reference/generators.mdx:262-299` | A 35-line experiment-design recipe ("Compare personas") in a reference page. | Move to `how-to/`. | **P1** |
| 3.3.4 | `oss/checks/explanation/when-to-use-which-check.md:24-107` | Explanation leaking how-to: three runnable snippets plus a full `rag_test` scenario build. The prose (tradeoff table, common questions) is genuinely good explanation; the code turns it into a tutorial, and lines 63-107 duplicate `reference/checks.mdx:543-582`. | Cut 63-107; keep at most one-line illustrative constructor calls. | **P1** |
| 3.3.5 | `oss/checks/explanation/core-concepts.md:44-68,93-106,137-198` | Milder version: three substantial code blocks including a full `Generator`+`complete()` call and a fluent-API walkthrough that belongs in Quickstart (which it already links at :200). | Reduce to schematic snippets. | **P2** |
| 3.3.6 | `oss/checks/reference/core.mdx:445-469` vs `reference/settings.mdx:77-86` | `set_default_generator`/`get_default_generator` documented in full on both pages with different wording, and `core.mdx` omits the runtime-override-wins rule. Guaranteed future drift. | Delete from `core.mdx`; cross-link. | **P2** |
| 3.3.7 | `oss/checks/reference/checks.mdx:448-490,494` | `SemanticSimilarity` is filed under "## LLM-based Checks" but its module is `builtin.semantic_similarity` and it uses an **embedding** model — the page's own `**Module:**` line contradicts its heading. `Readability` (pure `textstat`, deterministic) sits under the same heading. | Rename the section "LLM judges"; add "Embedding-based checks" and "Text metrics". | **P2** |
| 3.3.8 | `oss/checks/reference/core.mdx:299-351` vs `reference/scenarios.mdx:22-62` | `Scenario` is documented on both pages with **different method sets** and contradictory `.run()` signatures (`core.mdx` shows zero parameters; `scenarios.mdx:56` shows three). A reader cannot tell which page is canonical. | `scenarios.mdx` is canonical; shrink `core.mdx` to a stub + link. | **P1** |
| 3.3.9 | `oss/scan/how-to/dataset-generators.mdx:36-98` | The field-by-field JSONL schema, `kind` discriminators and `prompt_path` semantics are reference material in a how-to. Accurate and useful, just misfiled. | Move to `reference/generators.mdx` under `LocalDatasetScenarioGenerator`; link from the how-to. | **P2** |
| 3.3.10 | `oss/checks/tutorials/dynamic-scenarios.ipynb` cells 5, 7, 9, 14, 16 | **SUSPECTED.** Filed as a tutorial but reads as a how-to: reference-style explanation, prose describing code that appears *after* the paragraph, and a feature tour of input generators rather than a lesson step. | Restructure or refile. | **P2** |
| 3.3.11 | `oss/checks/explanation/index.mdx:13-14` | "nothing here is a step you follow" — contradicted by 3.3.4 and 3.3.5. | Fix the pages, not the sentence. | **P2** |

### 3.4 Dead ends and OSS/paid blurring

- **P2 — `oss/solutions/scan-vulnerabilities.mdx:34`** sends readers to `/hub/ui/scan/vulnerability-categories` for "every category a finding can be filed under" — the canonical list of the *OSS* scan's own output lives only in Hub docs. Lines 36-38 and 377-383 are two more Hub upsells, one a full paragraph plus a screenshot, inside a quickstart. That is the OSS/paid line blurring exactly where a first-run reader is least patient.
- **P2 — Redirects.** `dist/client/_redirects` has 774 lines, all legacy `/oss/notebooks/*` → legacy-docs, gated by `scripts/check-redirects.mjs`. No new-path redirects exist for `/oss/solutions/*` — fine today, relevant if 3.1.4 restructures Solutions.
- **Link rot:** all internal links in `oss/scan/**` resolve. The only broken external link found is the closed roadmap issue (1.4.16).

---

## 4. Clarity & voice

### 4.1 Snippets that are not copy-pasteable

| # | Location | Problem | Fix | P |
|---|---|---|---|---|
| 4.1.1 | `oss/checks/tutorials/single-turn.ipynb` cell 8 | `import os` lives in a stripped cell → rendered snippet raises `NameError`. VERIFIED. | Draft D1. | **P0** |
| 4.1.2 | `oss/checks/how-to/run-in-pytest.ipynb` cell 8 | The designated entry point of the how-to section calls `my_chatbot(inputs)`, an **undefined function**. Cells 8, 10, 13 have no recorded output — nothing on the page runs. VERIFIED. | Open with the key-free runnable example (draft D14). | **P0** |
| 4.1.3 | Bare top-level `await` in `.mdx`/notebook snippets: `oss/solutions/check-agentic-systems.mdx:99`; `oss/checks/how-to/simulate-users.ipynb` cell 21:10; `use-cases/content-moderation.ipynb` cell 21:33; `how-to/spy-on-calls.ipynb` cell 13:1; `oss/checks/reference/utils.mdx:84,93` | Works in a notebook, `SyntaxError` in a `.py` file. Nothing says which cells are notebook-only. `utils.mdx` fixes this for `a_generator` at :137 but not for `ValueProvider`/`ValueGenerator`. Several pages alternate between `await` and `asyncio.run` within one page (`simulate-users` cells 13 vs 21; `content-moderation` cells 21 vs 25). VERIFIED. | Use `asyncio.run(main())` uniformly — the shape in `libs/giskard-checks/README.md` and in `how-to/custom-trace.ipynb` cell 8, which gets it right — or add a standing note that the notebooks run under `nest_asyncio` (cell 0) and scripts need the wrapper. | **P1** |
| 4.1.4 | `oss/checks/tutorials/your-first-test.ipynb` cell 12; `quickstart.ipynb` cell 11 | Both show `asyncio.run(...)`, which fails in a notebook without the hidden `nest_asyncio` cell — invisible to the reader. VERIFIED. | Note beside the cells: "In a notebook, `await` directly; `asyncio.run()` only works in a script (or after `nest_asyncio.apply()`)." | **P2** |
| 4.1.5 | `oss/checks/reference/checks.mdx:180-186,598-601` | Three checks assigned to the same variable name `check`, so only the last survives. VERIFIED. | Give each a distinct name. | **P2** |
| 4.1.6 | `oss/scan/how-to/tune-scan-options.mdx:53` | `options: ScanOptions = {...}` declared inside a tab and unused there (the call below repeats every key), then `**options` at line 179 refers to it across a Tabs boundary. Unrunnable as written. | Drop line 53; define `options` inline in the "Pass options as a dict" section. | **P2** |
| 4.1.7 | `oss/checks/tutorials/test-suites.ipynb` cells 11, 17 | Cell 11 has a dead variable (`scenarios = [...]`, never used by the loop below). Cell 17 is entirely commented out (`# result = asyncio.run(suite.run())`), so the rendered snippet does nothing. | Delete the dead line; make cell 17 a markdown fence or uncomment it. | **P2** |
| 4.1.8 | `oss/checks/how-to/batch-evaluation.ipynb` cells 6:23, 11:24 vs 8:18, 13:20 | Two closure idioms for the same thing one cell apart: `lambda inputs, q=question: my_qa_system(q)` vs `lambda inputs: my_qa_system(inputs)`. The default-arg binding is unnecessary — `interact` passes the resolved input — so the first teaches a cargo cult. | Use `lambda inputs: my_qa_system(inputs)` everywhere. | **P2** |

### 4.2 Formatting

- **P1 — `FnCheck(fn=` line-break mangling, ~30 occurrences.** `fn=` orphaned at end of line with the lambda on the next, producing `FnCheck(fn=\n    lambda trace: ...`. Occurrences: `structured-output.ipynb` cells 12:13, 12:21, 14:32, 14:40, 16:31; `rag-evaluation.ipynb` cells 11:30, 11:39, 15:18, 15:26, 17:10, 23:44, 23:96, 27:2; `testing-agents.ipynb` cells 9:14, 9:29, 11:32, 13:52, 13:60, 13:70, 15:49, 15:57, 17:51, 17:62, 19:67, 19:77; `stateful-checks.ipynb` cell 16:11; `batch-evaluation.ipynb` cell 13:23; `simulate-users.ipynb` cell 11:10; `tutorials/dynamic-scenarios.ipynb` cells 6, 8, 10, 12; `tutorials/multi-turn.ipynb` cell 10. `custom-trace.ipynb` cell 8:23, `rag-evaluation.ipynb` cell 21:80 and `tutorials/test-suites.ipynb` cell 7 get it right, so the fix is mechanical.
- **P1 — `oss/checks/quickstart.ipynb` cell 11 ships broken indentation** to `quickstart.mdx:129-131`: `name=` is under-indented relative to its siblings inside `Groundedness(`.
- **P2 — Mixed em-dash convention** in reference "See also" lists: `--` at `core.mdx:475-478`, `utils.mdx:167-169`, `testing-utils.mdx:346-348`, `scenarios.mdx:332-334`; `—` at `settings.mdx:119-121`, `checks.mdx:662-664`. Standardize on `—`.

### 4.3 Prose

| # | Location | Problem | Rewrite | P |
|---|---|---|---|---|
| 4.3.1 | `oss/index.md:6-22` | Reads as a link farm: 22 lines of one definition sentence, a DeepLearning.AI name-drop, a wrong v2 note, and five bullets. No code, no "here is what a check looks like". `giskard-oss/README.md:88-119` shows a runnable 20-line quickstart above the fold. | Lead with the README's `Scenario(...).interact(...).check(Groundedness(...))` snippet, then the card grid from 3.1.2. | **P1** |
| 4.3.2 | `oss/checks/index.mdx:13` | "lightweight Python library for testing and evaluating non-deterministic applications such as LLM-based systems" — jargon-first. | "Giskard Checks tests LLM apps the way pytest tests code: you write a scenario (what to send) and a check (what the reply must satisfy), and get pass or fail." | **P2** |
| 4.3.3 | `oss/checks/reference/checks.mdx:87` | "Require the wording compliance signed off on whenever the agent touches a savings product" — garbled, no object, and the code below is a generic `keyword="success"` that does not match the framing. | "Require an exact phrase, such as a disclaimer your legal team signed off on:" | **P1** |
| 4.3.4 | `start/comparison.mdx:21-22,60`; `index.mdx:11` | "Basic coverage" / "basic testing capabilities" contradicts the OSS docs: `scan-vulnerabilities.mdx:22-33` documents seven generators across the OWASP LLM Top 10 and `oss/checks/index.mdx:21-29` lists ~20 checks, judges, multi-turn, composition, JUnit. "Basic" makes the OSS reader distrust the OSS docs they are standing in. | State the real boundary — OSS = 7 generators, local, code-driven, single user; Hub = 55+ probes, hosted, continuous, multi-user — which `scan-vulnerabilities.mdx:37` already does honestly. | **P2** |
| 4.3.5 | `oss/solutions/index.mdx:13,28` | The same sentence twice on a 28-line page ("Most teams end up using both — the scan to discover failures, checks to keep them fixed"). | Cut one. | **P2** |
| 4.3.6 | `oss/contributing.md:84-90` | A `gh api` for-loop to star seven repos is house marketing in a contributor guide; `giskard-oss/CONTRIBUTING.md:5` asks once, in one clause. | Trim to the two repos a contributor works in. | **P2** |
| 4.3.7 | `oss/checks/reference/checks.mdx:175-186` | Prose says "Compare against another trace value" over a snippet comparing against a **literal**; the real trace-to-trace example is five lines below at :193. | Delete the mislabelled line. | **P2** |
| 4.3.8 | `oss/checks/reference/testing-utils.mdx:231-233` | "Use `WithSpy` when debugging complex interaction generation logic, understanding multi-turn interaction flow…" — vague, and contradicts the accurate opening at :193. | Delete; the intro says it better. | **P2** |
| 4.3.9 | `oss/checks/reference/core.mdx:240-242`; `explanation/core-concepts.md:153-161,193-198` | Restated content: the Trace-in-templates tip repeats :112 and the docstring; the asyncio guidance appears twice on one page and a third time in `async-and-pytest.md`. | Fold in / keep once. | **P2** |
| 4.3.10 | `oss/checks/reference/utils.mdx:12` vs `:121-123` | Opens as if these are user-facing helpers, then admits at the bottom that two of three sections are internal. | Move the note to the top of the Value Providers section. | **P2** |
| 4.3.11 | `oss/scan/index.mdx:17` | Three unrelated ideas in one sentence (needs a provider + judge fallibility + clean run ≠ assessment). | Split: prerequisite first, judge caveat its own paragraph. | **P2** |
| 4.3.12 | `oss/scan/how-to/index.mdx:13` | "The tutorial's BotaniBot stays where the point is the wrapper mechanics rather than the stakes" — opaque, and inaccurate now that BotaniBot appears in no how-to. | Cut. | **P2** |
| 4.3.13 | `oss/scan/explanation/how-scan-works.mdx:39`; `reference/scan-api.mdx:16` and elsewhere | The identical "The tutorial uses a garden-center assistant instead, because it runs live against a model" sentence appears on four pages, explaining an authoring decision the reader does not need. Same for the `"lidar"` disclaimer, stated three times (`scan-api.mdx:241,441`, `third-party-scanners.mdx:108`). | Keep each once; link. | **P2** |
| 4.3.14 | `oss/checks/installation.md:91` | "`Generator` is `GiskardLLMGenerator`" is accurate (`libs/giskard-agents/.../generators/__init__.py:13`) but reads as an implementation note to a first-time reader. | Move to a collapsed "Under the hood" aside. | **P2** |
| 4.3.15 | `oss/checks/how-to/ci-cd.ipynb` cell 14:12 | "Cap the number of LLM scenarios per run using `pytest --co` to count and setting a budget in CI through environment variables your `conftest.py` reads" — no code, no var name, and `pytest --co` collects, it does not cap. | Delete; point at the real levers, `Suite.run(max_concurrency=...)` and `GISKARD_CHECKS_MAX_REPORTED_FAILURES`. | **P2** |
| 4.3.16 | `oss/checks/how-to/custom-checks.ipynb` cell 23:3 | "Checks run **sequentially** — the scenario stops at the first failure, so order matters." VERIFIED true (`core/scenario.py` class docstring) and the single most useful sentence on the page. | Repeat it in `run-in-pytest.ipynb`, where it explains why a pytest failure shows one failing check and not five. | **P2** |
| 4.3.17 | `oss/checks/tutorials/*` markdown cells (single-turn 5, 7, 9; dynamic 5, 7, 9, 14) | Pre-code and post-code prose bundled in one cell, so the rendered page reads as a non-sequitur. | Split into a lead-in before the code and a takeaway after. | **P2** |

**Positive, for calibration:** `oss/solutions/scan-vulnerabilities.mdx:12` ("A clean run is not a certificate") and `oss/checks/index.mdx:19` (judge fallibility) are exactly the right voice — calibrated, specific, no overclaim. The whole `oss/scan/` section holds that standard, with consistent running examples (retail bank, BotaniBot, Aurora Coffee). `oss/index.md` and `start/comparison.mdx` do not.

---

## 5. Quality-bar gaps (Stripe / Prisma / Astro / LangSmith)

| # | Gap | Evidence | Fix | P |
|---|---|---|---|---|
| 5.1 | **No tabbed provider setup.** `checks/installation.md:21-27` is a five-row table + a separate LiteLLM admonition + one OpenAI-only env example. Stripe/Prisma would let you pick OpenAI / Google / Anthropic / Azure once and get install command + env vars + `Generator(model=...)` together. All the data exists (root `pyproject.toml:26-34` + four provider modules). | | Add `<Tabs>`. | **P1** |
| 5.2 | **No page documents errors raised.** Across all eight checks reference pages there is not one "Raises" block. Real raisers: `Scenario.run()` → `InteractionGenerationError` unless `return_exception=True` (`runner.py:196-217`); `Suite.run()` → `TypeError`/`ValueError` on bad `max_concurrency` (`suite.py:227-234`); `FnCheck.run()` → `TypeError` on a non-bool/non-`CheckResult` return (`builtin/fn.py:71-75`); `Readability` → `ValueError` if `min_score > max_score` (`nlp_metrics.py:106`); `LLMJudge`/`LLMGenerator` → validation error unless exactly one of `prompt`/`prompt_path` (`generators/base.py:164`); any `*_key` → `ValidationError` if it does not start with `trace.` (`extraction.py:30-34`, confirmed by execution); every `Check` subclass → `ValidationError` on unknown kwargs (`extra="forbid"`, `core/check.py:29`) while `Scenario` deliberately allows extras (`core/scenario.py:101-111`) — a genuinely surprising asymmetry documented nowhere. | VERIFIED | A `Raises` row on each `MethodCard`, plus an "Errors" section on `core.mdx`. | **P0** |
| 5.3 | **No page shows what a failure looks like.** Every recorded output across the 13 how-to/use-case notebooks is a pass, except `stateful-checks.ipynb` cell 10, which shows a *hand-typed* "expected output" block rather than real output. A developer's first real interaction with a test framework is a red test. `ScenarioResult.print_report()` / `TestCaseResult.format_failures()` (`core/result.py:365-380,512`) produce genuinely good rich failure output that is invisible in the docs. Also no page shows what a missing API key or a wrong lambda arg looks like — exactly what a stuck reader searches for. | VERIFIED | Add one deliberately-failing scenario with real recorded `print_report()` output to `run-in-pytest.ipynb`, annotated to point at check name, status, reason. | **P1** |
| 5.4 | **Use-case scenarios are built and never run.** `testing-agents.ipynb`: 15 code cells, **10 with no output** (cells 11, 13, 15, 17, 19 each build a full scenario with 3-4 checks and never call `.run()`). `rag-evaluation.ipynb`: 9 of 14 empty. `chatbot-testing.ipynb`: 8 of 14. `content-moderation.ipynb`: 5 of 13. A worked example whose examples produce nothing is a code listing — and the reader cannot tell which snippets are verified and which are aspirational (§1.3.1 shows at least one is aspirational). | VERIFIED | Every scenario cell ends with `result = await scenario.run()` + `result.print_report()`. Where a key is needed, say so. | **P1** |
| 5.5 | **`simulate-users.ipynb` cell 19 prints three PASSED results for scenarios that assert nothing.** `run_persona` builds `Scenario(name).interact(...)` with **no `.check()`**; recorded output: `impatient: PASSED / detailed: PASSED / confused: PASSED`. A zero-check scenario passes vacuously. The section is titled "Swap personas for A/B testing" and demonstrates an A/B test that cannot fail — the exact anti-pattern the library warns about. | VERIFIED | Give `run_persona` the `resolution_offered` FnCheck from cell 11. | **P1** |
| 5.6 | **Use-case pages have no way in.** Each opens with 60-115 lines of *non-Giskard* stub system before the first check (rag cell 7 = 73 lines; testing-agents cell 7 = 115). A developer landing on "how do I test RAG" reads a toy retriever first. | | Lead with the smallest complete Giskard example, then "the system under test is below", then go deep. | **P1** |
| 5.7 | **Parameters are not consistently tabular.** `Scenario`'s constructor fields are prose-only (`reference/core.mdx:299-321`), and the shared comparison-check parameters (`checks.mdx:149-169`) are floating `Property` tags outside any `TypeTable`, so `Equals`/`NotEquals`/`LessThan`/… have **no parameter table of their own**. | VERIFIED | Give each comparison check its own `<TypeTable>`, repeating the shared four fields. Repetition beats indirection in reference. | **P1** |
| 5.8 | **Return shapes are named, not shown.** Every `MethodCard` has a `returnType` string; nothing shows what a `CheckResult`, `ScenarioResult` or `SuiteResult` actually looks like. | | One rendered `result.print_report()` on `scenarios.mdx`, one `repr` of a `CheckResult` on `core.mdx`. | **P1** |
| 5.9 | **Not every reference entry has a runnable minimal example.** Missing entirely: `Metric`, `Step`, `CheckStatus`, `TestCaseRunner`, `ScenarioRunner`, `get_runner()`, `LLMGeneratorOutput`, `SuiteResult.to_junit_xml`, `ScenarioRunner.run`. | VERIFIED | | **P2** |
| 5.10 | **No versioned docs and no version banner.** Everything documented is an RC; no page states which library version it targets, though `__version__` is exported. Astro and Prisma stamp this on every page. | | Version in `reference/index.mdx`, stability note on `oss/index.md`. | **P1** |
| 5.11 | **No changelog or migration surface on the site.** `CHANGELOG.md` upstream is genuinely well written and is invisible to readers. | | See 2.1.8. | **P1** |
| 5.12 | **No copy-paste-runnable end-to-end file.** Both solutions pages are fence sequences the reader must assemble; `check-agentic-systems.mdx:99` uses bare top-level `await`, which fails in a `.py` script — unstated. `giskard-oss/examples/` has two CI-verified runnable files the docs never link. | VERIFIED | | **P1** |
| 5.13 | **No diagram of the core model.** Trace → Interaction → Check → Scenario → Suite is prose-only (`quickstart.ipynb` cell 5, `multi-turn.ipynb` cell 5) and the reader is punted to `explanation/core-concepts`. One SVG on `oss/checks/index.mdx` would carry the whole mental model. | | | **P2** |
| 5.14 | **No "prerequisites / time / what you'll build" header on the Quickstart.** The tutorials have it (`single-turn` cell 4, `test-suites` cell 4, `your-first-test` cell 4); the page most search traffic lands on does not. | | | **P2** |
| 5.15 | **No admonitions in the notebooks.** Every warning that exists sits on entry pages; the notebooks are flat markdown + code with zero `:::note`/`:::caution`. The two that most need them: the injection-name gotcha (2.1.4) and "judged checks cost money" (2.1.5). | | | **P2** |
| 5.16 | **Hardcoded run-specific numbers in tutorial prose.** `oss/scan/tutorials/scan-a-rag-agent.ipynb` cell 23: "The pass rate moved from 0.8 to 1.0 on the same ten questions" — matches today's committed output but is judge-dependent, and CI re-running the notebook updates the output and not the sentence. Same pattern in `redteam-to-regression.ipynb` cell 27. | VERIFIED | Rephrase to "The two failures this suite found are gone"; drop the numerals. | **P1** |
| 5.17 | **`oss/scan/tutorials/your-first-scan.ipynb` cell 10 asks for 4 scenarios and gets 3** (committed output: `scenarios: 3`). Correct behaviour — the multinomial split in `catalog.py:_generate_scenarios` plus multi-turn generators returning `[]` under `singleturn`, explained at `explanation/how-scan-works.mdx:165` — but the tutorial never mentions it, so the very first number a new user sees contradicts the argument they just typed. | VERIFIED | One sentence after cell 10: "You asked for 4 and got 3: the budget is split across generators by a random draw, and the two multi-turn generators return nothing in single-turn mode." | **P1** |
| 5.18 | **`result.final_trace.last.inputs.question` used without a guard.** `oss/scan/tutorials/redteam-to-regression.ipynb` cell 13, `scan-a-rag-agent.ipynb` cell 16. `ScenarioResult.final_trace` is typed `TraceType` but is not guaranteed populated on an errored scenario, and `failures_and_errors` includes errors — so a reader adapting this loop hits `AttributeError` on their first provider timeout. **SUSPECTED** (not reproducible without a key). | | Iterate `[r for r in ... if r.failed]` and guard `if result.final_trace`. | **P2** |
| 5.19 | **`oss/checks/use-cases/index.mdx:16-17` claims Content Moderation is "the shortest" page.** VERIFIED false by notebook size: chatbot-testing 71.1K, **content-moderation 80.1K** (largest), rag-evaluation 64.0K, testing-agents 57.5K (shortest). | | Re-point at Testing Agents, or drop the length claim. | **P2** |
| 5.20 | **Support path is Discord-only and undocumented.** `ISSUES.md` deliberately routes individual support to Discord and issues to bugs/features — defensible, but unstated on the site, so readers file the wrong thing in the wrong place. | VERIFIED | | **P2** |
| 5.21 | **Cross-references are one-directional.** `core.mdx` links to `scenarios.mdx` for `Scenario`; `scenarios.mdx` re-documents it with a different method set instead of linking back (see 3.3.8). | | Pick one canonical page per symbol. | **P2** |

---

## Drafts

**D1 — `oss/checks/tutorials/single-turn.ipynb` cell 8 (replaces the `OPENAI_BASE_URL` version):**

```python
import os

from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


async def call_model(user_message: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content
```

**D2 — `oss/scan/installation.md:44` (replaces the LiteLLM paragraph):**

````md
`openai`, `anthropic`, `google`, and `azure` are the first-party extras — install
`giskard[<extra>]` and use the matching model prefix: `openai/`, `anthropic/`,
`google/` (or `gemini/`), `azure/`, `azure_ai/`.

:::note[Using LiteLLM instead]
For any other provider, install `pip install --pre "giskard[litellm]"` and pass
`LiteLLMGenerator` explicitly — the default `GiskardLLMGenerator` does not route
through LiteLLM:

```python
from giskard.agents.generators import LiteLLMGenerator
from giskard.checks import set_default_generator

set_default_generator(LiteLLMGenerator(model="ollama/llama3"))
```
:::
````

**D3 — `oss/checks/how-to/simulate-users.ipynb`, replacing cells 14–17:**

```python
# The simulator stops early when its goal is met, or after max_steps turns.
turns = len(result.final_trace.interactions)
print(f"Conversation ended after {turns} turn(s) (max_steps={customer.max_steps})")
assert turns < customer.max_steps, "Simulator never reached its goal — agent looped"
```

**D4 — `oss/checks/how-to/custom-checks.ipynb` cell 24:**

```python
scenario = (
    Scenario("safe_reply")
    .interact(inputs="Tell me about investing.", outputs=lambda inputs: my_llm(inputs))
    .checks(*safety_checks())
)
```

**D5 — `oss/checks/how-to/structured-output.ipynb`, delivering the promised `resolve` demo:**

```python
from giskard.checks import FnCheck, resolve

# resolve() returns a NoMatch sentinel instead of raising on a path that does not exist.
# It reads trace.model_dump(), so it sees dicts — not your Pydantic instances.
FnCheck(
    fn=lambda trace: resolve(trace, "trace.last.outputs.address.city") == "London",
    name="correct_city",
)
```

**D6 — `oss/checks/how-to/stateful-checks.ipynb` cell 9 (and the same shape in `simulate-users.ipynb` cell 19):**

```python
async def main():
    return await asyncio.gather(*(s.run() for s in scenarios))


results = asyncio.run(main())
```

**D7 — `oss/scan/tutorials/custom-scenario-generator.ipynb` cell 8:**

```python
@property
@override
def allow_commercial_use(self) -> bool:
    return False
```

**D8 — `oss/checks/explanation/core-concepts.md`, runtime flow + check timing:**

> Each InteractionSpec is driven as an async generator and appends **one or more** Interactions to the Trace — a `UserSimulator` or `LLMGenerator` yields up to `max_steps` turns from a single spec.
>
> Checks run once per **step**. A step is a group of interaction specs followed by checks: every spec in the step is resolved and appended to the trace first, then each check in that step runs against the resulting trace. `.check()` after `.interact()` opens the checks of the current step; the next `.interact()` starts a new step.
>
> If a step does not pass (FAIL, ERROR, or all-SKIP), execution stops. Every remaining step is still reported, with each of its checks marked SKIP and the message `Step N was skipped due to previous failure`.

**D9 — `oss/index.md:13` (replaces the RAGET note):**

> :::note
> Coming from Giskard v2? **Scan** is now `giskard.scan.vulnerability_scan`, and **RAGET** is replaced by `giskard.scan.quality_scan` with a `KnowledgeBase`. Both ship in the `scan` extra: `pip install --pre "giskard[scan]"`. The v2-only tabular/ML scan, `giskard.testing`, and `giskard.Model`/`Dataset` are not part of v3 — stay on `giskard[llm]>2,<3` for those, and see the [v2 documentation](https://legacy-docs.giskard.ai). Full breaking-change list: [CHANGELOG](https://github.com/Giskard-AI/giskard-oss/blob/main/CHANGELOG.md).
> :::

**D10 — `oss/checks/explanation/jsonpath-in-checks.md`, new section:**

> ### Multi-match paths
>
> A wildcard, slice, union, or descendant path (`trace.interactions[*].outputs`) resolves to a **list** of every match, not a single value. Comparison checks compare against that list as a whole unless you set `match="any"`, `"all"`, or `"none"`.

**D11 — `oss/checks/quickstart.ipynb`, new visible markdown cell before cell 6, plus a visible config cell:**

> `Groundedness` is a judged check: it calls an LLM. Install and configure a provider first — `pip install --pre "giskard[openai]"` and `export OPENAI_API_KEY=...`. Without it, this cell fails with `WorkflowError: Step processing failed`. Want a no-key path? Start with [Your First Test](/oss/checks/tutorials/your-first-test).

```python
from giskard.agents.generators import Generator
from giskard.checks import set_default_generator

set_default_generator(Generator(model="openai/gpt-4o-mini"))
```

**D12 — injection-name admonition (`tutorials/your-first-test.ipynb` cell 7, `dynamic-scenarios.ipynb` cell 7):**

> The parameter name is how Giskard decides what to pass. For `outputs`, name it `inputs` or `trace`; for `inputs`, name it `trace`. Any other required parameter name raises `TypeError: Parameter '<name>' is required but not in the injection requirements`.

**D13 — cost lines.**

`oss/scan/installation.md` (after line 58) and `oss/scan/index.mdx` (after line 17):

> A default scan runs every generator at its own budget — expect 100+ scenarios, each costing one call to your agent and one to the judge, and several minutes. Start with `max_scenarios=20` while you wire things up.

`oss/checks/installation.md`:

> Each judged check is one LLM call per scenario run; a 50-scenario suite with two judged checks is 100 calls. `UserSimulator` costs one call per turn, up to `max_steps`.

**D14 — `oss/checks/how-to/run-in-pytest.ipynb`, new opening cell (runnable, no API key, recorded output) — adapted from `giskard-oss/examples/checks_static/test_checks_static.py`:**

```python
# test_echo.py — no API key needed
from giskard.checks import Equals, Scenario


def echo(inputs: str) -> str:
    return inputs


async def test_echo():
    result = await (
        Scenario("echo")
        .interact(inputs="hello", outputs=echo)
        .check(Equals(target_key="trace.last.outputs", expected_value="hello"))
        .run()
    )
    result.print_report()
    assert result.passed
```

Configuration (`asyncio_mode`, markers) comes *after* the reader has seen green.

**D15 — `oss/checks/how-to/ci-cd.ipynb`, JUnit + env config:**

```python
result = await suite.run(parallel=True)
result.to_junit_xml("reports/giskard.xml")
```

```yaml
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        GISKARD_CHECKS_DEFAULT_MODEL: openai/gpt-4o-mini
        GISKARD_CHECKS_MAX_REPORTED_FAILURES: "20"   # keep CI logs bounded
        GISKARD_TELEMETRY_DISABLED: "1"

      - name: Publish test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: giskard-results
          path: reports/giskard.xml
```

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
markers = ["llm: tests that call a real LLM provider (deselect with -m 'not llm')"]
```

**D16 — `oss/checks/how-to/batch-evaluation.ipynb` cell 6, replacing the hand-rolled gather:**

```python
from giskard.checks import Suite

suite = Suite(name="qa_batch", scenarios=[...])
result = await suite.run(parallel=True, max_concurrency=5)
print(f"Pass rate: {result.pass_rate:.0%} ({result.passed_count}/{len(result.results)})")
result.print_report()
```

---

## Prioritized worklist

Each item is sized as one PR. Ordered by impact on first-run success, not by effort.

### P0 — blocks onboarding

| # | PR | Files | Refs |
|---|---|---|---|
| 1 | **Make the checks quickstart runnable.** Fix the model id, un-strip (or add visible) setup cells, add the API-key admonition and the `WorkflowError` warning, fix the cell-11 indentation. | `oss/checks/quickstart.ipynb` | 1.2.1, 2.1.1, 4.2, D11 |
| 2 | **One install string everywhere.** Add `--pre` to the four scan-vulnerabilities fences, unpin `check-agentic-systems.mdx:17`, switch all notebook cell-3 installs to `--pre "giskard[openai]"`, document `regorus`/`all-checks`/`full`/`all-llms`. Add a grep gate in CI so it cannot regress. | `oss/solutions/*.mdx`, all `oss/**/*.ipynb` cell 3, both `installation.md` | 1.1.1–1.1.6 |
| 3 | **Single model id across the tree.** Replace all 15 `gpt-5.4-nano` and the 12 `gpt-5-mini` with the chosen id; add a grep gate. | all `oss/checks/**/*.ipynb` | 1.2.1 |
| 4 | **Delete the fabricated `simulator_output` section**, replace with the turn-count assertion; fix the `asyncio.run(asyncio.gather(...))` crash in the same file and in `stateful-checks.ipynb`. | `how-to/simulate-users.ipynb`, `how-to/stateful-checks.ipynb` | 1.3.1, 1.3.8, D3, D6 |
| 5 | **Fix the LiteLLM instructions in the scan install page** (wrong class, wrong extra, wrong provider list) and add the Azure env vars. | `oss/scan/installation.md` | 1.2.3, 1.2.4, D2 |
| 6 | **Rewrite the RAGET / v2 note on the OSS landing page** and fix the closed-issue roadmap link. | `oss/index.md` | 1.4.5, 1.4.16, D9 |
| 7 | **Fix the execution model in core-concepts** (per-step checks, generator specs, early-stop SKIPs). | `explanation/core-concepts.md` | 1.4.1–1.4.3, D8 |
| 8 | **Give the how-to section a runnable, key-free opening example**, replacing the undefined `my_chatbot` in `run-in-pytest.ipynb`; link `giskard-oss/examples/`. | `how-to/run-in-pytest.ipynb`, `how-to/index.mdx` | 4.1.2, 2.3.7, D14 |
| 9 | **Add `Suite` to batch-evaluation** and replace the hand-rolled suite classes in the three use-cases. | `how-to/batch-evaluation.ipynb`, `use-cases/{rag-evaluation,chatbot-testing,testing-agents}.ipynb` | 2.2 (`Suite`), D16 |
| 10 | **Make CI/CD a real CI guide:** JUnit export + artifact upload, `GISKARD_CHECKS_*` env config, registered `llm` marker, telemetry opt-out; delete the `pytest --co` non-instruction. | `how-to/ci-cd.ipynb` | 2.2, 2.3.1, 2.1.6, 4.3.15, D15 |
| 11 | **New troubleshooting page** mapping the ten known first-run errors to cause and fix, linked from both section hubs and both install pages. | new `oss/troubleshooting.md` + links | 2.1.3 |
| 12 | **Mark the no-key path.** Badge every page that needs a provider key; reorder the how-to section key-free-first. | `oss/checks/how-to/*`, `oss/checks/use-cases/*` | 2.1.2 |
| 13 | **Add a scan cost/runtime warning** to the scan install page, landing page, and `max_scenarios` reference entry. | `oss/scan/installation.md`, `oss/scan/index.mdx`, `oss/scan/reference/scan-api.mdx` | 2.1.5, D13 |
| 14 | **Fix the scan how-to hub** — add the three missing cards, lead with Wrap Your Agent; add Wrap Your Agent as step 3 of the landing golden path. | `oss/scan/how-to/index.mdx`, `oss/scan/index.mdx` | 3.1.5, 3.1.7 |
| 15 | **Add `Scenario`'s six missing builder methods to the reference**, `with_target()` first. | `reference/scenarios.mdx` | 2.2 |
| 16 | **Add an Errors/Raises surface to the checks reference**, including the `extra="forbid"` asymmetry and `InteractionGenerationError.partial_trace`. | `reference/core.mdx` + `MethodCard`s | 5.2 |
| 17 | **Collapse the four OSS sidebar groups into one entry point** and give `oss/index.md` a card grid that links Scan and Solutions. | `astro.config.mjs`, `oss/index.md` | 3.1.1, 3.1.2, 3.2.7 |

### P1 — causes confusion

| # | PR | Files | Refs |
|---|---|---|---|
| 18 | Fix `single-turn.ipynb` cell 8 (`OPENAI_BASE_URL` KeyError + missing `import os`). | `tutorials/single-turn.ipynb` | 1.2.2, 4.1.1, D1 |
| 19 | Document the name-based injection rule with an admonition in the two tutorials that first hit it. | `tutorials/{your-first-test,dynamic-scenarios}.ipynb` | 2.1.4, D12 |
| 20 | Tabbed provider setup (install + env vars + `Generator(model=…)` per provider) and `GISKARD_CHECKS_DEFAULT_MODEL`. | `oss/checks/installation.md` | 1.2.4, 1.2.6, 5.1 |
| 21 | Telemetry + welcome-banner disclosure section. | `oss/checks/installation.md` | 2.1.6 |
| 22 | Fix the `MISSING` vs `None` defaults across the whole checks reference, plus `NotProvided`, `AllOf`/`AnyOf` skip semantics, `resolve` return shape, lowercase `CheckStatus` values. | `reference/{checks,core,scenarios}.mdx` | 1.4.7–1.4.12, 2.2 |
| 23 | Multi-match `resolve` section in the JSONPath explanation. | `explanation/jsonpath-in-checks.md` | 1.4.6, D10 |
| 24 | Fix the four wrong-prose findings in how-to (`.check()` variadic, `reason` optionality, `Equals.key`, the unused `resolve` promise + private import). | `how-to/{custom-checks,structured-output}.ipynb` | 1.3.4–1.3.7, D4, D5 |
| 25 | Fix `SemanticSimilarity` "no LLM call" claim and the `Persona`/`answer_key` phantom parameters. | `oss/checks/index.mdx`, `tutorials/dynamic-scenarios.ipynb`, `quickstart.ipynb` | 1.4.4, 1.3.2, 1.3.3 |
| 26 | Run every use-case scenario and record its output; add `Toxicity`, `AllOf`, `AnswerRelevance` where the topic calls for them. | `use-cases/*.ipynb` | 5.4, 2.2 |
| 27 | Show a failing test: one deliberately-failing scenario with real `print_report()` output. | `how-to/run-in-pytest.ipynb` | 5.3 |
| 28 | Fix the vacuous persona A/B test (no checks → three vacuous PASSes); document `UserSimulator.context`/`max_retries`/`generator`. | `how-to/simulate-users.ipynb` | 5.5, 2.2 |
| 29 | Resolve the three-way how-to ordering conflict and the tutorials prerequisite contradiction. | `how-to/index.mdx` + notebook frontmatter, `tutorials/index.mdx` + `test-suites.ipynb` | 3.2.1, 3.2.2 |
| 30 | Add `oss/scan/quickstart.ipynb` and re-point `scan/index.mdx:25`; add the missing redteam tutorial card. | new notebook, `oss/scan/{index.mdx,tutorials/index.mdx}` | 3.1.4, 3.1.6 |
| 31 | Fix the two scan tutorial output claims (invisible GOAT/Crescendo skips; "4 asked, 3 returned") and de-hardcode the pass-rate numerals. | `oss/scan/tutorials/{your-first-scan,scan-a-rag-agent,redteam-to-regression}.ipynb` | 1.4.15, 5.16, 5.17 |
| 32 | New v2→v3 migration page from `CHANGELOG.md:67-86`, linked from `oss/index.md`. | new `oss/migrating-from-v2.md` | 2.1.8 |
| 33 | Versioning & stability policy + version stamp on the reference index. | `oss/index.md`, `reference/index.mdx` | 2.1.7, 5.10 |
| 34 | Fix `contributing.md`: `make test-unit PACKAGE=` / `make test-examples`, the `make setup` hooks-path failure, Conventional Commits, the `safe for build` label, the bug-report fields, SECURITY.md, the Python-version nuance; trim the star loop. | `oss/contributing.md` | 2.3.2–2.3.4, 2.1.9, 1.4.17, 4.3.6 |
| 35 | Diataxis cleanup: move the three how-to sections out of reference, cut the duplicated custom-check tutorials, cut `when-to-use-which-check.md:63-107`, make `scenarios.mdx` canonical for `Scenario`. | `reference/*`, `explanation/when-to-use-which-check.md` | 3.3.1–3.3.4, 3.3.8 |
| 36 | Rewrite `oss/index.md` to lead with a runnable snippet; add the "what Giskard is not" scope section. | `oss/index.md` | 4.3.1, 2.1.10 |
| 37 | Normalize async style: `asyncio.run(main())` everywhere, or a standing `nest_asyncio` note; fix the `utils.mdx` bare-`await` examples. | `oss/**/*.ipynb`, `reference/utils.mdx` | 4.1.3, 4.1.4 |
| 38 | Mechanical formatting pass: `FnCheck(fn=lambda …)` on one line (~30 sites), quickstart indentation, em-dash consistency. | `oss/checks/**/*.ipynb`, `reference/*` | 4.2 |
| 39 | Give each comparison check its own `<TypeTable>`; show real `CheckResult` / `print_report()` output in the reference. | `reference/{checks,core,scenarios}.mdx` | 5.7, 5.8 |
| 40 | Document `multiple_runs`, `tags`/`with_tags`/`group_by`, `from_fn`, `Metric`, the exception types, `TestCaseResult.error`, and both mixins. | `reference/*`, `how-to/{batch-evaluation,custom-checks}.ipynb` | 2.2 |
| 41 | Lead each use-case page with the smallest complete Giskard example before the stub system. | `use-cases/*.ipynb` | 5.6 |

### P2 — polish

| # | PR | Refs |
|---|---|---|
| 42 | Normalize `Generator` vs `GiskardLLMGenerator` naming across the solutions pages. | 1.2.5 |
| 43 | Fix `comparison.mdx`: "basic capabilities" framing and the wrong tool-calling row. | 4.3.4, 1.4.18 |
| 44 | Reference ordering + section headings (`Settings` up, `SemanticSimilarity`/`Readability` out of "LLM-based"). | 3.2.4, 3.3.7 |
| 45 | De-duplicate: `set_default_generator` on two pages, the solutions-index repeated sentence, the four-times-repeated garden-center aside, the thrice-repeated `lidar` disclaimer, the asyncio guidance. | 3.3.6, 4.3.5, 4.3.9, 4.3.13 |
| 46 | Prose fixes: the garbled `checks.mdx:87` sentence, the vague `WithSpy` tip, the mislabelled trace-value example, `utils.mdx`'s buried "internal" note, `scan/index.mdx:17`, `scan/how-to/index.mdx:13`, the jargon-first `oss/checks/index.mdx:13`. | 4.3.2, 4.3.3, 4.3.7, 4.3.8, 4.3.10–4.3.12 |
| 47 | Notebook hygiene: dead variables, the fully-commented-out cell, the two closure idioms, split pre/post-code markdown cells, private import path, `test-suites` result table. | 4.1.5–4.1.8, 4.3.17, 1.3.9, 1.3.10 |
| 48 | Add `DatasetInputGenerator`, `RegoPolicy`, `BaseLLMGenerator`, `Target`, `Interact`, `Trace` builder methods, `WithSpy` serialization note, `FnCheck` non-serializability warning. | 2.2 |
| 49 | Core-model diagram on `oss/checks/index.mdx`; quickstart header block; notebook admonitions. | 5.13–5.15 |
| 50 | Move `oss/scan/how-to/dataset-generators.mdx:36-98` schema into the scan reference. | 3.3.9 |
| 51 | Guard `final_trace` access in the two scan tutorials; fix the "shortest page" claim; `use-cases/index.mdx` order collision; `agent-skills.mdx` marketplace + no-`npx` fallback; support-path note; scan "what you don't need" line. | 5.18, 5.19, 3.2.3, 2.3.5, 5.20, 2.1.10 |
| 52 | Normalize `Union[...]` vs `X \| Y` in `scripts/diff-api.py` so the API differ stops emitting 74 spurious deltas. | §0 |
