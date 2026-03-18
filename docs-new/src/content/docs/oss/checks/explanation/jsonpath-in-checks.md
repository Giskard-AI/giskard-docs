---
title: JSONPath in checks
sidebar:
  order: 4
---

Built-in checks like `Groundedness`, `StringMatching`, and `LesserThan` accept path parameters (`key`, `answer_key`, `text_key`) that point into the trace. This page covers the syntax.

## The `trace.` Prefix

All paths must start with `trace.`:

```python
# Correct
Groundedness(answer_key="trace.last.outputs.answer", ...)

# Wrong — raises an error
Groundedness(answer_key="last.outputs.answer", ...)
```

## trace.last

`trace.last` is shorthand for `trace.interactions[-1]` — the most recent interaction. Use an explicit index to reference earlier turns in multi-turn scenarios:

```python
key = "trace.last.outputs"  # most recent
key = "trace.interactions[0].outputs"  # first interaction
key = "trace.interactions[-1].outputs"  # same as trace.last.outputs
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

When a path can't be resolved, the resolver returns a `NoMatch` sentinel instead of raising an exception. Built-in checks treat `NoMatch` as a failure with a descriptive message. In custom checks, handle it explicitly:

```python
from giskard.checks.core.extraction import resolve, NoMatch

value = resolve(trace, self.field_path)
if isinstance(value, NoMatch):
    return CheckResult.failure(message=f"No value at '{self.field_path}'")
```

## Paths in Jinja2 Templates

LLM-based check prompts use Jinja2. Inside a template, `trace` is a variable — use the same dot notation without quoting:

```jinja2
User: {{ trace.last.inputs }}
Response: {{ trace.last.outputs }}
Turn 1: {{ trace.interactions[0].outputs }}
```
