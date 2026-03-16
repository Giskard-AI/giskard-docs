---
title: Core Concepts
description:
  Understand the building blocks of the Giskard Hub SDK — Projects, Agents,
  Datasets, Evaluations, Scans, and more.
sidebar:
  order: 3
---

This page explains the mental model behind the Giskard Hub and how its resources
relate to each other. Reading this before diving into the how-to guides will
make everything click faster.

## The big picture

```
Project
├── Agents            (your LLM applications)
├── Knowledge Bases   (document collections)
├── Scans             (automated vulnerability probing)
├── Datasets          (test case collections)
│   └── Test Cases    (individual conversation + checks)
├── Checks            (built-in and custom criteria)
├── Evaluations       (run an agent against a dataset)
│   └── Results       (per-test-case outcomes)
├── Scheduled Evaluations
└── Tasks             (issues and follow-up items)
```

Everything belongs to a **Project**. Projects are the organisational unit — your
team can have one project per product, environment, or use case.

---

## Projects

A **Project** is a workspace that groups all related resources: agents,
datasets, evaluations, and scans. It also holds **Scenarios** — reusable persona
and behaviour templates used when auto-generating test cases.

**SDK resource:** `hub.projects`, `hub.projects.scenarios`

---

## Agents

An **Agent** represents your LLM application. It can be:

- A **remote agent** — an HTTP endpoint that the Hub calls with a list of chat
  messages and expects a response from.
- A **local agent** — a Python function you pass directly when running a local
  evaluation. Useful for evaluating models without exposing an HTTP endpoint.

Agents are configured with a URL, HTTP headers (for authentication), and the
list of supported languages.

**SDK resource:** `hub.agents`

---

## Knowledge Bases

A **Knowledge Base** is an indexed collection of documents. It has three primary
uses:

1. **Document-based dataset generation** — the Hub uses the documents as source
   material to auto-generate realistic test cases via
   `hub.datasets.generate_document_based()`.
2. **Grounded vulnerability scans** — when you create a scan with a
   `knowledge_base_id`, the probes are anchored to your actual document content,
   making attacks more realistic and specific.
3. **Groundedness check context** — retrieve relevant documents from the KB via
   `hub.knowledge_bases.search_documents()` and pass them as the `context` field
   of a `groundedness` check assertion. This verifies that your agent's
   responses are grounded in your actual documents rather than hallucinated
   content.

Documents are stored as text chunks with optional topics/metadata.

**SDK resource:** `hub.knowledge_bases`

---

## Scans

A **Scan** runs automated vulnerability probes against an agent to detect
security and safety issues. Giskard covers the
[OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
categories (Prompt Injection, Excessive Agency, Misinformation, …) as well as
additional categories that go beyond the OWASP framework, such as Harmful
Content Generation, Brand Damaging & Reputation, Legal & Financial Risk, and
Misguidance & Unauthorized Advice. Each scan produces:

- **Probe Results** — grouped by vulnerability category.
- **Probe Attempts** — individual adversarial prompts and the agent's responses.
- A **Grade** (A–D) summarising the overall security posture.

Scans can optionally be anchored to a Knowledge Base to generate attacks that
are specific to your document content.

**SDK resources:** `hub.scans`, `hub.scans.probes`, `hub.scans.attempts`

---

## Checks

A **Check** is a criterion evaluated on an agent's response. Checks belong to a
project and can be reused across any dataset in that project. Not all checks use
an LLM judge — some are purely rule-based:

| Identifier            | How it evaluates     | What it checks                                                          |
| --------------------- | -------------------- | ----------------------------------------------------------------------- |
| `correctness`         | LLM judge            | Is the response factually correct relative to the expected output?      |
| `conformity`          | LLM judge            | Does the response follow specified format, tone, or style rules?        |
| `groundedness`        | LLM judge            | Is the response grounded in the provided context (no hallucinations)?   |
| `semantic_similarity` | Embedding similarity | Is the response semantically close to the expected output?              |
| `string_match`        | Rule-based           | Does the response contain a specific keyword or substring?              |
| `metadata`            | Rule-based           | Do JSON path values in the response metadata meet specified conditions? |

You can also define **custom checks** via `hub.checks.create()` — a named,
reusable configuration of any built-in check type with pre-set parameters, so
you don't have to repeat them across test cases.

**SDK resource:** `hub.checks`

---

## Datasets

A **Dataset** is a named collection of **Test Cases**. Datasets can be built in
several ways:

- **Manually** — create test cases one by one via `hub.test_cases.create()`,
  useful when you have precise, hand-crafted scenarios.
- **From real conversation logs** — import a JSONL or JSON file of recorded
  conversations with `hub.datasets.upload()`, turning production traffic into a
  regression suite.
- **From Project Scenarios** — define personas or behaviour patterns (scenarios)
  in your project and let the Hub auto-generate diverse test cases via
  `hub.datasets.generate_scenario_based()`.
- **From a Knowledge Base** — the Hub generates test cases whose questions and
  answers are grounded in your documents via
  `hub.datasets.generate_document_based()`, ideal for RAG agents.

**SDK resource:** `hub.datasets`

---

## Test Cases

A **Test Case** represents a single conversation: a sequence of
`{role, content}` messages (with optional metadata) exchanged between a user and
an agent. The conversation does not have to end with an agent message — it can
be as short as a single user turn. A list of checks is applied to the agent's
actual response at evaluation time.

**SDK resources:** `hub.test_cases`, `hub.test_cases.comments`

---

## Evaluations

An **Evaluation** is a run of an agent against all test cases in a dataset. For
each test case, the Hub:

1. Sends the messages to the agent and records the response.
2. Runs each check on the conversation stored in the test case and the agent's
   actual response.
3. Marks the result as `passed`, `failed`, or `error`.
4. When a result fails, assigns it a **failure category** — a structured label
   (with an `identifier`, `title`, and `description`) that classifies the nature
   of the failure at a higher level (e.g. "Hallucination", "Off-topic
   response"). This makes it easier to triage and group failures across a large
   dataset.

Each individual outcome is stored as a **Result** (`hub.evaluations.results`).

### Local evaluations

You can also run evaluations against a local Python function using
`hub.helpers.evaluate()`. Your local process calls the agent and collects its
responses, then submits them to the Hub, which orchestrates the check runs and
stores the results.

**SDK resources:** `hub.evaluations`, `hub.evaluations.results`

---

## Scheduled Evaluations

A **Scheduled Evaluation** is a recurring evaluation job. You configure the
agent, dataset, and a frequency (`daily`, `weekly`, `monthly`), and the Hub runs
it automatically on schedule. Results are delivered by email notification, and
past runs are accessible via `hub.scheduled_evaluations.list_evaluations()`.

**SDK resource:** `hub.scheduled_evaluations`

---

## Tasks

**Tasks** are a lightweight issue tracker built into the Hub. When you find a
problem during an evaluation or scan, you can create a task to track the
follow-up work. Each task has a title, a free-text description of what needs to
be fixed, one or more assignees, a status (`open`, `in_progress`, `resolved`),
and a priority (`low`, `medium`, `high`).

**SDK resource:** `hub.tasks`

---

## Playground Chats

The Hub's UI includes a **Playground** where you can chat with registered agents
interactively. Each conversation is stored as a **Playground Chat**, which you
can retrieve programmatically for analysis, export, or to turn into test cases.

**SDK resource:** `hub.playground_chats`

---

## Audit Log

Every significant action in the Hub (create, update, delete) is recorded in an
**Audit Log**. You can search events by time range, user, entity type, or
action, and retrieve the history for a specific resource.

**SDK resource:** `hub.audit_logs`
