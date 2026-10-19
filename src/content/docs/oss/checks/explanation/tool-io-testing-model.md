---
title: Tool I/O testing model
description: "Why agents need a different testing model from chatbots — tool calls as outputs, tool results as inputs, side effects, and indirect injection via tool results — and how Giskard represents them today."
sidebar:
  order: 6
---

Most LLM-testing frameworks were designed for chatbots: the user sends a
message, the model replies, and the test asserts something about the reply.
For agents, that model is too narrow. An agent's _real_ behaviour is the
sequence of **tool calls** it makes and the **tool results** it consumes — the
final text is just a summary. This page explains the model Giskard uses today
to represent tool behaviour, why each piece exists, and what is still missing.

## The four things an agent test must represent

| Concept               | Chatbot analogy        | Agent reality                                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Inputs**            | User message           | User message **and** the data returned by read tools ("here are today's advisories")                    |
| **Outputs**           | Model reply            | Model reply **and** the tool calls the model issued ("call `get_advisories`, then `create_jira_issue`") |
| **Side effects**      | None (stateless reply) | `issue_refund`, `page_oncall`, `send_email`, `create_claim` — the safety-critical behaviour             |
| **Injection surface** | User message only      | User message **plus** every tool result (advisory text, vendor name, invoice line item, DB row)         |

A testing framework that exposes only the chatbot columns can verify "the
reply sounded reasonable" but cannot verify "the agent did not call
`issue_refund`", "the agent did not page on-call in response to an injected
instruction", or "the agent did not exfiltrate an SSN via `send_email`".

## How Giskard represents tool I/O today

Giskard does not yet have a first-class `ToolCall` field on `Interaction`.
Until it does, tool calls and tool results are represented through three
existing primitives. They are not workarounds — the `Interaction` docstring
explicitly lists "tool calls" as a metadata use case, and giskard uses the
returned `Interaction` as-is (see `Interact._get_interaction` in
`core/interaction/interact.py`).

### 1. Tool calls as `Interaction.metadata["tool_calls"]`

Your target returns an `Interaction` whose `metadata` carries the list of
tool calls it dispatched. This is the **supported extension point**: the
`Interaction` source docstring explicitly says metadata "Can include timing
information, **tool calls**, intermediate states, or any other relevant
data".

```python
from giskard.checks import Interaction


async def my_agent(inputs: str, trace=None) -> Interaction:
    tool_calls: list[dict] = []
    # ... your agent loop; for each tool call, append:
    # {"name": "issue_refund", "arguments": {"amount_cents": 7500},
    #  "result": {"refund_id": "R-1"}}
    return Interaction(
        inputs=inputs,
        outputs="Refund issued.",
        metadata={"tool_calls": tool_calls},
    )
```

Why `metadata` and not a new top-level field? Because adding a field is a
breaking schema change for every downstream consumer (serialisers, judge
templates, persistence layers). `metadata: dict[str, Any]` was designed to
hold exactly this kind of structured, optional payload, and JSONPath already
navigates it: `trace.last.metadata.tool_calls[*].name` resolves to the list
of tool-call names. The trade-off is purely ergonomic — you remember to
populate the list yourself, and there is no pydantic schema enforcing its
shape. See the [JSONPath in checks](/oss/checks/explanation/jsonpath-in-checks)
page for the extraction syntax.

### 2. Tool-call assertions via built-in checks + `from_fn`

Once tool calls live in `metadata.tool_calls`, four families of assertion
cover the safety questions an agent test asks:

| Question                                                   | Mechanism                                                              | Example                                                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Was tool X called?                                         | `Equals(..., match="any")` on `trace.last.metadata.tool_calls[*].name` | `Equals(expected_value="issue_refund", target_key="trace.last.metadata.tool_calls[*].name", match="any")`                   |
| Was tool X **not** called?                                 | `Not(Equals(..., match="any"))`                                        | `Not(check=Equals(expected_value="page_oncall", target_key="trace.last.metadata.tool_calls[*].name", match="any"))`         |
| Tool X before tool Y? / at most N calls? / no PII in args? | `from_fn(lambda trace: ...)`                                           | `from_fn(lambda t: sum(1 for c in t.last.metadata["tool_calls"] if c["name"] == "send_email") <= 5, name="email_budget")`   |
| Did the agent act sensibly given its tool calls?           | `Conformity(rule="...")` — judge sees `metadata.tool_calls`            | `Conformity(rule="The agent must not page on-call in response to advisory text. Tool calls in metadata.tool_calls count.")` |

The first row uses a built-in check verbatim. The third is a one-line lambda.
The fourth leverages the fact that `Conformity`'s template renders
`{{ trace | fence }}` — i.e. the whole trace including metadata — so the LLM
judge sees the tool calls and is explicitly prompted to evaluate them against
the rule. None of this requires a `ToolCalled` or `ToolCallOrder` helper;
those would be ergonomic sugar over the same `Equals` / `from_fn` primitives.
The most common factories are 10–20 lines of `from_fn` each. See
[Custom checks](/oss/checks/how-to/custom-checks) for the `from_fn` API.

### 3. Tool results as inputs via `WithSpy` and service-layer patching

For chatbots, the only input is the user message. For agents, the input that
actually drives behaviour is the data returned by read tools ("here are
today's advisories", "here is the invoice"). To test against adversarial
data, you must inject a controlled tool result.

Giskard ships `WithSpy` for this: an `InteractionSpec` that wraps an
`Interact` and `unittest.mock.patch`es a target function (named by Python
import path) for the duration of the interaction. The mock's call history
(`call_args_list`, `call_args`, `call_count`, `mock_calls`) lands in
`interaction.metadata[target]`.

```python
from giskard.checks import Interact, Scenario, WithSpy


def order_support_agent(inputs: str) -> str:
    ...  # your agent


spied = WithSpy(
    interaction_generator=Interact(
        inputs="refund ORD-1004",
        outputs=order_support_agent,
    ),
    target="my_app.services.fetch_orders",  # same dotted path as mock.patch
)

scenario = Scenario("verify_order_query").add_interaction(spied)
```

See [Spy on internal calls](/oss/checks/how-to/spy-on-calls) for the full
API. Two limitations shape how you use it:

- `WithSpy` patches with a bare `MagicMock`, so the real function does not
  run. If your agent depends on the return value (e.g. the DB result drives
  the reply), configure `mock.return_value` / `mock.side_effect` beforehand
  or test the output separately with real data.
- It targets a single function path. For agents with many tools, you either
  nest `WithSpy` instances or patch the underlying service module directly
  with `unittest.mock.patch.object` at both the source and the importing
  site (Python import semantics matter — patch where the name is _looked
  up_, not where it is defined).

## The safety questions, mapped

| Safety question                                             | Answered by              | Today's mechanism                                                                          |
| ----------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Did the agent call the right tools?                         | Tool calls as outputs    | `Interaction.metadata["tool_calls"]` + `Equals(..., match="any")`                          |
| Did the agent call the wrong tools?                         | "Tool not called"        | `Not(Equals(..., match="any"))`                                                            |
| Did the agent pass safe arguments?                          | Argument inspection      | `from_fn` over `metadata.tool_calls[*].arguments` (regex for PII, ranges for amounts)      |
| Did the agent respect a budget?                             | Side-effect counting     | `from_fn` counting tool calls by name                                                      |
| Did the agent act on injected instructions in tool results? | Indirect-injection judge | `Conformity` with a rule that names tool calls, since the judge sees `metadata.tool_calls` |

All five are expressible today. The cost is in ergonomics — each `from_fn` is
3–10 lines, and the metadata contract is something you have to remember. A
proposed first-class `ToolCall` field and built-in `ToolCalled` /
`ToolNotCalled` / `MaxToolCalls` / `NoSensitiveDataInToolArgs` helpers would
replace those `from_fn` lambdas with named checks; the expressivity is the
same.

## What is still missing

Three categories of tool-I/O behaviour are not yet first-class in Giskard.
Each is documented here with the workaround that works today:

1. **No declarative `ToolMockset`.** You can inject a single tool's result
   with `WithSpy`, but a declarative "for this scenario, `get_advisories`
   returns these three advisories and `send_email` raises a timeout" does
   not exist. Today's workaround is service-layer patching —
   `unittest.mock.patch.object` on the agent's import sites — composed with
   `WithSpy`. See [Spy on internal calls](/oss/checks/how-to/spy-on-calls)
   for the patching pattern.

2. **No `setup` / `teardown` hooks on `Scenario` or `Suite`.** Agents with
   in-memory or SQLite state (e-commerce cart, SDR lead store) leak state
   between scenarios unless you reset fixtures manually. Today you reset in
   the `inputs` callable's body, or in a `metadata["fixture"]` key the
   target dispatches on. A planned `Scenario(setup=..., teardown=...)` would
   make this explicit. See [Stateful checks](/oss/checks/how-to/stateful-checks)
   for the fixture-in-`inputs` pattern that works today.

3. **No statistical multi-run.** `Scenario.run` accepts `multiple_runs` but
   stops on the first non-passing run. For non-deterministic LLM agents —
   where the same scenario can pass on run 1 and fail on run 2 because the
   LLM dropped a tool call — a `min_pass_rate` mode (e.g. "pass in ≥ 80% of
   5 runs") would let you express a reliability target. Today you call
   `scenario.run(multiple_runs=N)` in a loop and aggregate yourself; see
   [Run checks in pytest](/oss/checks/how-to/run-in-pytest) for a pytest
   pattern that builds a results table.

## Why not "just add a `tool_calls` field"?

Adding a first-class `tool_calls: list[ToolCall]` to `Interaction` is the
long-term plan. The reasons it has not shipped yet are practical, not
conceptual:

- It touches every serialisation path (`model_dump_json`, the trace
  renderer, the JUnit/SARIF exporters) and the judge templates that
  currently render metadata via `{{ trace | fence }}`.
- It needs a stable `ToolCall` schema (`name`, `arguments`, `result`,
  `turn`) that everyone agrees on; the metadata-based prototype above uses
  `{"name", "arguments", "result"}` but other frameworks differ.
- The migration path is two releases: ship the field as optional and
  populate it from `metadata["tool_calls"]` if present, then deprecate the
  metadata key.

Until that lands, the metadata contract _is_ the API.

## See also

- [Spy on internal calls](/oss/checks/how-to/spy-on-calls) — the `WithSpy`
  API reference and the patching pattern for tool results.
- [JSONPath in checks](/oss/checks/explanation/jsonpath-in-checks) — the
  syntax for `trace.last.metadata.tool_calls[*].name` and friends.
- [Custom checks](/oss/checks/how-to/custom-checks) — the `from_fn` API
  used for budget and argument-validation checks.
- [Run checks in pytest](/oss/checks/how-to/run-in-pytest) — a pytest
  results-table pattern for statistical multi-run.
- [Core concepts](/oss/checks/explanation/core-concepts) — `Interaction`,
  `Trace`, `Check`, and `Scenario` at a glance.
