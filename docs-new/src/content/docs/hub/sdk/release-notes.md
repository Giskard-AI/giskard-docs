---
title: Release Notes
description: Changelog for the Giskard Hub Python SDK.
sidebar:
  order: 5
---

## v3.0.0

This release is the first of the v3 SDK. It is a full rewrite based on a generated OpenAPI client, providing complete type safety, async support, and coverage of all Hub API endpoints.

### New features

- **`AsyncHubClient`** — a fully async client with identical API surface to `HubClient`, using `httpx` or optionally `aiohttp` as the HTTP backend.
- **Scenarios** — create and manage reusable persona/behaviour templates via `hub.projects.scenarios`, and generate datasets from them with `hub.datasets.generate_scenario_based()`.
- **Tasks** — `hub.tasks` provides a lightweight issue tracker for managing findings from evaluations and scans.
- **Playground Chats** — `hub.playground_chats` lets you access conversations captured from the Hub UI playground and create datasets from them.
- **Audit Logs** — `hub.audit_logs` provides searchable, paginated audit event history.
- **Test case comments** — `hub.test_cases.comments` supports collaborative annotation of test cases.
- **Scan probes and attempts** — `hub.scans.probes` and `hub.scans.attempts` give granular access to scan probe results and individual adversarial attempts.
- **Evaluation result controls** — rerun errored results, update review status, control per-result visibility, and search/filter results via `hub.evaluations.results`.
- **Full CRUD for most resources** — nearly every resource now supports `create`, `retrieve`, `update`, `list`, `delete`, and `bulk_delete`.

### Breaking changes from v2

See the [Migration Guide](/hub/sdk/migration) for a complete list of breaking changes and before/after code examples.

---

## v2.x release history

The v2.x series release notes are maintained in the [legacy documentation](https://docs.giskard.ai/en/latest/hub/sdk/release_notes/). Key milestones:

| Version   | Date       | Summary                                                                                                        |
| --------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| **2.1.0** | 2025-10-30 | Added vulnerability scanning via `hub.scans.create()`                                                          |
| **2.0.2** | 2025-10-06 | Fixed health-check endpoint (replaced OpenAPI endpoint)                                                        |
| **2.0.1** | 2025-10-01 | Fixed `dataset.create_test_case` attribute filtering                                                           |
| **2.0.0** | 2025-09-23 | BREAKING: removed CSV support for KB creation; dropped Python 3.9; renamed `conversations` → `chat_test_cases` |
