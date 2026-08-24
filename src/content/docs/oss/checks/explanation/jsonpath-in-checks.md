---
title: JSONPath in checks
description: "How JSONPath expressions work in check parameters — the trace. prefix, trace.last shorthand, and common extraction patterns."
sidebar:
  order: 4
---

Built-in checks like `Groundedness`, `StringMatching`, and `LessThan` accept path parameters such as `target_key`, `context_key`, and `question_key` that point into the trace. This page covers the syntax.

## The `trace.` Prefix

All paths must start with `trace.`:

<!-- pyright-skip: This block deliberately includes an invalid call to illustrate a bad JSONPath. -->
```python
# Correct
Groundedness(target_key="trace.last.outputs.answer", ...)

# Wrong — raises an error
Groundedness(target_key="last.outputs.answer", ...)
```

The prefix is enforced by the `JSONPathStr` field validator, so a bad path raises `ValidationError: Invalid JSONPath expression '…': path must start with 'trace.'` when you construct the check. Calling `resolve()` yourself skips that validator: a path without the prefix simply returns `NoMatch`.

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

## Multi-match paths

A path that can match more than one place in the trace — a wildcard, a slice, a union, or a descendant expression such as `trace.interactions[*].outputs.x` — resolves to a **list** of every match, not to a single value. So does any path that happens to produce more than one match:

```python
from giskard.checks import Interaction, Trace, resolve

trace = Trace(
    interactions=[
        Interaction(inputs="a", outputs={"x": 1}),
        Interaction(inputs="b", outputs={"x": 2}),
    ]
)

resolve(trace, "trace.interactions[*].outputs.x")  # [1, 2]
resolve(trace, "trace.last.outputs.x")  # 2
```

Comparison checks receive that list as a whole, so you have to tell them how to spread the comparison over it. Set `match="any"`, `"all"`, or `"none"`:

```python
from giskard.checks import GreaterThan

# Passes only if every interaction scored above 0.8
check = GreaterThan(
    expected_value=0.8,
    target_key="trace.interactions[*].metadata.retrieval_score",
    match="all",
)
```

Without `match`, the check tries to compare `0.8` against the list object itself, which Python cannot do. The check returns an ERROR with the message `Comparison not supported: list does not support > comparison with float`. If you see that message, you resolved a wildcard path and forgot `match`.

## NoMatch

When a path can't be resolved, the resolver returns a `NoMatch` sentinel instead of raising an exception. Every built-in check turns `NoMatch` into `CheckResult.error`, not a failure, with a message naming the path it could not resolve.

The distinction matters when you read results. A failure means the check ran and your agent did not meet the bar. An error means the check could not run at all, usually because you typed the path wrong or the output shape changed.

Follow the same convention in custom checks. `resolve` is a top-level export, so import it from `giskard.checks`; `NoMatch` lives in the extraction module:

<!-- pyright-skip: This is a method-body fragment; trace, self, and CheckResult come from the enclosing check. -->
```python
from giskard.checks import resolve
from giskard.checks.core.extraction import NoMatch

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
