---
title: Agents & Knowledge Bases
description: Register agents, manage knowledge bases, and use them together for evaluations, dataset generation, and vulnerability scans.
sidebar:
  order: 2
---

## Agents

An **Agent** is your LLM application. The Hub calls your agent's HTTP endpoint during evaluations and scans.

### Register a remote agent

```python
from giskard_hub import HubClient

hub = HubClient()

agent = hub.agents.create(
    project_id="project-id",
    name="Support Bot v2",
    description="GPT-4o chatbot with RAG over the product knowledge base",
    url="https://your-app.example.com/api/chat",
    supported_languages=["en", "fr"],
    headers={"Authorization": "Bearer <token>"},
)

print(agent.id)
```

The Hub sends a POST request to `url` with a JSON body containing a `messages` array. Your endpoint must return a JSON object with a `message` field.

**Request format** (sent by the Hub to your agent):

```json
{
  "messages": [
    { "role": "user", "content": "What is your return policy?" },
    { "role": "assistant", "content": "We offer a 30-day return policy." },
    { "role": "user", "content": "Does that apply to sale items?" }
  ]
}
```

**Response format** (expected from your agent):

```json
{
  "response": {
    "role": "assistant",
    "content": "Sale items can be returned within 14 days."
  },
  "metadata": {
    "category": "returns",
    "tools_called": ["policy_lookup"]
  }
}
```

The `metadata` field is optional. If returned, it can be validated using `metadata` checks (see [Datasets & Checks](/hub/sdk/guides/datasets-and-checks#metadata)).

### Test the connection

Before running an evaluation, verify your agent endpoint is reachable and responds correctly:

```python
ping = hub.agents.test_connection(
    url="https://your-app.example.com/api/chat",
    headers={"Authorization": "Bearer <token>"},
)

print(ping.response)
```

### Generate a completion

You can invoke a registered agent directly from the SDK without running a full evaluation:

```python
output = hub.agents.generate_completion(
    "agent-id",
    messages=[
        {"role": "user", "content": "What is the capital of France?"},
    ],
)

print(output.response)
print(output.metadata)  # any metadata returned by your agent
```

### Auto-generate a description

If your agent's description is missing or stale, the Hub can generate one by observing how the agent behaves:

```python
description = hub.agents.generate_description("agent-id")
hub.agents.update("agent-id", description=description)
```

### Using a local Python function as an agent

For evaluations where you don't want to expose an HTTP endpoint — for example, when evaluating a model locally during development — pass a Python callable to `hub.helpers.evaluate()`. See [Evaluations](/hub/sdk/guides/evaluations#local-evaluations) for details.

### List, update, and delete agents

```python
agents = hub.agents.list(project_id="project-id")

hub.agents.update("agent-id", name="Support Bot v2.1")

hub.agents.delete("agent-id")
```

---

## Knowledge Bases

A **Knowledge Base** is an indexed collection of text documents. It has three primary uses in the Hub:

1. **Document-based dataset generation** — the Hub uses your documents as source material to auto-generate realistic test cases.
2. **Grounded vulnerability scans** — probes are anchored to your actual content, making attacks more realistic and specific to your domain.
3. **Groundedness check context** — retrieve relevant documents via `hub.knowledge_bases.search_documents()` and pass them as the `context` field of a `groundedness` check assertion to verify that your agent's responses are grounded in your actual documents rather than hallucinated content.

## Create a knowledge base

Documents are provided as a JSON or JSONL file where each record has a `text` field and an optional `topic` field.

### From a Python list (in-memory)

```python
documents = [
    {
        "text": "Our return policy allows returns within 30 days of purchase.",
        "topic": "Returns",
    },
    {
        "text": "Free shipping is available on all orders over $50.",
        "topic": "Shipping",
    },
    {
        "text": "You can track your order via the link in your confirmation email.",
        "topic": "Shipping",
    },
]

kb = hub.knowledge_bases.create(
    project_id="project-id",
    name="Product Documentation",
    description="Official product docs and FAQs",
    data=documents,
)

print(kb.id)
```

### From a file on disk

```python
kb = hub.knowledge_bases.create(
    project_id="project-id",
    name="Product Documentation",
    description="Official product docs and FAQs",
    data="documents.json",
)
```

:::note
After creation, the Hub indexes the documents asynchronously. Wait for the indexing to complete before using the KB for generation or scanning:
:::

```python
kb = hub.helpers.wait_for_completion(kb)
print(f"Knowledge base ready: {kb.state}")  # "finished"
```

## Retrieve and update a knowledge base

```python
kb = hub.knowledge_bases.retrieve("kb-id")
print(kb.name, kb.state)

hub.knowledge_bases.update("kb-id", name="Updated Name")
```

## Search documents

You can perform a semantic search over the documents in a knowledge base directly from the SDK:

```python
results = hub.knowledge_bases.search_documents(
    "kb-id",
    query="return policy",
    limit=5,
)

for doc in results:
    print(doc.snippet)
```

## Retrieve a specific document

```python
doc = hub.knowledge_bases.retrieve_document("kb-id", "document-id")
print(doc.content)
```

## List and delete knowledge bases

```python
kbs = hub.knowledge_bases.list(project_id="project-id")

hub.knowledge_bases.delete("kb-id")
```

---

## Using a knowledge base for dataset generation

Once your KB is ready, pass its ID to `hub.datasets.generate_document_based()` to create test cases grounded in your documents:

```python
dataset = hub.datasets.generate_document_based(
    project_id="project-id",
    knowledge_base_id="kb-id",
    agent_id="agent-id",
    dataset_name="FAQ-based test suite",
    n_examples=20,
)

print(f"Generated dataset: {dataset.id} ({dataset.name})")
```

The Hub samples documents from the KB, crafts questions whose answers are grounded in those documents, and creates test cases with a `groundedness` check pre-configured.

See [Datasets & Checks](/hub/sdk/guides/datasets-and-checks#generate-document-based-test-cases) for more detail.

---

## Using a knowledge base in a vulnerability scan

Pass a `knowledge_base_id` when creating a scan to run probes that are grounded in your documents. This makes adversarial attacks more domain-specific and increases detection accuracy for RAG-based systems:

```python
scan = hub.scans.create(
    project_id="project-id",
    agent_id="agent-id",
    knowledge_base_id="kb-id",
    tags=["gsk:threat-type='hallucination'"],  # Hallucination
)
```

See [Vulnerability Scanning](/hub/sdk/guides/scans) for the full list of tags and scan options.
