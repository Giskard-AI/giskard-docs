---
title: "Hub SDK Core Concepts"
description: Understand the building blocks of the Giskard Hub SDK — Projects, Agents, Datasets, Evaluations, Scans, and more.
sidebar:
  order: 3
---

This page explains the mental model behind the Giskard Hub and how its resources relate to each other. Reading this before diving into the how-to guides will make everything click faster.

## The big picture

```
Project
├── Agents            (your agentic applications)
├── Knowledge Bases   (document collections)
├── Scans             (automated vulnerability probing)
├── Datasets          (scenario collections)
│   └── Scenarios     (individual interactions + checks)
├── Checks            (built-in and custom criteria)
├── Evaluations       (run an agent against a dataset)
│   └── Results       (per-scenario outcomes)
├── Scheduled Evaluations
└── Tasks             (issues and follow-up items)
```

Everything belongs to a **Project**. Projects are the organisational unit — your team can have one project per product, environment, or use case.

---

## Projects

A **Project** is a workspace that groups all related resources: agents, datasets, evaluations, and scans. It also holds **Prompt Presets** — reusable persona and behaviour templates used when auto-generating scenarios.

**SDK resource:** `hub.projects`, `hub.projects.prompt_presets`

---

## Agents

An **Agent** represents your agentic application, such as LLM-based chatbots or classification services. It can be:

- A **remote agent** — an HTTP endpoint that the Hub calls with a list of chat messages and expects a response from.
- A **local agent** — a Python function you pass directly when running a local evaluation. Useful for evaluating models without exposing an HTTP endpoint.

Agents are configured with a URL, HTTP headers (for authentication), and the list of supported languages.

**SDK resource:** `hub.agents`

---

## Knowledge Bases

A **Knowledge Base** is an indexed collection of documents. It has three primary uses:

1. **Document-based dataset generation** — the Hub uses the documents as source material to auto-generate realistic scenarios via `hub.datasets.generate_document_based()`.
2. **Grounded vulnerability scans** — when you create a scan with a `knowledge_base_id`, the probes are anchored to your actual document content, making attacks more realistic and specific.
3. **Groundedness check context** — retrieve relevant documents from the KB via `hub.knowledge_bases.search_documents()` and pass them as the `context` field of a `hub_groundedness` check assertion. This verifies that your agent's responses are grounded in your actual documents rather than hallucinated content.

Documents are stored as text chunks with optional topics/metadata.

**SDK resource:** `hub.knowledge_bases`

---

## Scans

A **Scan** runs automated vulnerability probes against an agent to detect security and safety issues. Giskard covers the [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) categories (Prompt Injection, Excessive Agency, Misinformation, …) as well as additional categories that go beyond the OWASP framework, such as Harmful Content Generation, Brand Damaging & Reputation, Legal & Financial Risk, and Misguidance & Unauthorized Advice. Each scan produces:

- **Probe Results** — grouped by vulnerability category.
- **Probe Attempts** — individual adversarial prompts and the agent's responses.
- A **Grade** (A–D) summarising the overall security posture.

Scans can optionally be anchored to a Knowledge Base to generate attacks that are specific to your document content.

**SDK resources:** `hub.scans`, `hub.scans.probes`, `hub.scans.attempts`

---

## Checks

A **Check** is a criterion evaluated on an agent's response. Checks belong to a project and can be reused across any dataset in that project. Not all checks use an LLM judge — some are purely rule-based:

| Identifier                             | How it evaluates     | What it checks                                                                        |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `hub_correctness`                      | LLM judge            | Does the response fully agree with the reference answer, with no omissions?           |
| `hub_conformity`                       | LLM judge            | Does the response comply with one or more business rules?                             |
| `hub_groundedness`                     | LLM judge            | Is the response grounded in the provided context (no hallucinations)?                 |
| `llm_judge`                            | LLM judge            | Evaluate the response with a custom LLM prompt that returns pass or fail with reason. |
| `conformity`                           | LLM judge            | Does the full trace conform to a single natural-language rule?                        |
| `groundedness`                         | LLM judge            | Is the answer grounded in context extracted from configurable trace paths?            |
| `contradiction`                        | LLM judge            | Does the response contradict a reference context?                                     |
| `toxicity`                             | LLM judge            | Does the response contain toxic, harmful, or offensive content?                       |
| `answer_relevance`                     | LLM judge            | Does the response directly address the user question?                                 |
| `semantic_similarity`                  | Embedding similarity | Is the response semantically close to a reference?                                    |
| `string_matching`                      | Rule-based           | Does the response contain a given keyword or sentence?                                |
| `regex_matching`                       | Rule-based           | Does the response match a regular expression pattern?                                 |
| `equals` / `not_equals`                | Rule-based           | Does a value extracted from the trace equal (or differ from) the expected value?      |
| `greater_than` / `greater_than_equals` | Rule-based           | Is a numeric trace value greater than (or equal to) the expected value?               |
| `less_than` / `less_than_equals`       | Rule-based           | Is a numeric trace value less than (or equal to) the expected value?                  |
| `hub_metadata`                         | Rule-based           | Do JSON path values in the response metadata meet specified conditions?               |
| `json_valid`                           | Rule-based           | Is an extracted value valid JSON, optionally conforming to a JSON Schema?             |
| `readability`                          | Rule-based           | Does the response meet readability score thresholds for a chosen metric?              |

You can also define **custom checks** via `hub.checks.create()` — a named, reusable configuration of any built-in check type with pre-set parameters, so you don't have to repeat them across scenarios.

**SDK resource:** `hub.checks`

---

## Datasets

A **Dataset** is a named collection of **Scenarios**. Datasets can be built in several ways:

- **Manually** — create scenarios one by one via `hub.scenarios.create()`, useful when you need precise, hand-crafted interactions.
- **From production logs** — import a JSONL or JSON file of recorded interactions with `hub.datasets.upload()`, turning production traffic into a regression suite.
- **From prompt presets** — define personas or behaviour patterns in your project and let the Hub auto-generate diverse scenarios via `hub.datasets.generate_preset_based()`.
- **From a knowledge base** — the Hub generates scenarios whose questions and answers are grounded in your documents via `hub.datasets.generate_document_based()`, ideal for RAG agents.

**SDK resource:** `hub.datasets`

---

## Scenarios

A **Scenario** is a single item in a dataset. It contains one or more **interactions**. Each interaction has an `input` (typically a list of `{role, content}` messages if the agent is a chat-style endpoint), an optional expected `output`, and a list of checks. The input does not have to end with an agent message — it can be as short as a single user turn. The checks are applied to the agent's actual response at evaluation time.

**SDK resources:** `hub.scenarios`, `hub.scenarios.comments`

---

## Evaluations

An **Evaluation** is a run of an agent against all scenarios in a dataset. For each scenario, the Hub:

1. Sends the input messages to the agent and records the response.
2. Runs each check on the scenario's interactions and the agent's actual response.
3. Marks each check as passed, failed, or errored, and aggregates the counts into evaluation metrics.
4. When a result fails, assigns it a **failure category** — a structured label (with an `identifier`, `title`, and `description`) that classifies the nature of the failure at a higher level (e.g. "Hallucination", "Off-topic response"). This makes it easier to triage and group failures across a large dataset.

Each individual outcome is stored as a **Result** (`hub.evaluations.results`).

### Local evaluations

You can also run evaluations against a local Python function using `hub.helpers.evaluate()`. Your local process calls the agent and collects its responses, then submits them to the Hub, which orchestrates the check runs and stores the results.

You can also upload an evaluation ran locally with [Giskard OSS](/oss) via `hub.evaluations.upload()`.

**SDK resources:** `hub.evaluations`, `hub.evaluations.results`

---

## Scheduled Evaluations

A **Scheduled Evaluation** is a recurring evaluation job. You configure the agent, dataset, and a frequency (`daily`, `weekly`, `monthly`), and the Hub runs it automatically on schedule. When a run finds failures, the Hub notifies you by email. Past runs are accessible via `hub.scheduled_evaluations.list_evaluations()`.

**SDK resource:** `hub.scheduled_evaluations`

---

## Tasks

**Tasks** are a lightweight issue tracker built into the Hub. When you find a problem during an evaluation or scan, you can create a task to track the follow-up work. Each task has a free-text description of what needs to be fixed, one or more assignees, a status (`open`, `in_progress`, `resolved`), and a priority (`low`, `medium`, `high`). Every task links to at least one resource: an evaluation result, a scenario, or a probe attempt.

**SDK resource:** `hub.tasks`

---

## Playground Chats

The Hub's UI includes a **Playground** where you can chat with registered agents interactively. Each conversation is stored as a **Playground Chat**, which you can retrieve programmatically for analysis, export, or to turn into scenarios.

**SDK resource:** `hub.playground_chats`

---

## Audit Logs

Every significant action in the Hub (create, update, delete) is recorded in an **Audit Log**. You can search events by time range, user, entity type, or action, and retrieve the history for a specific resource.

**SDK resource:** `hub.audit_logs`
