---
title: Errors & retries
description: "LLMError subclasses, capability errors, and the should_retry helper."
sidebar:
  order: 5
---

## Errors {#errors}

All derive from **`LLMError`** and carry **`status_code`**, **`message`**, **`provider`** (for compatibility with downstream retry wrappers such as **giskard-agents**).

| Exception                   | Typical meaning                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `AuthenticationError`       | 401/403 from provider                                                                             |
| `RateLimitError`            | 429                                                                                               |
| `ServerError`               | 5xx class failures                                                                                |
| `LLMTimeoutError`           | Timeouts mapped to HTTP-style codes in the library                                                |
| `BadRequestError`           | 400 / malformed payloads                                                                          |
| `UnsupportedOperationError` | Capability mismatch (missing embedding support, responses on a completion-only vendor, …)         |
| `ProviderNotAvailableError` | Optional dependency not installed; message includes **`pip install giskard-llm[extra]`** guidance |

## Retries

**`should_retry`** (re-exported from `giskard.llm`) — heuristic used by callers to classify retry-worthy failures alongside their own backoff policy.
