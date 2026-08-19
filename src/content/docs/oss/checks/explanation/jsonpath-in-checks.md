---
title: JSONPath in checks
description: "How JSONPath expressions work in check parameters — the trace. prefix, trace.last shorthand, and common extraction patterns."
sidebar:
  order: 4
---

Built-in checks like `Groundedness`, `StringMatching`, and `LessThan` accept path parameters such as `target_key`, `context_key`, and `question_key` that point into the trace. This page covers the syntax.

## The `trace.` Prefix

All paths must start with `trace.`:

```python
# Correct
Groundedness(target_key="trace.last.outputs.answer", ...)

# Wrong — raises an error
Groundedness(target_key="last.outputs.answer", ...)
```

## trace.last

`trace.last` is shorthand for `trace.interactions[-1]` — the most recent interaction. Use an explicit index to reference earlier turns in multi-turn scenarios:

```python
target_key = "trace.last.outputs"  # most recent
target_key = "trace.interactions[0].outputs"  # first interaction
target_key = "trace.interactions[-1].outputs"  # same as trace.last.outputs
```

## Common Patterns

| Path                            | What it accesses             |
| ------------------------------- | ---------------------------- |
| `trace.last.inputs`             | Last interaction inputs      |
| `trace.last.outputs`            | Last interaction outputs     |
| `trace.last.outputs.answer`     | Nested field in output dict  |
| `trace.last.outputs.confidence` | Numeric field in output dict |
| `trace.last.metadata.model`     | Metadata field               |
| `trace.interactions[0].inputs`  | First interaction inputs     |

## NoMatch

When a path can't be resolved, the resolver returns a `NoMatch` sentinel instead of raising an exception. Every built-in check turns `NoMatch` into `CheckResult.error`, not a failure, with a message naming the path it could not resolve.

The distinction matters when you read results. A failure means the check ran and your agent did not meet the bar. An error means the check could not run at all, usually because you typed the path wrong or the output shape changed. Code that branches on `result.failed` will skip every unresolved-path case, so check `result.errored` too:

```python
if result.errored:
    ...  # the path did not resolve, or the value had the wrong type
```

Follow the same convention in custom checks:

```python
from giskard.checks.core.extraction import resolve, NoMatch

value = resolve(trace, self.field_path)
if isinstance(value, NoMatch):
    return CheckResult.error(message=f"No value at '{self.field_path}'")
```

## Paths in Jinja2 Templates

LLM-based check prompts use Jinja2. Inside a template, `trace` is a variable — use the same dot notation without quoting:

```jinja2
User: {{ trace.last.inputs }}
Response: {{ trace.last.outputs }}
Turn 1: {{ trace.interactions[0].outputs }}
```
