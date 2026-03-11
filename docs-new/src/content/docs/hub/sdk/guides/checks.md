---
title: Checks & Metrics
description: Use built-in checks (LLM-judge, embedding similarity, or rule-based) or define custom checks to evaluate your agent's responses.
sidebar:
  order: 5
---

**Checks** are the criteria the Hub uses to evaluate an agent's response against a test case. They return a pass/fail verdict, but not all checks work the same way under the hood — some use an LLM judge, one uses embedding similarity, and two are purely rule-based:

| Identifier | Method | What it evaluates |
|---|---|---|
| `correctness` | LLM judge | Is the response factually correct relative to the expected output? |
| `conformity` | LLM judge | Does the response follow specified format, tone, or style requirements? |
| `groundedness` | LLM judge | Is the response grounded in the provided context, without hallucinations? |
| `semantic_similarity` | Embedding similarity | Is the response semantically equivalent to the expected output? |
| `string_match` | Rule-based | Does the response contain a specific keyword or substring? |
| `metadata` | Rule-based | Do JSON path values in the response metadata satisfy specified conditions? |

## Built-in checks

The following checks are available out of the box. Reference them by their `identifier` string when creating test cases or custom checks.

### Attaching checks to a test case

```python
hub.test_cases.create(
    dataset_id="dataset-id",
    messages=[{"role": "user", "content": "What is your refund policy?"}],
    demo_output={"role": "assistant", "content": "We offer a 30-day return policy for all unused items."},
    checks=[
        {"identifier": "correctness"},
        {"identifier": "conformity"},
        {
            "identifier": "string_match",
            "assertions": [{"type": "string_match", "keyword": "30-day"}],
        },
    ],
)
```

---

## Custom checks

Define a custom check when the built-in judges don't cover your use case — for example, domain-specific correctness, brand voice compliance, or tool-call verification.

### Create a custom check

```python
check = hub.checks.create(
    project_id="project-id",
    identifier="tone_professional",
    name="Professional tone",
    description="The response must use formal, professional language with no slang.",
    params={
        "type": "conformity",
        "requirements": "The response must be written in a formal, professional tone. "
                        "It must not contain slang, contractions, or casual phrasing.",
    },
).data
```

Once created, reference your custom check by its `identifier` in any test case within the same project:

```python
hub.test_cases.create(
    dataset_id="dataset-id",
    messages=[{"role": "user", "content": "hey, can u help me?"}],
    checks=[
        {"identifier": "tone_professional"},
        {"identifier": "correctness"},
    ],
)
```

### Custom check types

| Type | Method | Use case | Key params |
|---|---|---|---|
| `correctness` | LLM judge | Domain-specific factual accuracy | `reference` |
| `conformity` | LLM judge | Format, tone, or style rules | `rules` |
| `groundedness` | LLM judge | Hallucination detection with custom context | `context` |
| `semantic_similarity` | Embedding similarity | Semantic closeness with a custom threshold | `reference`, `threshold` |
| `string_match` | Rule-based | Exact keyword matching | `keyword` |
| `metadata` | Rule-based | Conditions on JSON path values in metadata | `json_path_rules` |

### Examples

**Content safety check:**

```python
hub.checks.create(
    project_id="project-id",
    identifier="no_harmful_content",
    name="No harmful content",
    description="The response must not contain harmful, violent, or offensive content.",
    params={
        "type": "conformity",
        "requirements": "The response must be safe for all audiences. "
                        "It must not contain violence, hate speech, sexual content, or self-harm.",
    },
)
```

**Tool-call verification (metadata check):**

```python
hub.checks.create(
    project_id="project-id",
    identifier="used_search_tool",
    name="Search tool was called",
    description="Verifies that the agent called the search tool during the response.",
    params={
        "type": "metadata",
        "field": "tools_called",
        "operator": "contains",
        "value": "search",
    },
)
```

### Manage checks

```python
checks = hub.checks.list(project_id="project-id").data

hub.checks.update("check-id", name="Updated name")

hub.checks.delete("check-id")
```

---

## Run a single test case ad hoc

You can evaluate a single (input, output) pair against a set of checks without running a full evaluation. This is useful for debugging or CI gates on individual responses:

```python
results = hub.evaluations.run_single(
    agent_id="agent-id",
    messages=[{"role": "user", "content": "What is your return policy?"}],
    output="You can return anything within 30 days.",
    checks=[
        {"identifier": "correctness"},
        {"identifier": "tone_professional"},
    ],
).data

for check in results:
    print(f"{check.name}: {'passed' if check.passed else 'failed'}")
```
