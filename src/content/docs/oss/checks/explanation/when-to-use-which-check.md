---
title: When to use which check
description: "Compare rule-based checks, semantic similarity, and LLM-as-a-judge — tradeoffs in cost, latency, determinism, and reliability."
sidebar:
  order: 2
---

A check is a rule your agent's answer has to satisfy for the test to pass. Three families of check cover most use cases. Pick the simplest one that can express your requirement: an LLM judge can express anything, but it costs an API call per verdict and is sometimes wrong.

## Tradeoffs at a Glance

|                   | Rule-based                            | Semantic similarity        | LLM-as-judge                             |
| ----------------- | ------------------------------------- | -------------------------- | ---------------------------------------- |
| **Examples**      | `Equals`, `StringMatching`, `FnCheck` | `SemanticSimilarity`       | `Groundedness`, `Conformity`, `LLMJudge` |
| **Cost**          | Free                                  | Low (embedding call)       | Medium–High (LLM call)                   |
| **Latency**       | <1 ms                                 | ~50–200 ms                 | ~1–10 s                                  |
| **Deterministic** | Yes                                   | Near-deterministic         | No                                       |
| **Best for**      | Exact values, keywords, formats       | Meaning-equivalent answers | Tone, reasoning, policy compliance       |

## Choosing the Right Check

**Rule-based** — when you can express the pass condition as a predicate: required keywords, value ranges, exact labels. Use these first; they're free, instant, and never flaky.

```python
from giskard.checks import (
    Conformity,
    Equals,
    Groundedness,
    LessThan,
    SemanticSimilarity,
    StringMatching,
)

Equals(expected_value="potential_fraud", target_key="trace.last.outputs.label")
StringMatching(
    keyword="Pre-authorization", target_key="trace.last.outputs.answer"
)
LessThan(expected_value=500, target_key="trace.last.outputs.token_count")
```

**Semantic similarity** — when phrasing varies but meaning should be consistent. Cheaper and faster than an LLM judge.

```python
SemanticSimilarity(
    reference_text="The capital of France is Paris.",
    target_key="trace.last.outputs",
    threshold=0.85,
)
```

**LLM-as-judge** — when the criterion is qualitative and hard to express as a rule: tone, groundedness (whether the answer is supported by the documents you retrieved), policy compliance, reasoning quality. The judge is an LLM, so read failing verdicts before you trust them.

```python
Groundedness(
    target_key="trace.last.outputs.answer",
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
            target_key="trace.last.outputs.confidence",
            expected_value=0.5,
        )
    )
    .check(
        StringMatching(
            name="cites_policy",
            keyword="policy",
            target_key="trace.last.outputs.answer",
        )
    )
    # Slower, costs a few cents
    .check(
        Groundedness(
            name="grounded",
            target_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.context",
        )
    )
)
```

## Common questions

**When should you use a rule-based check?**
When you can write the pass condition as ordinary Python: a required keyword, a value range, an exact label. Rule-based checks are free, run in under a millisecond, and give the same verdict every time. `Equals`, `StringMatching`, and `FnCheck` are examples; see the [Checks reference](/oss/checks/reference/checks) for the full list.

**When should you use semantic similarity instead of an LLM judge?**
When the wording of a correct answer can vary but the meaning should not. `SemanticSimilarity` converts the answer and a reference text into vectors and compares them, so "Paris is the capital of France" matches "The capital of France is Paris". One embedding call takes roughly 50-200 ms and costs far less than an LLM judge, and the result barely changes between runs. It only measures similarity of meaning, so it cannot tell you whether an answer is polite, safe, or supported by your documents.

**When should you use an LLM-as-judge check?**
When the rule is qualitative and cannot be written as code: tone, whether the answer is supported by the retrieved documents, whether it follows a policy, whether the reasoning holds up. `Groundedness`, `Conformity`, and `LLMJudge` cover these. Each verdict costs one LLM call and takes roughly 1-10 seconds.

**Can you combine several checks in one test?**
Yes. A scenario takes any number of checks, and every one has to pass for the scenario to pass. Order them by cost: rule-based first, then semantic similarity, then the LLM judges. A cheap check that fails often tells you what went wrong without paying for an LLM call.

**Are LLM-as-judge results reliable, and does a passing suite mean the application is safe?**
No on both counts. The judge is a language model: it can pass an answer it should have failed, and it can return different verdicts on identical input across runs. And a passing suite only means the cases you wrote did not break your application. Treat verdicts as evidence to read, and treat the suite as a guard against known regressions rather than proof of safety or a compliance certificate.
