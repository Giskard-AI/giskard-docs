---
title: API Reference
description: Complete reference for all HubClient resources, methods, and types in the Giskard Hub Python SDK.
sidebar:
  order: 6
---

## Installation & import

```bash
pip install giskard-hub
```

```python
from giskard_hub import HubClient, AsyncHubClient
```

---

## `HubClient`

Synchronous client. All resource operations are available as attributes.

```python
HubClient(
    *,
    api_key: str | None = None,
    base_url: str | None = None,
    auto_add_api_suffix: bool = True,
    timeout: float | None = None,
    max_retries: int = 2,
    default_headers: dict[str, str] | None = None,
    default_query: dict[str, object] | None = None,
    http_client: httpx.Client | None = None,
)
```

| Parameter | Default | Description |
|---|---|---|
| `api_key` | `GISKARD_HUB_API_KEY` env var | Your Hub API key |
| `base_url` | `GISKARD_HUB_BASE_URL` env var | Base URL of your Hub instance |
| `auto_add_api_suffix` | `True` | Automatically appends `/_api` to `base_url` |
| `timeout` | `60.0` | Default request timeout in seconds |
| `max_retries` | `2` | Number of automatic retries on transient errors |
| `default_headers` | `None` | Headers added to every request |
| `http_client` | `None` | Custom `httpx.Client` instance |

## `AsyncHubClient`

Async counterpart to `HubClient`. Identical API surface — all methods are coroutines.

```python
from giskard_hub import AsyncHubClient
import asyncio

async def main():
    hub = AsyncHubClient()
    projects = await hub.projects.list()
    print(projects.data)

asyncio.run(main())
```

---

## Response types

All methods return a `pydantic.BaseModel`

```python
from giskard_hub.types import *
```

---

## `hub.agents`

```python
from giskard_hub.types import Agent, AgentOutput, ChatMessage
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Agent` | Register a new agent |
| `retrieve(agent_id)` | `Agent` | Get an agent by ID |
| `update(agent_id, **params)` | `Agent` | Update agent fields |
| `list(**params)` | `list[Agent]` | List agents, optionally filtered by `project_id` |
| `delete(agent_id)` | `None` | Delete an agent |
| `bulk_delete(**params)` | `None` | Delete multiple agents |
| `generate_completion(agent_id, **params)` | `AgentOutput` | Call the agent with a list of messages |
| `test_connection(**params)` | `AgentOutput` | Test an agent endpoint without registering |
| `generate_description(agent_id)` | `str` | AI-generate a description for the agent |

**`Agent` fields:** `id`, `name`, `description`, `url`, `project_id`, `supported_languages`, `headers`, `status`, `created_at`, `updated_at`

**`AgentOutput` fields:** `response` (`ChatMessage`), `metadata` (dict)

**`ChatMessage` fields:** `role` (`"user"` | `"assistant"` | `"system"`), `content`

---

## `hub.audit_logs`

```python
from giskard_hub.types import Audit, AuditDisplay
```

| Method | Returns | Description |
|---|---|---|
| `search(**params)` | `Union[list[Audit], Tuple[list[Audit], APIPaginatedMetadata]]` | Search audit events with filters |
| `list_entities(entity_id, entity_type, **params)` | `list[AuditDisplay]` | Audit history for a specific resource |

**Search params:** `query`, `filters` (dict — keys: `project_id`, `entity_type`, `entity_id`, `action`, `user_id`, each with `{"selected_options": [...]}` shape; `created_at` with `{"from": ..., "to": ...}` shape), `limit`, `offset`

---

## `hub.checks`

```python
from giskard_hub.types import (
    Check,
    CorrectnessParams, ConformityParams, GroundednessParams,
    StringMatchParams, MetadataParams, SemanticSimilarityParams,
)
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Check` | Create a custom check |
| `retrieve(check_id)` | `Check` | Get a check by ID |
| `update(check_id, **params)` | `Check` | Update check fields |
| `list(**params)` | `list[Check]` | List checks, optionally filtered by `project_id` |
| `delete(check_id)` | `None` | Delete a check |
| `bulk_delete(**params)` | `None` | Delete multiple checks |

**`Check` fields:** `id`, `identifier`, `name`, `description`, `project_id`, `params`

---

## `hub.datasets`

```python
from giskard_hub.types import Dataset, TestCase, TaskProgress
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Dataset` | Create a dataset |
| `upload(**params)` | `Dataset` | Import a dataset from a file |
| `retrieve(dataset_id)` | `Dataset` | Get a dataset by ID |
| `update(dataset_id, **params)` | `Dataset` | Update dataset fields |
| `list(**params)` | `list[Dataset]` | List datasets, optionally filtered by `project_id` |
| `delete(dataset_id)` | `None` | Delete a dataset |
| `bulk_delete(**params)` | `None` | Delete multiple datasets |
| `generate_scenario_based(**params)` | `Dataset` | Generate test cases from scenarios |
| `generate_document_based(**params)` | `Dataset` | Generate test cases from a knowledge base |
| `list_tags(dataset_id)` | `list[str]` | List all tags used in a dataset |
| `list_test_cases(dataset_id)` | `list[TestCase]` | List all test cases in a dataset |
| `search_test_cases(dataset_id, **params)` | `Union[list[TestCase], Tuple[list[TestCase], APIPaginatedMetadata]]` | Search test cases with filters |

**`Dataset` fields:** `id`, `name`, `description`, `project_id`, `created_at`, `updated_at`

---

## `hub.evaluations`

```python
from giskard_hub.types import Evaluation, CheckResult, Metric, OutputAnnotation
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Evaluation` | Start a remote evaluation |
| `create_local(**params)` | `Evaluation` | Start a local (in-process) evaluation |
| `retrieve(evaluation_id, **params)` | `Evaluation` | Get evaluation by ID, optionally include agent/dataset |
| `update(evaluation_id, **params)` | `Evaluation` | Update evaluation metadata |
| `list(**params)` | `list[Evaluation]` | List evaluations |
| `delete(evaluation_id)` | `None` | Delete an evaluation |
| `bulk_delete(**params)` | `None` | Delete multiple evaluations |
| `rerun_errored_results(evaluation_id)` | `Evaluation` | Rerun all errored results |
| `run_single(**params)` | `list[CheckResult]` | Evaluate a single (input, output) pair ad hoc |

**`Evaluation` fields:** `id`, `name`, `status` (object with `.state`), `agent_id`, `project_id`, `run_count`, `tags`, `metrics`, `created_at`

**`create` params:** `project_id`, `agent_id`, `criteria` (dict with `dataset_id`), `name`, `tags` (filter by test case tags), `run_count`

**`create_local` params:** `agent` (dict with `name`, `description`), `criteria` (list of dicts with `dataset_id`), `name`, `tags`, `run_count`

### `hub.evaluations.results`

```python
from giskard_hub.types.evaluation import TestCaseEvaluation, TaskState, FailureCategory
```

| Method | Returns | Description |
|---|---|---|
| `retrieve(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Get a single result |
| `update(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Update result (review, comment) |
| `list(evaluation_id, **params)` | `list[TestCaseEvaluation]` | List results for an evaluation |
| `search(evaluation_id, **params)` | `Union[list[TestCaseEvaluation], Tuple[list[TestCaseEvaluation], APIPaginatedMetadata]]` | Search/filter results |
| `rerun_test_case(result_id, *, evaluation_id)` | `TestCaseEvaluation` | Rerun a single result |
| `submit_local_output(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Submit output for a local evaluation step |
| `update_visibility(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Show/hide a result |

**`TestCaseEvaluation` fields:** `id`, `evaluation_id`, `test_case` (nested object with `.id`), `state`, `results` (list of check results with `.name` and `.passed`), `output`, `reviewed`, `visible`, `created_at`

---

## `hub.knowledge_bases`

```python
from giskard_hub.types import (
    KnowledgeBase,
    KnowledgeBaseDocumentRow,
    KnowledgeBaseDocumentDetail,
)
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `KnowledgeBase` | Create a knowledge base |
| `retrieve(knowledge_base_id)` | `KnowledgeBase` | Get a knowledge base by ID |
| `update(knowledge_base_id, **params)` | `KnowledgeBase` | Update knowledge base metadata |
| `list(**params)` | `list[KnowledgeBase]` | List knowledge bases by `project_id` |
| `delete(knowledge_base_id)` | `None` | Delete a knowledge base |
| `bulk_delete(**params)` | `None` | Delete multiple knowledge bases |
| `search_documents(knowledge_base_id, **params)` | `Union[list[KnowledgeBaseDocumentRow], Tuple[list[KnowledgeBaseDocumentRow], APIPaginatedMetadata]]` | Semantic search over documents |
| `retrieve_document(knowledge_base_id, document_id)` | `KnowledgeBaseDocumentDetail` | Get a specific document |

**`KnowledgeBase` fields:** `id`, `name`, `description`, `project_id`, `status`, `document_count`, `created_at`

**`create` params:** `project_id`, `name`, `description`, `file` (a `(filename, bytes)` tuple for in-memory data, or a `pathlib.Path` for a file on disk — JSON/JSONL where each record has `text` and optional `topic`)

---

## `hub.projects`

```python
from giskard_hub.types import Project
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Project` | Create a project |
| `retrieve(project_id)` | `Project` | Get a project by ID |
| `update(project_id, **params)` | `Project` | Update project fields |
| `list()` | `list[Project]` | List all accessible projects |
| `delete(project_id)` | `None` | Delete a project |
| `bulk_delete(**params)` | `None` | Delete multiple projects |

**`Project` fields:** `id`, `name`, `description`, `created_at`, `updated_at`

### `hub.projects.scenarios`

```python
from giskard_hub.types import Scenario, ScenarioPreview
```

| Method | Returns | Description |
|---|---|---|
| `create(project_id, **params)` | `Scenario` | Create a scenario |
| `retrieve(scenario_id, *, project_id)` | `Scenario` | Get a scenario |
| `update(scenario_id, *, project_id, **params)` | `Scenario` | Update a scenario |
| `list(project_id)` | `list[Scenario]` | List scenarios for a project |
| `delete(scenario_id, *, project_id)` | `None` | Delete a scenario |
| `preview(project_id, **params)` | `ScenarioPreview` | Preview generated questions for a scenario |

---

## `hub.scans`

```python
from giskard_hub.types import Scan, ScanCategory, ScanProbe
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Scan` | Create and start a vulnerability scan |
| `retrieve(scan_id, **params)` | `Scan` | Get a scan result, optionally including agent/KB |
| `list(**params)` | `list[Scan]` | List scans |
| `delete(scan_id)` | `None` | Delete a scan result |
| `bulk_delete(**params)` | `None` | Delete multiple scan results |
| `list_categories()` | `list[ScanCategory]` | List all available scan categories/tags |
| `list_probes(scan_id)` | `list[ScanProbe]` | List probe results for a scan |

**`Scan` fields:** `id`, `status`, `grade`, `agent_id`, `knowledge_base_id`, `tags`, `created_at`

**`create` params:** `project_id`, `agent_id`, `knowledge_base_id` (optional), `tags` (list of OWASP/Giskard tag strings)

### `hub.scans.probes`

```python
from giskard_hub.types.scan import ScanProbe, ScanProbeAttempt
```

| Method | Returns | Description |
|---|---|---|
| `retrieve(probe_id)` | `ScanProbe` | Get a probe result |
| `list_attempts(probe_id)` | `list[ScanProbeAttempt]` | List all attempts for a probe |

### `hub.scans.attempts`

```python
from giskard_hub.types.scan import ScanProbeAttempt, ReviewStatus, Severity
```

| Method | Returns | Description |
|---|---|---|
| `update(probe_attempt_id, **params)` | `ScanProbeAttempt` | Update review status or severity of an attempt |

**`ReviewStatus` values:** `"pending"`, `"reviewed"`, `"false_positive"`

**`Severity` values:** `"low"`, `"medium"`, `"high"`, `"critical"`

---

## `hub.scheduled_evaluations`

```python
from giskard_hub.types import ScheduledEvaluation, FrequencyOption
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `ScheduledEvaluation` | Create a scheduled evaluation |
| `retrieve(scheduled_evaluation_id, **params)` | `ScheduledEvaluation` | Get a schedule, optionally with recent runs |
| `update(scheduled_evaluation_id, **params)` | `ScheduledEvaluation` | Update schedule configuration |
| `list(**params)` | `list[ScheduledEvaluation]` | List schedules |
| `delete(scheduled_evaluation_id)` | `None` | Delete a schedule |
| `bulk_delete(**params)` | `None` | Delete multiple schedules |
| `list_evaluations(scheduled_evaluation_id, **params)` | `list[Evaluation]` | List past evaluation runs for a schedule |

**`create` params:** `project_id`, `agent_id`, `dataset_id`, `name`, `frequency` (`"daily"` | `"weekly"` | `"monthly"`), `time`, `day_of_week`, `day_of_month`

---

## `hub.tasks`

```python
from giskard_hub.types import Task, TaskStatus, TaskPriority
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Task` | Create a task |
| `retrieve(task_id)` | `Task` | Get a task by ID |
| `update(task_id, **params)` | `Task` | Update task fields |
| `list(**params)` | `list[Task]` | List tasks, optionally filtered |
| `delete(task_id)` | `None` | Delete a task |
| `bulk_delete(**params)` | `None` | Delete multiple tasks |

**`TaskStatus` values:** `"open"`, `"in_progress"`, `"resolved"`

**`TaskPriority` values:** `"low"`, `"medium"`, `"high"`, `"critical"`

**`Task` fields:** `id`, `title`, `description`, `status`, `priority`, `project_id`, `created_at`, `updated_at`

---

## `hub.test_cases`

```python
from giskard_hub.types import TestCase, TestCaseComment, TestCaseCheckConfig, ChatMessageWithMetadata
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `TestCase` | Create a test case |
| `retrieve(test_case_id)` | `TestCase` | Get a test case by ID |
| `update(test_case_id, **params)` | `TestCase` | Update a test case |
| `delete(test_case_id)` | `None` | Delete a test case |
| `bulk_delete(**params)` | `None` | Delete multiple test cases |
| `bulk_update(**params)` | `list[TestCase]` | Update multiple test cases |
| `bulk_move(**params)` | `None` | Move test cases to another dataset |

**`TestCase` fields:** `id`, `dataset_id`, `messages`, `demo_output`, `checks`, `tags`, `created_at`

**`create` params:** `dataset_id`, `messages` (list of `{role, content}`), `demo_output` (`{role, content}`), `checks` (list of `{identifier, params}`), `tags`

### `hub.test_cases.comments`

| Method | Returns | Description |
|---|---|---|
| `add(test_case_id, **params)` | `TestCaseComment` | Add a comment to a test case |
| `edit(comment_id, *, test_case_id, **params)` | `TestCaseComment` | Edit a comment |
| `delete(comment_id, *, test_case_id)` | `None` | Delete a comment |

---

## `hub.playground_chats`

```python
from giskard_hub.types import PlaygroundChat
```

| Method | Returns | Description |
|---|---|---|
| `list(**params)` | `list[PlaygroundChat]` | List playground chats |
| `retrieve(chat_id, **params)` | `PlaygroundChat` | Get a chat by ID, optionally include agent |
| `delete(chat_id)` | `None` | Delete a chat |
| `bulk_delete(**params)` | `None` | Delete multiple chats |

---

## Error types

All error types are importable from the root `giskard_hub` package:

```python
from giskard_hub import (
    APIError,
    APIStatusError,
    APITimeoutError,
    APIConnectionError,
    BadRequestError,           # 400
    AuthenticationError,       # 401
    PermissionDeniedError,     # 403
    NotFoundError,             # 404
    ConflictError,             # 409
    UnprocessableEntityError,  # 422
    RateLimitError,            # 429
    InternalServerError,       # 500
)
```

```python
from giskard_hub import HubClient, NotFoundError, AuthenticationError

hub = HubClient()

try:
    agent = hub.agents.retrieve("nonexistent-id").data
except NotFoundError:
    print("Agent not found")
except AuthenticationError:
    print("Invalid API key")
```
