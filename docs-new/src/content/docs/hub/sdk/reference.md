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
| `default_query` | `None` | Query parameters added to every request |
| `http_client` | `None` | Custom `httpx.Client` instance (for proxies, custom transports, etc.) |

## `AsyncHubClient`

Async counterpart to `HubClient`. Identical API surface -- all methods are coroutines.

```python
from giskard_hub import AsyncHubClient
import asyncio

async def main():
    hub = AsyncHubClient()
    projects = await hub.projects.list()
    print(projects)

asyncio.run(main())
```

---

## Response types

All methods return `pydantic.BaseModel` instances. You can use `.model_dump()` to convert to a dict or `.model_dump_json()` to serialize to JSON.

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
| `test_connection(**params)` | `AgentOutput` | Test an agent endpoint without registering it |
| `generate_description(agent_id)` | `Agent` | AI-generate a description for the agent |

**`create` params:** `project_id` (required), `name` (required), `url` (required), `headers` (dict), `supported_languages` (list of str), `description`

**`Agent` fields:** `id`, `name`, `description`, `url`, `project_id`, `supported_languages`, `headers`, `created_at`, `updated_at`

**`AgentOutput` fields:** `response` (`ChatMessage`), `error` (`ExecutionError | None`), `metadata` (`dict | None`)

**`ChatMessage` fields:** `role`, `content`

---

## `hub.audit_logs`

```python
from giskard_hub.types import Audit, AuditDisplay
```

| Method | Returns | Description |
|---|---|---|
| `search(**params)` | `list[Audit]` | Search audit events with filters |
| `list_entities(entity_id, entity_type, **params)` | `list[AuditDisplay]` | Audit history for a specific resource |

Both methods support [pagination metadata](#pagination) via `include_metadata=True`.

**`search` params:** `query` (free-text), `filters` (dict -- see below), `order_by`, `limit`, `offset`, `include_metadata`

**Filter keys for `search`:**

| Key | Type | Example |
|---|---|---|
| `project_id` | `ListFilter` | `{"selected_options": ["project-id"]}` |
| `entity_type` | `ListFilter` | `{"selected_options": ["agent", "evaluation"]}` |
| `entity_id` | `ListFilter` | `{"selected_options": ["entity-id"]}` |
| `action` | `ListFilter` | `{"selected_options": ["create", "delete"]}` |
| `user_id` | `ListFilter` | `{"selected_options": ["user-id"]}` |
| `created_at` | `DateRangeFilter` | `{"from_": "2025-01-01T00:00:00Z", "to_": "2025-12-31T23:59:59Z"}` |

---

## `hub.checks`

```python
from giskard_hub.types import Check, CheckResult
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Check` | Create a custom check |
| `retrieve(check_id)` | `Check` | Get a check by ID |
| `update(check_id, **params)` | `Check` | Update check fields |
| `list(**params)` | `list[Check]` | List checks for a `project_id` |
| `delete(check_id)` | `None` | Delete a check |
| `bulk_delete(**params)` | `None` | Delete multiple checks |

**`create` params:** `project_id` (required), `identifier` (required), `name` (required), `params` (required -- see check types below), `description`

**`list` params:** `project_id` (required), `filter_builtin` (bool -- when `True`, include built-in checks)

**`Check` fields:** `id`, `built_in`, `identifier`, `name`, `description`, `project_id`, `params`, `created_at`, `updated_at`

**`CheckResult` fields:** `name`, `display_name`, `status`, `passed` (bool), `error`, `reason`, `annotations` (list of `OutputAnnotation`)

### Check type params

The `params` field in `create` / `update` accepts one of these shapes:

| Type | `params` shape | Description |
|---|---|---|
| Correctness | `{"type": "correctness", "reference": "..."}` | LLM judge -- is the response correct relative to the reference? |
| Conformity | `{"type": "conformity", "rules": ["...", ...]}` | LLM judge -- does the response follow the listed rules? |
| Groundedness | `{"type": "groundedness", "context": "..."}` | LLM judge -- is the response grounded in the provided context? |
| Semantic similarity | `{"type": "semantic_similarity", "reference": "...", "threshold": 0.8}` | Embedding -- is the response semantically close to the reference? |
| String match | `{"type": "string_match", "keyword": "..."}` | Rule-based -- does the response contain the keyword? |
| Metadata | `{"type": "metadata", "json_path_rules": [{"json_path": "$.key", "expected_value": "val", "expected_value_type": "string"}]}` | Rule-based -- do JSON path values in metadata satisfy conditions? |

---

## `hub.datasets`

```python
from giskard_hub.types import Dataset, TestCase, TaskProgress
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Dataset` | Create an empty dataset |
| `upload(**params)` | `Dataset` | Import a dataset from a file or list of dicts |
| `retrieve(dataset_id)` | `Dataset` | Get a dataset by ID |
| `update(dataset_id, **params)` | `Dataset` | Update dataset fields |
| `list(**params)` | `list[Dataset]` | List datasets, optionally filtered by `project_id` |
| `delete(dataset_id)` | `None` | Delete a dataset |
| `bulk_delete(**params)` | `None` | Delete multiple datasets |
| `generate_scenario_based(**params)` | `Dataset` | Generate test cases from a scenario |
| `generate_document_based(**params)` | `Dataset` | Generate test cases from a knowledge base |
| `list_tags(dataset_id)` | `list[str]` | List all tags used in a dataset |
| `list_test_cases(dataset_id)` | `list[TestCase]` | List all test cases in a dataset |
| `search_test_cases(dataset_id, **params)` | `list[TestCase]` | Search test cases with filters |

`search_test_cases` supports [pagination metadata](#pagination) via `include_metadata=True`.

**`create` params:** `project_id` (required), `name` (required), `description`

**`upload` params:** `project_id` (required), `data` (required -- list of dicts or file path), `name`, `dataset_id` (to append to existing)

**`generate_scenario_based` params:**

| Parameter | Required | Description |
|---|---|---|
| `project_id` | yes | Project ID |
| `agent_id` | yes | Agent to generate test cases for |
| `scenario_id` | yes | Scenario template to use |
| `n_examples` | no | Number of test cases to generate |
| `dataset_name` | no | Name for the new dataset |
| `dataset_id` | no | Append to an existing dataset instead of creating a new one |

**`generate_document_based` params:**

| Parameter | Required | Description |
|---|---|---|
| `agent_id` | yes | Agent to generate test cases for |
| `knowledge_base_id` | yes | Knowledge base to source documents from |
| `project_id` | yes | Project ID |
| `dataset_name` | no | Name for the new dataset |
| `description` | no | Description of the dataset |
| `n_examples` | no | Number of test cases to generate |
| `topic_ids` | no | Filter to specific KB topics |

**`Dataset` fields:** `id`, `name`, `description`, `project_id`, `status` (`TaskProgress`), `tags`, `state` (computed from status), `created_at`, `updated_at`

---

## `hub.evaluations`

```python
from giskard_hub.types import Evaluation, Metric, CheckResult, OutputAnnotation
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `Evaluation` | Start a remote evaluation |
| `create_local(**params)` | `Evaluation` | Start a local (in-process) evaluation |
| `retrieve(evaluation_id, **params)` | `Evaluation` | Get evaluation by ID |
| `update(evaluation_id, **params)` | `Evaluation` | Update evaluation name |
| `list(**params)` | `list[Evaluation]` | List evaluations |
| `delete(evaluation_id)` | `None` | Delete an evaluation |
| `bulk_delete(**params)` | `None` | Delete multiple evaluations |
| `rerun_errored_results(evaluation_id)` | `Evaluation` | Rerun all errored results |
| `run_single(**params)` | `list[CheckResult]` | Evaluate a single (input, output) pair ad hoc |

**`create` params:** `project_id` (required), `agent_id` (required), `dataset_id` (required -- or use `old_evaluation_id` to reuse a previous evaluation's dataset), `name`, `tags`, `run_count`

**`create_local` params:** `dataset_id` (required), `agent_info` (`{"name": ..., "description": ...}`), `name`, `tags`

**`run_single` params:** `project_id` (required), `messages` (required), `model_output` (required -- `AgentOutput`), `checks` (required), `model_description`

**`retrieve` / `list` params:** `include` (list -- e.g. `["agent", "dataset"]` to embed related resources)

**`Evaluation` fields:** `id`, `name`, `agent` (`AgentReference | Agent`), `dataset` (`DatasetReference | Dataset`), `criteria`, `project_id`, `local` (bool), `metrics` (`list[Metric]`), `tags`, `failure_categories`, `status` (`TaskProgress`), `state` (computed), `created_at`, `updated_at`

**`Metric` fields:** `name`, `display_name`, `passed`, `failed`, `errored`, `total`, `success_rate` (float 0--1)

### `hub.evaluations.results`

```python
from giskard_hub.types.evaluation import TestCaseEvaluation, FailureCategory
```

| Method | Returns | Description |
|---|---|---|
| `retrieve(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Get a single result |
| `update(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Update failure category or visibility |
| `list(evaluation_id, **params)` | `list[TestCaseEvaluation]` | List results for an evaluation |
| `search(evaluation_id, **params)` | `list[TestCaseEvaluation]` | Search/filter results |
| `rerun_test_case(result_id, *, evaluation_id)` | `TestCaseEvaluation` | Rerun a single result |
| `submit_local_output(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Submit output for a local evaluation step |
| `update_visibility(result_id, *, evaluation_id, **params)` | `TestCaseEvaluation` | Show/hide a result |

**`update` params:** `evaluation_id` (required), `failure_category_id`, `hidden` (bool)

**`search` params:** `evaluation_id` (required), `query`, `filters`, `order_by`, `limit`, `offset`

**`TestCaseEvaluation` fields:** `id`, `evaluation_id`, `test_case` (`TestCase | TestCaseReference`), `test_case_exists` (bool), `state`, `results` (`list[CheckResult]` -- each with `.name`, `.passed`, `.reason`, `.status`, `.annotations`), `output` (`AgentOutput | None`), `error`, `failure_category`, `hidden`, `created_at`, `updated_at`

**`FailureCategory` fields:** `identifier`, `title`, `description`

---

## `hub.helpers`

```python
from giskard_hub.types import Evaluation, Scan, ChatMessage
```

| Method | Returns | Description |
|---|---|---|
| `wait_for_completion(entity, **params)` | entity type | Poll until entity leaves running state |
| `evaluate(**params)` | `Evaluation` | Run evaluation with remote or local agent |
| `print_metrics(entity)` | `None` | Print evaluation or scan metrics to console |

**`wait_for_completion` params:**

| Parameter | Default | Description |
|---|---|---|
| `entity` | -- | The entity to poll (Evaluation, Scan, Dataset, KnowledgeBase, etc.) |
| `poll_interval` | `5.0` | Seconds between polling requests |
| `max_retries` | `360` | Maximum number of polling attempts (default: 30 minutes at 5s intervals) |
| `running_states` | `{"running"}` | States that indicate the entity is still processing |
| `error_states` | `{"error"}` | States that indicate the entity has failed |
| `raise_on_error` | `True` | Raise an exception if the entity enters an error state |

**`evaluate` params:**

| Parameter | Required | Description |
|---|---|---|
| `agent` | yes | `str` (agent ID), `Agent` object, or a `Callable[[list[ChatMessage]], str \| ChatMessage \| AgentOutput]` for local evaluation |
| `dataset` | yes | `str` (dataset ID) or `Dataset` object |
| `project` | conditional | Required when `agent` is a remote agent (str or Agent). Not required for local callables |
| `name` | no | Evaluation run name |
| `tags` | no | Tags to filter test cases |

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
| `search_documents(knowledge_base_id, **params)` | `tuple[list[KnowledgeBaseDocumentRow], APIPaginatedMetadata]` | Semantic search over documents |
| `retrieve_document(knowledge_base_id, document_id)` | `KnowledgeBaseDocumentDetail` | Get a specific document |

**`create` params:** `project_id` (required), `name` (required), `data` (required -- list of dicts, file path, or `pathlib.Path`), `description`, `document_column` (default `"text"`), `topic_column` (default `"topic"`)

**`KnowledgeBase` fields:** `id`, `name`, `description`, `filename`, `project_id`, `n_documents`, `status` (`TaskProgress`), `topics`, `state` (computed), `created_at`, `updated_at`

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

**`create` params:** `name` (required), `description`

**`update` params:** `name`, `description`, `failure_categories` (list of `FailureCategory`)

**`Project` fields:** `id`, `name`, `description`, `failure_categories`, `created_at`, `updated_at`

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
| `retrieve(scan_id, **params)` | `Scan` | Get a scan result |
| `list(**params)` | `list[Scan]` | List scans |
| `delete(scan_id)` | `None` | Delete a scan result |
| `bulk_delete(**params)` | `None` | Delete multiple scan results |
| `list_categories()` | `list[ScanCategory]` | List all available scan categories/tags |
| `list_probes(scan_id)` | `list[ScanProbe]` | List probe results for a scan |

**`create` params:** `project_id` (required), `agent_id` (required), `knowledge_base_id` (optional), `tags` (list of OWASP/Giskard tag strings)

**`retrieve` / `list` params:** `include` (list -- e.g. `["agent", "knowledge_base"]` to embed related resources)

**`Scan` fields:** `id`, `agent` (`AgentReference | Agent`), `project_id`, `knowledge_base`, `grade` (`"A"` .. `"D"` or `None`), `status` (`TaskProgress`), `state` (computed), `created_at`, `updated_at`

**`ScanCategory` fields:** `id`, `title`, `description`, `owasp_id`

**`ScanProbe` fields:** `id`, `name`, `description`, `category`, `tags`, `metrics` (`list[ScanProbeMetric]`), `scan_id`, `status` (`TaskProgress`), `state` (computed)

**`ScanProbeMetric` fields:** `count`, `severity`

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

**`update` params:** `review_status`, `severity`, `successful` (bool)

**`ScanProbeAttempt` fields:** `id`, `probe_id`, `reason`, `messages` (`list[ChatMessageWithMetadata]`), `metadata`, `severity` (`Severity`), `review_status` (`ReviewStatus`), `error`

**`ReviewStatus` values:** `"pending"`, `"ignored"`, `"acknowledged"`, `"corrected"`

**`Severity` values:** `SAFE` (0), `MINOR` (10), `MAJOR` (20), `CRITICAL` (30) -- `IntEnum`

---

## `hub.scheduled_evaluations`

```python
from giskard_hub.types import ScheduledEvaluation, FrequencyOption
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `ScheduledEvaluation` | Create a scheduled evaluation |
| `retrieve(scheduled_evaluation_id, **params)` | `ScheduledEvaluation` | Get a schedule |
| `update(scheduled_evaluation_id, **params)` | `ScheduledEvaluation` | Update schedule configuration |
| `list(**params)` | `list[ScheduledEvaluation]` | List schedules |
| `delete(scheduled_evaluation_id)` | `None` | Delete a schedule |
| `bulk_delete(**params)` | `None` | Delete multiple schedules |
| `list_evaluations(scheduled_evaluation_id, **params)` | `list[Evaluation]` | List past evaluation runs for a schedule |

**`create` params:**

| Parameter | Required | Description |
|---|---|---|
| `project_id` | yes | Project ID |
| `agent_id` | yes | Agent to evaluate |
| `dataset_id` | yes | Dataset to evaluate against |
| `name` | yes | Schedule name |
| `frequency` | yes | `"daily"`, `"weekly"`, or `"monthly"` |
| `time` | yes | Time of day in `HH:MM` format (UTC) |
| `day_of_week` | weekly only | 1 (Monday) through 7 (Sunday) |
| `day_of_month` | monthly only | 1 through 28 |
| `tags` | no | Tags to filter test cases |
| `run_count` | no | Number of times to run each test case |

**`retrieve` params:** `include` (list -- e.g. `["evaluations"]` to embed recent runs)

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

**`create` params:**

| Parameter | Required | Description |
|---|---|---|
| `project_id` | yes | Project ID |
| `description` | yes | Task description |
| `priority` | no | `"low"`, `"medium"`, or `"high"` |
| `status` | no | `"open"`, `"in_progress"`, or `"resolved"` |
| `assignee_ids` | no | List of user IDs to assign |
| `evaluation_result_id` | no | Link to an evaluation result |
| `dataset_test_case_id` | no | Link to a test case |
| `probe_attempt_id` | no | Link to a scan probe attempt |
| `disable_test` | no | Disable the linked test case |
| `hide_result` | no | Hide the linked evaluation result |

**`update` params:** `status`, `priority`, `description`, `assignee_ids`, `set_test_case_status`

**`TaskStatus` values:** `"open"`, `"in_progress"`, `"resolved"`

**`TaskPriority` values:** `"low"`, `"medium"`, `"high"`

**`Task` fields:** `id`, `description`, `status`, `priority`, `project_id`, `created_by`, `assignees`, `references`, `created_at`, `updated_at`

---

## `hub.test_cases`

```python
from giskard_hub.types import TestCase, TestCaseComment, ChatMessageWithMetadata
```

| Method | Returns | Description |
|---|---|---|
| `create(**params)` | `TestCase` | Create a test case |
| `retrieve(test_case_id)` | `TestCase` | Get a test case by ID |
| `update(test_case_id, **params)` | `TestCase` | Update a test case |
| `delete(test_case_id)` | `None` | Delete a test case |
| `bulk_delete(**params)` | `None` | Delete multiple test cases |
| `bulk_update(**params)` | `None` | Update multiple test cases (tags, checks, status) |
| `bulk_move(**params)` | `None` | Move or copy test cases to another dataset |

**`create` params:** `dataset_id` (required), `messages` (required -- list of `{role, content}`), `demo_output` (`{role, content, metadata?}`), `checks` (list of `{identifier, params?, enabled?}`), `tags`, `status` (`"active"` | `"draft"`)

**`bulk_update` params:** `ids` (required), `status`, `disabled_checks`, `enabled_checks`, `added_tags`, `removed_tags`

**`bulk_move` params:** `chat_test_case_ids` (required), `dataset_id` (required), `duplicate` (bool -- copy instead of move)

**`TestCase` fields:** `id`, `dataset_id`, `messages`, `demo_output`, `checks`, `comments`, `tags`, `created_at`, `updated_at`

### `hub.test_cases.comments`

| Method | Returns | Description |
|---|---|---|
| `add(test_case_id, **params)` | `TestCaseComment` | Add a comment to a test case |
| `edit(comment_id, **params)` | `TestCaseComment` | Edit a comment |
| `delete(comment_id)` | `None` | Delete a comment |

---

## `hub.playground_chats`

```python
from giskard_hub.types import PlaygroundChat
```

| Method | Returns | Description |
|---|---|---|
| `list(**params)` | `list[PlaygroundChat]` | List playground chats |
| `retrieve(chat_id, **params)` | `PlaygroundChat` | Get a chat by ID |
| `delete(chat_id)` | `None` | Delete a chat |
| `bulk_delete(**params)` | `None` | Delete multiple chats |

**`list` / `retrieve` params:** `include` (list -- e.g. `["agent"]` to embed the agent)

---

## Error types

All error types are importable from the root `giskard_hub` package:

```python
from giskard_hub import (
    HubClientError,            # Base exception
    APIStatusError,            # Base for HTTP errors
    APITimeoutError,           # Request timed out
    APIConnectionError,        # Connection failed
    BadRequestError,           # 400
    AuthenticationError,       # 401
    PermissionDeniedError,     # 403
    NotFoundError,             # 404
    ConflictError,             # 409
    UnprocessableEntityError,  # 422
    RateLimitError,            # 429
    InternalServerError,       # 500+
)
```

```python
from giskard_hub import HubClient, NotFoundError, AuthenticationError

hub = HubClient()

try:
    agent = hub.agents.retrieve("nonexistent-id")
except NotFoundError:
    print("Agent not found")
except AuthenticationError:
    print("Invalid API key")
```

---

## Advanced patterns

### Pagination

Methods that return lists (like `search` and `list_entities`) support pagination via `limit` and `offset`. Pass `include_metadata=True` to receive pagination metadata alongside results:

```python
results, metadata = hub.evaluations.results.search(
    "evaluation-id",
    limit=50,
    offset=0,
    include_metadata=True,
)

print(f"Showing {metadata.count} of {metadata.total} results")
print(f"Offset: {metadata.offset}, Limit: {metadata.limit}")
```

### Raw response access

To access HTTP headers, status codes, or the raw response body, use `.with_raw_response`:

```python
response = hub.with_raw_response.agents.retrieve("agent-id")
print(response.status_code)
print(response.headers["content-type"])
agent = response.parse()  # parse into the typed model
```

### Streaming response

Use `.with_streaming_response` for large responses:

```python
with hub.with_streaming_response.agents.list(project_id="project-id") as response:
    for line in response.iter_lines():
        print(line)
```

### Retries and timeouts

```python
# Disable retries globally
hub = HubClient(max_retries=0)

# Override retries for a single request
hub.with_options(max_retries=5).agents.list()

# Override timeout for a single request
hub.with_options(timeout=120.0).evaluations.create(...)

# Fine-grained timeout control
import httpx
hub = HubClient(timeout=httpx.Timeout(60.0, read=5.0, write=10.0, connect=2.0))
```

### Logging

Enable debug logging via the `GISKARD_HUB_LOG` environment variable:

```bash
export GISKARD_HUB_LOG=debug  # or 'info'
```

### Custom HTTP client

Pass a custom `httpx.Client` for advanced networking (proxies, custom transport, mutual TLS):

```python
import httpx
from giskard_hub import HubClient, DefaultHttpxClient

hub = HubClient(
    http_client=DefaultHttpxClient(
        proxy="http://my-proxy.example.com:8080",
        transport=httpx.HTTPTransport(local_address="0.0.0.0"),
    ),
)
```
