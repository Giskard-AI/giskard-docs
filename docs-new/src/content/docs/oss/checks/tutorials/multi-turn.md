---
title: Multi-Turn Scenarios
sidebar:
  order: 3
---

Multi-turn scenarios test conversational flows, stateful interactions, and
complex workflows that span multiple exchanges. Use them to verify that your
system stays compliant, consistent, and safe across an entire conversation.

Many AI applications involve multiple interactions:

- **Agents** that use tools across multiple steps
- **Chatbots** that maintain conversation context
- **Conversational RAG** where follow-up questions reference earlier context

## Using Scenarios

The `Scenario` class executes multiple interaction specs and checks in sequence
with a shared trace. Because every interaction appends to the same trace, a
check at step 3 can inspect what was said at step 1 — making it possible to
assert on behaviour that spans the whole conversation.

## Basic Multi-Turn Flow

The example below models a two-step incident intake: the first turn verifies
that a case ID is issued, and the second verifies that escalation is confirmed.
Each check fires immediately after its own turn so you know exactly which step
produced an unexpected result.

```python
from giskard.checks import Scenario, StringMatching

test_scenario = (
    Scenario("incident_intake")
    # First interaction
    .interact(
        inputs="I think my account was compromised.",
        outputs=lambda inputs: (
            "Thanks. I have opened case ID SEC-1042. "
            "Can you confirm the last transaction?"
        ),
    )
    .check(
        StringMatching(
            name="case_id_provided",
            keyword="SEC-",
            text_key="trace.last.outputs",
        )
    )
    # Second interaction
    .interact(
        inputs="The last transfer was $9,000 to ACME Ltd.",
        outputs=lambda inputs: (
            "Understood. I escalated this as potential fraud "
            "and locked the account."
        ),
    )
    .check(
        StringMatching(
            name="escalation_confirmed",
            keyword="escalated",
            text_key="trace.last.outputs",
        )
    )
)

result = await test_scenario.run()
print(f"Scenario passed: {result.passed}")
```

Add a check after every `.interact()` call — not just at the end. This pinpoints
exactly which turn broke the expected behavior.

**Key Points:**

- Components execute in sequence
- Checks can reference any interaction via the trace
- Execution stops at the first failing check
- All components share the same trace

## Stateful Conversations

The basic flow above uses hard-coded outputs. Now we'll test a real stateful
system where the chatbot maintains its own conversation history and must recall
information from an earlier turn.

```python
from giskard.checks import Scenario, from_fn


class Chatbot:
    def __init__(self):
        self.conversation_history = []

    def chat(self, message: str) -> str:
        self.conversation_history.append({"role": "user", "content": message})

        # Your chatbot logic
        if "case id is" in message.lower():
            case_id = message.split("case id is")[-1].strip()
            response = f"Got it. I am tracking case {case_id}."
        elif "what case are we" in message.lower():
            # Reference earlier context
            for msg in reversed(self.conversation_history):
                if "case id is" in msg.get("content", "").lower():
                    case_id = msg["content"].split("case id is")[-1].strip()
                    response = f"We are discussing case {case_id}."
                    break
            else:
                response = "I don't see a case ID yet."
        else:
            response = "I understand."

        self.conversation_history.append(
            {"role": "assistant", "content": response}
        )
        return response


bot = Chatbot()

test_scenario = (
    Scenario("case_id_memory")
    .interact(
        inputs="My case ID is SEC-1042.",
        outputs=lambda inputs: bot.chat(inputs),
    )
    .check(
        from_fn(
            lambda trace: "SEC-1042" in trace.last.outputs,
            name="acknowledges_case_id",
        )
    )
    .interact(
        inputs="What case are we discussing?",
        outputs=lambda inputs: bot.chat(inputs),
    )
    .check(
        from_fn(
            lambda trace: "SEC-1042" in trace.last.outputs,
            name="remembers_case_id",
            success_message="Correctly recalled the case ID",
            failure_message="Failed to recall the case ID",
        )
    )
)

result = await test_scenario.run()
```

This tells Giskard to call `bot.chat()` for each turn and assert that the case
ID surfaces in both responses. If the second check fails, you immediately know
the chatbot lost context between turns rather than having to trace through a
generic failure.

Name each scenario after the user flow it covers, for example `case_id_memory`
or `booking_invalid_date`. This makes failure reports immediately readable.

## Next step

The next tutorial shows how to build inputs that adapt to previous outputs:

[Dynamic Scenarios](/oss/checks/tutorials/dynamic-scenarios/)

## See also

- [Test Suites](/oss/checks/tutorials/test-suites/) — run multiple scenarios
  together
- [Testing Agents](/oss/checks/use-cases/testing-agents/) — domain-specific
  agent patterns
- [Chatbot Testing](/oss/checks/use-cases/chatbot-testing/) — conversational
  testing patterns
