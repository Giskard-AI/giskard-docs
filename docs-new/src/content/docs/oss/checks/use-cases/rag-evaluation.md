---
title: RAG Evaluation
sidebar:
  order: 1
---

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Giskard-AI/giskard-docs/blob/main/docs-new/src/content/docs/oss/checks/use-cases/rag-evaluation.ipynb)

This example walks through building a comprehensive test suite for a
Retrieval-Augmented Generation (RAG) system.

## Introduction

We'll test a RAG system that answers questions by:

1.  Retrieving relevant context from a knowledge base
2.  Generating an answer grounded in that context
3.  Handling out-of-scope questions appropriately

Our test suite will validate:

- **Retrieval quality**: Are the retrieved documents relevant?
- **Groundedness**: Is the answer based on the retrieved context?
- **Answer quality**: Is the answer accurate and complete?
- **Handling edge cases**: Out-of-scope questions, empty queries, etc.

## Building the RAG System

To get started, we'll implement a minimal RAG pipeline whose public interface
mirrors what a production system would expose — a single `answer()` method that
returns both the generated answer and the retrieved documents. Returning this
rich `RAGResponse` object lets our checks inspect retrieval quality
independently of answer quality.

First, let's create a simple RAG system to test:

```python
from typing import List
from pydantic import BaseModel


class Document(BaseModel):
    content: str
    metadata: dict


class RAGResponse(BaseModel):
    question: str
    answer: str
    retrieved_docs: List[Document]
    confidence: float


class SimpleRAG:
    def __init__(self, documents: List[Document]):
        self.documents = documents

    def retrieve(self, query: str, top_k: int = 3) -> List[Document]:
        """Retrieve relevant documents (simplified similarity)."""
        # In practice, use embeddings and vector search
        query_lower = query.lower()
        scored_docs = []

        for doc in self.documents:
            score = sum(
                word in doc.content.lower() for word in query_lower.split()
            )
            if score > 0:
                scored_docs.append((score, doc))

        scored_docs.sort(reverse=True, key=lambda x: x[0])
        return [doc for _, doc in scored_docs[:top_k]]

    def generate_answer(
        self, question: str, context_docs: List[Document]
    ) -> str:
        """Generate answer from context (in practice, use LLM)."""
        if not context_docs:
            return "I don't have enough information to answer that question."

        # Simplified: just return relevant content
        # In practice, use an LLM to synthesize an answer
        context_text = "\n".join(doc.content for doc in context_docs)
        return f"Based on the available information: {context_text[:200]}..."

    def answer(self, question: str) -> RAGResponse:
        """Main RAG pipeline."""
        if not question.strip():
            return RAGResponse(
                question=question,
                answer="Please provide a valid question.",
                retrieved_docs=[],
                confidence=0.0,
            )

        # Retrieve
        docs = self.retrieve(question)

        # Generate
        answer = self.generate_answer(question, docs)

        # Estimate confidence based on retrieval quality
        confidence = min(1.0, len(docs) / 3.0)

        return RAGResponse(
            question=question,
            answer=answer,
            retrieved_docs=docs,
            confidence=confidence,
        )
```

## Setting Up Test Data

With the RAG system defined, we need a controlled knowledge base to test
against. Using a small, deterministic set of documents means we know exactly
which facts should be retrievable — making it straightforward to assert on both
retrieval hits and misses.

Create a knowledge base for testing:

```python
knowledge_base = [
    Document(
        content=(
            "Paris is the capital and largest city of France. "
            "It is known for the Eiffel Tower."
        ),
        metadata={"source": "geography", "topic": "France"},
    ),
    Document(
        content=(
            "The Eiffel Tower is a wrought-iron lattice tower in Paris. "
            "It was completed in 1889."
        ),
        metadata={"source": "landmarks", "topic": "Eiffel Tower"},
    ),
    Document(
        content=(
            "France is a country in Western Europe. "
            "It has a population of about 67 million."
        ),
        metadata={"source": "geography", "topic": "France"},
    ),
    Document(
        content=(
            "Python is a high-level programming language. "
            "It was created by Guido van Rossum."
        ),
        metadata={"source": "technology", "topic": "Python"},
    ),
    Document(
        content=(
            "Machine learning is a subset of artificial intelligence "
            "focused on data-driven learning."
        ),
        metadata={"source": "technology", "topic": "AI"},
    ),
]

rag = SimpleRAG(documents=knowledge_base)
```

## Test 1: Basic Question Answering

With the test data in place, we can now write our first scenario. This test
stacks three checks on a single interaction — content, retrieval presence, and
confidence — so a single run tells you whether the pipeline is working
end-to-end.

Test that the system answers questions correctly:

```python
from giskard.agents.generators import Generator
from giskard.checks import (
    Scenario,
    StringMatching,
    Equals,
    from_fn,
    set_default_generator,
)

# Configure LLM for checks
set_default_generator(Generator(model="openai/gpt-5-mini"))


async def test_basic_qa():
    tc = (
        Scenario("basic_qa_france_capital").interact(
            inputs="What is the capital of France?",
            outputs=lambda inputs: rag.answer(inputs),
        )
        # Check that answer mentions Paris
        .check(
            StringMatching(
                name="mentions_paris",
                keyword="Paris",
                text_key="trace.last.outputs.answer",
            )
        )
        # Check that documents were retrieved
        .check(
            from_fn(
                lambda trace: len(trace.last.outputs.retrieved_docs) > 0,
                name="retrieved_documents",
                success_message="Retrieved relevant documents",
                failure_message="No documents retrieved",
            )
        )
        # Check confidence is reasonable
        .check(
            from_fn(
                lambda trace: trace.last.outputs.confidence > 0.5,
                name="confident_answer",
                success_message="High confidence answer",
                failure_message="Low confidence answer",
            )
        )
    )
    result = await tc.run()

    print(f"Test passed: {result.passed}")
    for check_result in result.results:
        print(f"  {check_result.name}: {check_result.status.value}")


# Run the test
import asyncio

asyncio.run(test_basic_qa())
```

## Test 2: Groundedness Check

Building on Test 1, we now verify that the answer doesn't introduce facts absent
from the retrieved documents. The `Groundedness` check uses an LLM to compare
the answer against the context, catching hallucinations that `StringMatching`
would miss.

Verify that answers are grounded in retrieved context:

```python
from giskard.checks import Scenario, Groundedness, StringMatching


async def test_groundedness():
    tc = (
        Scenario("groundedness_eiffel_tower")
        .interact(
            inputs="When was the Eiffel Tower completed?",
            outputs=lambda inputs: rag.answer(inputs),
        )
        .check(
            Groundedness(
                name="answer_grounded",
                answer_key="trace.last.outputs.answer",
                context_key="trace.last.outputs.retrieved_docs",
            )
        )
        .check(
            StringMatching(
                name="mentions_year",
                keyword="1889",
                text_key="trace.last.outputs.answer",
            )
        )
    )
    result = await tc.run()
    assert result.passed
```

## Test 3: Retrieval Quality

Next, we'll isolate retrieval from generation and verify that the documents
returned for a query are topically relevant. This separation matters because a
failure in retrieval will silently produce a low-confidence or hallucinated
answer — and this test lets you catch that upstream.

Test that the right documents are retrieved:

```python
from giskard.checks import Scenario, from_fn


def check_retrieved_topics(trace) -> bool:
    """Verify retrieved docs are about the right topic."""
    docs = trace.last.outputs.retrieved_docs
    topics = [doc.metadata.get("topic") for doc in docs]
    return "Eiffel Tower" in topics or "France" in topics


tc = (
    Scenario("retrieval_quality")
    .interact(
        inputs="Tell me about the Eiffel Tower",
        outputs=lambda inputs: rag.answer(inputs),
    )
    .check(
        from_fn(
            lambda trace: len(trace.last.outputs.retrieved_docs) >= 2,
            name="sufficient_context",
            success_message="Retrieved multiple documents",
            failure_message="Not enough documents retrieved",
        )
    )
    .check(
        from_fn(
            check_retrieved_topics,
            name="relevant_topics",
            success_message="Retrieved documents are topically relevant",
            failure_message="Retrieved documents are off-topic",
        )
    )
)
```

## Test 4: Out-of-Scope Questions

Now we'll verify the system's failure mode. A well-behaved RAG pipeline should
return zero documents and a graceful fallback message when no relevant content
exists — not a hallucinated answer that sounds plausible.

Test how the system handles questions it can't answer:

```python
from giskard.checks import Scenario, LLMJudge, from_fn

tc = (
    Scenario("out_of_scope_handling")
    .interact(
        inputs="What is the weather in Tokyo today?",
        outputs=lambda inputs: rag.answer(inputs),
    )
    .check(
        from_fn(
            lambda trace: len(trace.last.outputs.retrieved_docs) == 0,
            name="no_irrelevant_docs",
            success_message="Correctly retrieved no documents",
            failure_message="Retrieved documents for out-of-scope question",
        )
    )
    .check(
        LLMJudge(
            name="appropriate_fallback",
            prompt="""
            Evaluate if the system appropriately indicates it cannot answer.

            Question: {{ inputs }}
            Answer: {{ outputs.answer }}

            The answer should politely indicate insufficient information.
            Return 'passed: true' if appropriate, 'passed: false' if it makes up an answer.
            """,
        )
    )
)
```

## Test 5: Answer Quality with LLM Judge

With structural and retrieval checks in place, we can now add a holistic quality
evaluation. `LLMJudge` is the right tool here because "answer quality" is a
composite signal — accuracy, completeness, clarity, and relevance — that no
single keyword or numeric threshold can capture.

Use an LLM to evaluate answer quality comprehensively:

```python
from giskard.checks import Scenario, LLMJudge

tc = (
    Scenario("comprehensive_quality_check")
    .interact(
        inputs="What is machine learning?",
        outputs=lambda inputs: rag.answer(inputs),
    )
    .check(
        LLMJudge(
            name="answer_quality",
            prompt="""
            Evaluate the answer quality based on these criteria:

            Question: {{ inputs }}
            Answer: {{ outputs.answer }}
            Retrieved Context: {{ outputs.retrieved_docs }}

            Criteria:
            1. Accuracy: Is the answer factually correct?
            2. Completeness: Does it fully address the question?
            3. Clarity: Is it well-written and understandable?
            4. Relevance: Does it stay on topic?

            Return 'passed: true' if the answer meets all criteria.
            Provide brief reasoning.
            """,
        )
    )
)
```

## Test 6: Multi-Turn Conversational RAG

Next, we'll extend the RAG system to handle conversational follow-ups. This test
uses two `.interact()` calls in the same scenario so the trace records both
turns, letting the `LLMJudge` check verify that the second answer correctly
resolves the pronoun reference from the first.

Test a conversational RAG that handles follow-up questions:

```python
from giskard.checks import (
    Scenario,
    Groundedness,
    from_fn,
    LLMJudge,
    StringMatching,
)


class ConversationalRAG(SimpleRAG):
    def __init__(self, documents):
        super().__init__(documents)
        self.conversation_history = []

    def answer(self, question: str) -> RAGResponse:
        # Resolve references using conversation history
        resolved_question = self._resolve_references(
            question, self.conversation_history
        )

        response = super().answer(resolved_question)

        self.conversation_history.append(
            {
                "question": question,
                "resolved_question": resolved_question,
                "answer": response.answer,
            }
        )

        return response

    def _resolve_references(self, question: str, history: list) -> str:
        """Resolve pronouns and references in follow-up questions."""
        # Simplified: in practice, use LLM for coreference resolution
        if history and ("it" in question.lower() or "its" in question.lower()):
            # Get the topic from previous question
            prev_question = history[-1]["resolved_question"]
            return f"{question} (referring to: {prev_question})"
        return question


conv_rag = ConversationalRAG(documents=knowledge_base)

test_scenario = (
    Scenario("conversational_rag_flow")
    # First question
    .interact(
        inputs="What is the capital of France?",
        outputs=lambda inputs: conv_rag.answer(inputs),
    )
    .check(
        Groundedness(
            name="first_answer_grounded",
            answer_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.retrieved_docs",
        )
    )
    .check(
        StringMatching(
            name="first_mentions_paris",
            keyword="Paris",
            text_key="trace.last.outputs.answer",
        )
    )
    # Follow-up question with reference
    .interact(
        inputs="What is it known for?",
        outputs=lambda inputs: conv_rag.answer(inputs),
    )
    .check(
        Groundedness(
            name="followup_grounded",
            answer_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.retrieved_docs",
        )
    )
    .check(
        LLMJudge(
            name="resolves_reference",
            prompt="""
            Check if the answer appropriately addresses the follow-up question
            in the context of the conversation.

            First Q: {{ interactions[0].inputs }}
            First A: {{ interactions[0].outputs.answer }}
            Follow-up Q: {{ interactions[1].inputs }}
            Follow-up A: {{ interactions[1].outputs.answer }}

            The follow-up should discuss what Paris is known for.
            Return 'passed: true' if the context was maintained correctly.
            """,
        )
    )
)


async def test_conversational_rag():
    result = await test_scenario.run()
    print(f"Conversational RAG test passed: {result.passed}")
```

## Complete Test Suite

Now we'll bring all the individual tests together into a single suite class.
Organizing tests into `_create_qa_tests`, `_create_groundedness_tests`, and
`_create_edge_case_tests` methods keeps each concern separate and makes it easy
to run only one category during development.

Combine all tests into a comprehensive suite:

```python
import asyncio
from typing import List
from giskard.checks import Scenario


class RAGTestSuite:
    def __init__(self, rag_system: SimpleRAG):
        self.rag = rag_system
        self.test_cases = []
        self._build_test_cases()

    def _build_test_cases(self):
        """Build all test cases."""
        # Add basic QA tests
        self.test_cases.extend(self._create_qa_tests())

        # Add groundedness tests
        self.test_cases.extend(self._create_groundedness_tests())

        # Add edge case tests
        self.test_cases.extend(self._create_edge_case_tests())

    def _create_qa_tests(self) -> List[Scenario]:
        """Create basic QA test cases."""
        test_data = [
            ("What is the capital of France?", "Paris"),
            ("When was the Eiffel Tower completed?", "1889"),
            ("What is Python?", "programming language"),
        ]

        tests = []
        for question, expected_content in test_data:
            tc = (
                Scenario(f"qa_{expected_content.replace(' ', '_')}")
                .interact(inputs=question, outputs=lambda q: self.rag.answer(q))
                .check(
                    StringMatching(
                        name=f"contains_{expected_content}",
                        keyword=expected_content,
                        text_key="trace.last.outputs.answer",
                    )
                )
                .check(
                    from_fn(
                        lambda trace: (
                            len(trace.last.outputs.retrieved_docs) > 0
                        ),
                        name="has_context",
                    )
                )
            )
            tests.append(tc)

        return tests

    def _create_groundedness_tests(self) -> List[Scenario]:
        """Create groundedness test cases."""
        questions = [
            "What is the capital of France?",
            "Tell me about the Eiffel Tower",
            "What is machine learning?",
        ]

        tests = []
        for question in questions:
            tc = (
                Scenario(f"groundedness_{question[:20]}")
                .interact(inputs=question, outputs=lambda q: self.rag.answer(q))
                .check(
                    Groundedness(
                        name="grounded",
                        answer_key="trace.last.outputs.answer",
                        context_key="trace.last.outputs.retrieved_docs",
                    )
                )
            )
            tests.append(tc)

        return tests

    def _create_edge_case_tests(self) -> List[Scenario]:
        """Create edge case test cases."""
        edge_cases = [
            ("", "empty_query"),
            ("   ", "whitespace_query"),
            ("What is the weather in Tokyo?", "out_of_scope"),
            ("askdjhaksjdhaksjdh", "gibberish"),
        ]

        tests = []
        for question, case_name in edge_cases:
            tc = (
                Scenario(f"edge_case_{case_name}")
                .interact(inputs=question, outputs=lambda q: self.rag.answer(q))
                .check(
                    from_fn(
                        lambda trace: trace.last.outputs.answer,
                        name="provides_response",
                        success_message="System provided a response",
                    )
                )
            )
            tests.append(tc)

        return tests

    async def run_all(self):
        """Run all tests and report results."""
        results = []

        for tc in self.test_cases:
            result = await tc.run()
            results.append((tc.name, result))

        # Summary
        passed = sum(1 for _, r in results if r.passed)
        total = len(results)

        pct = passed / total * 100
        print(f"\nTest Suite Results: {passed}/{total} passed ({pct:.1f}%)")
        print("\nDetailed Results:")

        for name, result in results:
            status = "✓" if result.passed else "✗"
            print(f"  {status} {name}")
            if not result.passed:
                for check_result in result.results:
                    if not check_result.passed:
                        print(
                            f"      - {check_result.name}: "
                            f"{check_result.message}"
                        )

        return results


# Run the complete suite
async def main():
    suite = RAGTestSuite(rag)
    await suite.run_all()


asyncio.run(main())
```

## Best Practices for RAG Testing

With the suite pattern established, here are a few guidelines that will save you
time as your RAG system evolves.

**1. Test Retrieval Separately**

Validate retrieval quality before testing end-to-end:

```python
def test_retrieval_precision():
    docs = rag.retrieve("Eiffel Tower")
    relevant_topics = ["Eiffel Tower", "France", "Paris"]
    assert all(
        any(topic in doc.metadata.get("topic", "") for topic in relevant_topics)
        for doc in docs
    )
```

**2. Use Representative Test Data**

Include diverse question types:

- Factual questions
- Definitional questions
- Comparison questions
- Out-of-scope questions
- Ambiguous questions

**3. Monitor Confidence Scores**

Track confidence metrics to identify problematic queries:

```python
checks = [
    from_fn(
        lambda trace: trace.last.outputs.confidence,
        name="track_confidence",
        success_message=lambda trace: (
            f"Confidence: {trace.last.outputs.confidence}"
        ),
    ),
]
```

**4. Test with Real User Queries**

Collect and test with actual user questions from logs.

## Next Steps

- See [Testing Agents](/oss/checks/use-cases/testing-agents/) for agent-specific
  testing patterns
- Explore [Chatbot Testing](/oss/checks/use-cases/chatbot-testing/) for
  conversational testing
- Review [Multi-Turn Scenarios](/oss/checks/tutorials/multi-turn/) for advanced
  scenarios
