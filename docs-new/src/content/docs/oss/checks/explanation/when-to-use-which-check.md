---
title: When to use which check
sidebar:
  order: 2
---

Three check families cover most use cases. Pick the simplest one that can express your requirement.

## Tradeoffs at a Glance

|  | Rule-based | Semantic similarity | LLM-as-judge |
| --- | --- | --- | --- |
| **Examples** | `Equals`, `StringMatching`, `FnCheck` | `SemanticSimilarity` | `Groundedness`, `Conformity`, `LLMJudge` |
| **Cost** | Free | Low (embedding call) | Medium–High (LLM call) |
| **Latency** | <1 ms | ~50–200 ms | ~1–10 s |
| **Deterministic** | Yes | Near-deterministic | No |
| **Best for** | Exact values, keywords, formats | Meaning-equivalent answers | Tone, reasoning, policy compliance |

## Choosing the Right Check

**Rule-based** — when you can express the pass condition as a predicate: required keywords, value ranges, exact labels. Use these first; they're free, instant, and never flaky.

```python
Equals(expected_value="potential_fraud", key="trace.last.outputs.label")
StringMatching(
    keyword="Pre-authorization", text_key="trace.last.outputs.answer"
)
LesserThan(expected_value=500, key="trace.last.outputs.token_count")
```

**Semantic similarity** — when phrasing varies but meaning should be consistent. Cheaper and faster than an LLM judge.

```python
SemanticSimilarity(
    reference_text="The capital of France is Paris.",
    actual_answer_key="trace.last.outputs",
    threshold=0.85,
)
```

**LLM-as-judge** — when the criterion is qualitative and hard to express as a rule: tone, groundedness, policy compliance, reasoning quality.

```python
Groundedness(
    answer_key="trace.last.outputs.answer",
    context_key="trace.last.outputs.context",
)
Conformity(rule="Response must not give medical advice")
```

## Combining Check Types

Layer all three in a single scenario: run the cheap deterministic checks first, and only reach for LLM judges when you genuinely need them.

```python
from giskard.checks import Scenario, StringMatching, GreaterThan, Groundedness

question = "What is the refund policy?"


def rag_system(query: str) -> dict:
    # Your RAG system
    return {
        "answer": "Refunds are processed within 5 business days.",
        "context": "Policy §3.2",
        "confidence": 0.9,
    }


tc = (
    Scenario("rag_test")
    .interact(inputs=question, outputs=lambda q: rag_system(q))
    # Fast, free
    .check(
        GreaterThan(
            name="has_confidence",
            key="trace.last.outputs.confidence",
            expected_value=0.5,
        )
    )
    .check(
        StringMatching(
            name="cites_policy",
            keyword="policy",
            text_key="trace.last.outputs.answer",
        )
    )
    # Slower, costs a few cents
    .check(
        Groundedness(
            name="grounded",
            answer_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.context",
        )
    )
)
```
