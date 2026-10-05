---
title: SOM as a judge
description: "Use a System One Model (SOM) backend for LLM checks — probability-based verdicts, when to prefer them over chat judges, and how to configure TypeSafe."
sidebar:
  order: 5
---

LLM-backed checks such as `Groundedness`, `Conformity`, and `LLMJudge` need a **judge**: something that turns the check prompt and the interaction trace into a pass or fail. By default that judge is an **LLM** (`LLMChatJudge`), which completes a chat prompt and returns structured `LLMCheckResult` with a natural-language reason.

A **SOM judge** (`SOMJudge`) uses a **System One Model** instead: a model that returns a **probability** that a yes/no question holds for the interaction evidence. Giskard compares that probability to a `pass_threshold` (default `0.5`) and builds a short, deterministic reason string (`P(pass)=…`, `threshold=…`). The same check classes and templates work with either backend; you only change how the default or per-check `judge` is configured.

## When to prefer a SOM judge

| | LLM judge (`LLMChatJudge`) | SOM judge (`SOMJudge`) |
| --- | --- | --- |
| **Verdict** | Model writes pass/fail + rationale | Fixed threshold on `P(pass)` |
| **Reason text** | Natural language from the model | Python summary (probability and threshold) |
| **Custom output schemas** | Supported via `output_type` | Only `LLMCheckResult` |
| **Latency** | One model call, roughly 0.5–5 s | One model call, roughly 0.5–5 s |
| **Typical use** | Exploratory rules, rich failure messages | Rubric-style checks at scale, comparable scores |

SOM judging does not replace rule-based or semantic checks. It is an alternative **backend for qualitative checks** when you want a scored probability rather than a generated rationale. For choosing between rule-based, semantic, and LLM-style checks in general, see [When to use which check](/oss/checks/explanation/when-to-use-which-check).

## How the SOM path uses the trace

For each verdict, the judge splits the check template into two pieces:

1. **Messages** — the interaction trace is fenced and sent as the shared “state” the SOM reads (the evidence from your scenario).
2. **Question** — the check rubric is rendered **without** the trace block and passed as the SOM question (for example the conformity rule or groundedness instructions).

Checks already pass `inputs["trace"]` into the judge. If the trace is empty, `SOMJudge` raises `MissingJudgeEvidenceError` instead of calling the model. API details are in [`SOMJudge`](/oss/checks/reference/core#judge-backends).

## Configure a SOM judge

### Suite-wide default

Point the default judge at a supported SOM provider. TypeSafe is built in; model id `jev` expands to `jev-latest`.

```python
from giskard.checks import set_default_judge

set_default_judge("typesafe/jev")
# Equivalent explicit prefix:
# set_default_judge("som/typesafe/jev")
```

Or set the environment variable (same string formats as `set_default_judge`):

```bash
export GISKARD_CHECKS_DEFAULT_JUDGE=typesafe/jev
```

Resolution order and other settings are documented in [Settings](/oss/checks/reference/settings#default-judge).

### Per-check override

Pass `judge=` on any check that supports it:

```python
from giskard.checks import Conformity, SOMJudge
from giskard.agents import BaseSOM

som = BaseSOM.model_validate({"kind": "typesafe", "model": "jev"})
check = Conformity(
    rule="The assistant must not provide medical advice.",
    judge=SOMJudge(model=som, pass_threshold=0.7),
)
```

Tune `pass_threshold` when you want stricter or looser pass rates; the bundled checks use the same templates as LLM judges.

### TypeSafe credentials and endpoints

Set `TYPESAFE_API_KEY` before running scenarios. Optional `TYPESAFE_BASE_URL` or `TYPESAFE_API_BASE` override the API origin when you use a private gateway.

Configure credentials and base URLs in **environment variables** or in **trusted application code** when you construct a `TypeSafeSOM`. Do not treat scenario JSON or other untrusted input as the place to set provider endpoints or API key environment names.

## Custom SOM providers

Libraries can register additional `BaseSOM` implementations (discriminated by `kind`) and pass them to `SOMJudge` or `set_default_judge`. Provider strings such as `my_provider/my-model` resolve when `my_provider` is registered on `BaseSOM`. See the `BaseSOM` API in the [checks core reference](/oss/checks/reference/core#judge-backends).

## Related reading

- [Generators and judges](/oss/checks/explanation/core-concepts#generators-and-judges) — default generator vs default judge
- [When to use which check](/oss/checks/explanation/when-to-use-which-check) — rule-based vs semantic vs qualitative checks
- [Settings](/oss/checks/reference/settings) — `GISKARD_CHECKS_DEFAULT_JUDGE` and `set_default_judge`
