---
title: Migration Guide
description: Migrate from Hub v2 (SDK 3.1) to Hub v3 (SDK 3.2.0). Renamed resources, deprecated methods, and breaking check identifier changes.
sidebar:
  order: 7
---

Hub v3 pairs with SDK **3.2.0**. This guide covers what changes when you move from Hub v2 (SDK 3.1.x) to Hub v3. Most SDK renames are backwards compatible and only emit a `DeprecationWarning`. The **check identifier renames are breaking**: scripts and CI pipelines that pass the old identifiers will fail against Hub v3, so read that section first.

:::caution
The Hub and the SDK must upgrade together, Hub first, then the SDK. SDK 3.1.x breaks against Hub v3 (it sends old check identifiers and calls endpoints that were removed), and SDK 3.2.0 does not work against Hub v2.
:::

## Upgrade the SDK

```bash
pip install --upgrade "giskard-hub>=3.2.0"
```

Verify the installed version:

```bash
python -c "import giskard_hub; print(giskard_hub.__version__)"
```

---

## Breaking: check identifiers renamed

The Hub renamed several built-in check identifiers. Requests that pass an old identifier now get a **422 error** from the Hub, usually with a "Did you mean the '...' check?" tip. This applies everywhere an identifier appears: `checks` inside scenarios, `hub.evaluations.run_single()`, custom check `params`, and uploaded dataset files.

| Old identifier             | New identifier     |
| -------------------------- | ------------------ |
| `correctness`              | `hub_correctness`  |
| `conformity` (Hub check)   | `hub_conformity`   |
| `groundedness` (Hub check) | `hub_groundedness` |
| `metadata`                 | `hub_metadata`     |
| `string_match`             | `string_matching`  |
| `regex_match`              | `regex_matching`   |

```python
# Hub v2 (SDK 3.1)
hub.test_cases.create(
    dataset_id=dataset_id,
    messages=[{"role": "user", "content": "What is your refund policy?"}],
    checks=[{"identifier": "correctness", "params": {"reference": "30 days."}}],
)

# Hub v3 (SDK 3.2)
hub.scenarios.create(
    dataset_id=dataset_id,
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "What is your refund policy?"}]
            },
            "checks": [
                {"identifier": "hub_correctness", "params": {"reference": "30 days."}}
            ],
        }
    ],
)
```

:::danger
`conformity` and `groundedness` **still exist but changed meaning**. They now name the open-source giskard-checks variants, not the Hub checks. The OSS `conformity` takes a single `rule: str` instead of `rules: list[str]`, so a script that keeps passing `{"identifier": "conformity", "params": {"rules": [...]}}` fails with a 422 instead of a rename tip. Switch those to `hub_conformity` and `hub_groundedness`. See [Built-in checks](/hub/sdk/guides/datasets-and-checks#built-in-checks) for the full new catalogue.
:::

### Params classes renamed

If you use the typed params classes:

- `CorrectnessParams` is removed. Use `HubCorrectnessParams` (`reference`).
- `MetadataParams` is removed. Use `HubMetadataParams` (`json_path_rules`).
- `StringMatchParams` is removed. Use `StringMatchingParams`.
- `ConformityParams` now describes the OSS check (single required `rule: str`). Use `HubConformityParams` for the Hub check (`rules: list[str]`).
- Typed params classes now exist for all 21 built-in checks (e.g. `HubGroundednessParams`, `SemanticSimilarityParams`, `LLMJudgeParams`).

### Validation moved server-side

The SDK no longer validates check identifiers or params locally, the Hub does. Errors that were previously raised locally as `ValueError` now surface as `UnprocessableEntityError` (HTTP 422). Wrong or unknown check params, which were previously accepted and silently dropped, are now rejected at save time and at run time. Update any `except ValueError` handling around check creation accordingly.

---

## Deprecated: chat-shaped arguments become structured input/output

Hub v3 supports agents with arbitrary input and output schemas, so the SDK moved from chat-only arguments to structured `input` / `output` dicts. The old chat-shaped arguments still work with a `DeprecationWarning` and are translated for you.

### Scenario creation: `messages` / `demo_output` / `checks` become `interactions`

The flat scenario shape maps into a single interaction. `messages` becomes `input["messages"]`, `demo_output` becomes `output` (a plain string is wrapped as an assistant `response`, a dict's `metadata` key is split out), and `checks` attach to the interaction:

```python
# Hub v2 (SDK 3.1) — deprecated, still works
hub.test_cases.create(
    dataset_id=dataset_id,
    messages=[{"role": "user", "content": "What is your refund policy?"}],
    demo_output={
        "role": "assistant",
        "content": "We offer a 30-day return policy.",
        "metadata": {"category": "returns"},
    },
    checks=[{"identifier": "hub_correctness", "params": {"reference": "30 days."}}],
)

# Hub v3 (SDK 3.2)
hub.scenarios.create(
    dataset_id=dataset_id,
    interactions=[
        {
            "input": {
                "messages": [{"role": "user", "content": "What is your refund policy?"}]
            },
            "output": {
                "response": {
                    "role": "assistant",
                    "content": "We offer a 30-day return policy.",
                },
                "metadata": {"category": "returns"},
            },
            "checks": [
                {"identifier": "hub_correctness", "params": {"reference": "30 days."}}
            ],
        }
    ],
)
```

You cannot mix `interactions=` with the legacy arguments in one call. The same applies to `scenarios.update()`.

### `datasets.upload()` records

Records in the legacy `{messages, demo_output, checks}` shape are still translated on upload, with a `DeprecationWarning`. Use the new `{"interactions": [{"position", "input", "output", "checks"}]}` shape, and remember the check identifiers inside must use the new names either way.

### `agents.generate_completion()`: `messages` becomes `input`

```python
# Hub v2 (SDK 3.1) — deprecated, still works
output = hub.agents.generate_completion(agent_id, messages=[{"role": "user", "content": "Hi"}])
print(output.response.content)

# Hub v3 (SDK 3.2)
output = hub.agents.generate_completion(
    agent_id, input={"messages": [{"role": "user", "content": "Hi"}]}
)
print(output.output["response"]["content"])
```

The `GenerateCompletionOutput.response` and `.message` accessors are deprecated. Read the structured `output` dict directly.

### `evaluations.run_single()`: `messages` becomes `input_data`

```python
# Hub v2 (SDK 3.1) — deprecated, still works
hub.evaluations.run_single(project_id=project_id, messages=[...], agent_output=..., checks=[...])

# Hub v3 (SDK 3.2)
hub.evaluations.run_single(project_id=project_id, input_data={"messages": [...]}, agent_output=..., checks=[...])
```

### Deprecated flattened accessors

These model properties still work but emit a `DeprecationWarning`. They flatten structured data back into chat messages, which loses information for non-chat agents:

| Deprecated accessor         | Read instead                          |
| --------------------------- | ------------------------------------- |
| `Scenario.messages`         | `scenario.interactions[i].input`      |
| `PlaygroundChat.messages`   | `chat.exchanges` (`input` / `output`) |
| `ScanProbeAttempt.messages` | `attempt.input` / `attempt.output`    |

---

## Deprecated: test cases renamed to scenarios

The Hub renamed test cases to **scenarios**. The old SDK surface still works and maps to the new endpoints, but every call emits a `DeprecationWarning`. Update at your own pace:

| Deprecated (still works)                       | Use instead                                  |
| ---------------------------------------------- | -------------------------------------------- |
| `hub.test_cases.*`                             | `hub.scenarios.*`                            |
| `hub.test_cases.comments`                      | `hub.scenarios.comments`                     |
| `hub.datasets.list_test_cases()`               | `hub.datasets.list_scenarios()`              |
| `hub.datasets.search_test_cases()`             | `hub.datasets.search_scenarios()`            |
| `hub.evaluations.results.rerun_test_case()`    | `hub.evaluations.results.rerun_scenario()`   |
| `test_case_ids=` (bulk operations)             | `scenario_ids=`                              |
| `include=["test_case"]` (results)              | `include=["scenario"]`                       |
| `set_test_case_draft=`                         | `set_scenario_draft=`                        |
| `dataset_test_case_id=` (`hub.tasks.create`)   | `dataset_scenario_id=`                       |
| `set_test_case_status=` (`hub.tasks.update`)   | `set_scenario_status=`                       |
| `result.test_case` / `result.test_case_exists` | `result.scenario` / `result.scenario_exists` |

The legacy flat scenario shape (`messages=`, `checks=`, `demo_output=`) is also deprecated in favour of `interactions=`. See [chat-shaped arguments](#deprecated-chat-shaped-arguments-become-structured-inputoutput) above for the mapping.

In audit logs, the endpoint accepts `entity_type="scenario"` and `"scenario_evaluation"`, while stored events keep the values `"test_case"` and `"test_case_evaluation"` in search results.

---

## Deprecated: project scenarios renamed to prompt presets

The project-level "Scenarios" (persona and behaviour templates) are now **Prompt Presets**. The old Hub endpoints were removed, which is why SDK 3.1.x breaks against Hub v3. In SDK 3.2, the old methods still work against the new endpoints with a `DeprecationWarning`:

| Deprecated (still works)                             | Use instead                                             |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `hub.projects.scenarios.*`                           | `hub.projects.prompt_presets.*`                         |
| `hub.datasets.generate_scenario_based(scenario_id=)` | `hub.datasets.generate_preset_based(prompt_preset_id=)` |

```python
# Hub v2 (SDK 3.1)
dataset = hub.datasets.generate_scenario_based(
    project_id=project_id,
    agent_id=agent_id,
    scenario_id=scenario_id,
    dataset_name="Generated suite",
    n_examples=10,
)

# Hub v3 (SDK 3.2)
dataset = hub.datasets.generate_preset_based(
    project_id=project_id,
    agent_id=agent_id,
    prompt_preset_id=prompt_preset_id,
    dataset_name="Generated suite",
    n_examples=10,
)
```

`types.Scenario` now means the dataset item (formerly the test case). The prompt preset types are `PromptPreset` and `PromptPresetPreview`. The `DatasetGenerateScenarioBasedParams` type is removed, import `DatasetGeneratePresetBasedParams` instead.

See [Projects & Prompt Presets](/hub/sdk/guides/projects#prompt-presets) for the new API.

---

## Fixing a broken CI pipeline

If your CI started failing after the Hub upgrade, work through this checklist:

1. **Pin the SDK to 3.2.0 or later** in your requirements.
2. **Search your scripts for old check identifiers** (`correctness`, `metadata`, `string_match`, `regex_match`) and replace them with the new names from the table above.
3. **Check every `conformity` and `groundedness` usage.** If it passes `rules=` or a fixed `context=` for the Hub behaviour, rename it to `hub_conformity` / `hub_groundedness`.
4. **Update uploaded dataset files** (`hub.datasets.upload()` JSON/JSONL): the records may keep the legacy shape, but the identifiers inside `checks` must be the new ones.
5. Treat any remaining `UnprocessableEntityError` (422) as a validation message from the Hub. The error body names the rejected identifier or param and often suggests the correct check.
