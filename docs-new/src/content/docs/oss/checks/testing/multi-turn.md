---
title: Multi-Turn Scenarios
sidebar:
  order: 4
---

Multi-turn scenarios test conversational flows, stateful interactions,
and complex workflows that span multiple exchanges. Use them to verify
that your system stays compliant, consistent, and safe across an entire
conversation.

Many AI applications involve multiple interactions:

- **Agents** that use tools across multiple steps
- **Chatbots** that maintain conversation context
- **Conversational RAG** where follow-up questions reference earlier
  context

# Using Scenarios

The `Scenario` class executes multiple interaction specs and checks in
sequence with a shared trace.

## Basic Multi-Turn Flow

**Why this matters:** Multi-step conversations are where guardrails most
often erode. A safe first reply can still lead to data leakage or policy
violations in later turns.

``` python
from giskard.checks import scenario, StringMatching

test_scenario = (
    scenario("incident_intake")
    # First interaction
    .interact(
        inputs="I think my account was compromised.",
        outputs=lambda inputs: (
            "Thanks. I have opened case ID SEC-1042. "
            "Can you confirm the last transaction?"
        )
    )
    .check(
        StringMatching(
            name="case_id_provided",
            keyword="SEC-",
            text_key="trace.last.outputs"
        )
    )
    # Second interaction
    .interact(
        inputs="The last transfer was $9,000 to ACME Ltd.",
        outputs=lambda inputs: (
            "Understood. I escalated this as potential fraud "
            "and locked the account."
        )
    )
    .check(
        StringMatching(
            name="escalation_confirmed",
            keyword="escalated",
            text_key="trace.last.outputs"
        )
    )
)

result = await test_scenario.run()
print(f"Scenario passed: {result.passed}")
```

**Key Points:**

- Components execute in sequence
- Checks can reference any interaction via the trace
- Execution stops at the first failing check
- All components share the same trace

# Stateful Conversations

**Why this matters:** Losing context can misroute incidents, expose
private data, or break compliance workflows.

Test systems that maintain conversation state:

``` python
from giskard.checks import scenario, from_fn

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

        self.conversation_history.append({"role": "assistant", "content": response})
        return response

bot = Chatbot()

test_scenario = (
    scenario("case_id_memory")
    .interact(
        inputs="My case ID is SEC-1042.",
        outputs=lambda inputs: bot.chat(inputs)
    )
    .check(
        from_fn(
            lambda trace: "SEC-1042" in trace.last.outputs,
            name="acknowledges_case_id"
        )
    )
    .interact(
        inputs="What case are we discussing?",
        outputs=lambda inputs: bot.chat(inputs)
    )
    .check(
        from_fn(
            lambda trace: "SEC-1042" in trace.last.outputs,
            name="remembers_case_id",
            success_message="Correctly recalled the case ID",
            failure_message="Failed to recall the case ID"
        )
    )
)

result = await test_scenario.run()
```

# Testing Agent Workflows

**Why this matters:** Agents that select the wrong tool or reasoning
path can violate policy, leak data, or skip critical steps.

Test multi-step agent workflows with tool usage:

``` python
from giskard.agents.generators import Generator
from giskard.checks import (
    scenario,
    LLMJudge,
    from_fn,
    set_default_generator
)

set_default_generator(Generator(model="openai/gpt-5-mini"))

class Agent:
    def __init__(self):
        self.available_tools = ["search", "calculator", "database"]

    def run(self, task: str) -> dict:
        # Your agent logic
        return {
            "thought": "I need to search for information",
            "action": "search",
            "action_input": "Python tutorial",
            "observation": "Found 10 Python tutorials",
            "final_answer": "Here are some Python tutorials..."
        }

agent = Agent()

test_scenario = (
    scenario("policy_research_agent")
    # Agent receives task
    .interact(
        inputs="Find the policy section on export-controlled data sharing.",
        outputs=lambda inputs: agent.run(inputs)
    )
    # Check that agent chose appropriate tool
    .check(
        from_fn(
            lambda trace: trace.last.outputs["action"] == "search",
            name="correct_tool_choice",
            success_message="Agent selected search tool",
            failure_message="Agent selected wrong tool"
        )
    )
    # Validate reasoning
    .check(
        LLMJudge(
            name="reasoning_quality",
            prompt="""
            Evaluate the agent's reasoning.

            Task: {{ trace.interactions[0].inputs }}
            Thought: {{ trace.interactions[0].outputs.thought }}
            Action: {{ trace.interactions[0].outputs.action }}

            Return 'passed: true' if the reasoning is logical and appropriate.
            """
        )
    )
    # Check final answer quality
    .check(
        LLMJudge(
            name="answer_quality",
            prompt="""
            Evaluate if the final answer addresses the original task.

            Task: {{ trace.interactions[0].inputs }}
            Answer: {{ trace.interactions[0].outputs.final_answer }}

            Return 'passed: true' if the answer is helpful and relevant.
            """
        )
    )
)
```

# Dynamic Multi-Turn Interactions

**Why this matters:** Follow-up logic must stay aligned with prior
context to avoid compounding mistakes.

Generate interactions dynamically based on previous outputs:

``` python
from giskard.checks import scenario, from_fn, Trace

def chatbot(message: str, context: list = None) -> dict:
    # Your chatbot that tracks context
    return {"response": "...", "context": context or []}

# Second interaction depends on first response
async def generate_followup(trace: Trace):
    first_response = trace.last.outputs["response"]
    return f"Tell me more about {first_response}"

test_scenario = (
    scenario("dynamic_incident_followup")
    .interact(
        inputs="Report a suspected account takeover.",
        outputs=lambda inputs: chatbot(inputs)
    )
    .check(
        from_fn(lambda trace: len(trace.interactions) == 1, name="first_complete")
    )
    .interact(
        inputs=generate_followup,
        outputs=lambda inputs: chatbot(inputs)
    )
    .check(
        from_fn(lambda trace: len(trace.interactions) == 2, name="second_complete")
    )
)
```

# Testing Error Recovery

**Why this matters:** Error handling is where systems either fail safely
or amplify risk.

Verify that systems handle errors gracefully across turns:

``` python
from giskard.checks import scenario, from_fn, LLMJudge

class RobustChatbot:
    def chat(self, message: str) -> dict:
        if not message.strip():
            return {
                "error": "Empty message",
                "response": "I didn't receive a message. Could you try again?"
            }
        return {"response": "I understand."}

bot = RobustChatbot()

test_scenario = (
    scenario("error_recovery")
    # Send invalid input
    .interact(
        inputs="",
        outputs=lambda inputs: bot.chat(inputs)
    )
    .check(
        from_fn(
            lambda trace: "error" in trace.last.outputs,
            name="detects_error"
        )
    )
    .check(
        from_fn(
            lambda trace: trace.last.outputs["response"],
            name="provides_feedback",
            success_message="Bot provided error feedback"
        )
    )
    # Send valid follow-up
    .interact(
        inputs="Hello",
        outputs=lambda inputs: bot.chat(inputs)
    )
    .check(
        from_fn(
            lambda trace: "error" not in trace.last.outputs,
            name="recovers_from_error",
            success_message="System recovered successfully"
        )
    )
)
```

# Conversational RAG

**Why this matters:** Follow-up questions often revisit sensitive
policies where hallucinations create legal exposure.

Test RAG systems with follow-up questions and context references:

``` python
from giskard.checks import scenario, Groundedness, from_fn

class ConversationalRAG:
    def __init__(self):
        self.conversation_history = []

    def answer(self, question: str) -> dict:
        # Retrieve context considering conversation history
        context = self.retrieve(question, self.conversation_history)
        answer = self.generate(question, context, self.conversation_history)

        self.conversation_history.append({
            "question": question,
            "answer": answer,
            "context": context
        })

        return {"answer": answer, "context": context}

    def retrieve(self, question, history):
        # Your retrieval logic
        return ["context chunk 1", "context chunk 2"]

    def generate(self, question, context, history):
        # Your generation logic
        return "Answer based on context..."

rag = ConversationalRAG()

test_scenario = (
    scenario("policy_rag_followups")
    # Initial question
    .interact(
        inputs="What is our data retention policy for KYC documents?",
        outputs=lambda inputs: rag.answer(inputs)
    )
    .check(
        Groundedness(
            name="first_answer_grounded",
            answer_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.context",
        )
    )

    # Follow-up with pronoun reference
    .interact(
        inputs="Does that policy apply to archived records too?",
        outputs=lambda inputs: rag.answer(inputs)
    )
    .check(
        Groundedness(
            name="followup_grounded",
            answer_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.context",
        )
    )
    .check(
        from_fn(
            lambda trace: len(trace.interactions) == 2,
            name="maintains_context",
            success_message="System handled follow-up correctly"
        )
    )

    # Another follow-up
    .interact(
        inputs="Can you summarize the retention timeline?",
        outputs=lambda inputs: rag.answer(inputs)
    )
    .check(
        Groundedness(
            name="second_followup_grounded",
            answer_key="trace.last.outputs.answer",
            context_key="trace.last.outputs.context",
        )
    )
)
```

# Task Completion Tracking

**Why this matters:** Multi-step task flows often power customer
operations, and missing a step can create costly remediation.

Test that multi-step tasks are completed successfully:

``` python
from giskard.checks import scenario, from_fn, LLMJudge

class TaskAgent:
    def __init__(self):
        self.tasks = []
        self.completed = []

    def process(self, instruction: str) -> dict:
        # Parse and execute tasks
        if "add task" in instruction.lower():
            task = instruction.split("add task")[-1].strip()
            self.tasks.append(task)
            return {"status": "added", "tasks": self.tasks.copy()}
        elif "complete" in instruction.lower():
            if self.tasks:
                completed = self.tasks.pop(0)
                self.completed.append(completed)
                return {"status": "completed", "task": completed}
            return {"status": "no_tasks"}
        elif "list tasks" in instruction.lower():
            return {"status": "listed", "pending": self.tasks, "completed": self.completed}
        return {"status": "unknown"}

agent = TaskAgent()

test_scenario = (
    scenario("incident_checklist")
    # Add first task
    .interact(
        inputs="Add task: Notify security on-call",
        outputs=lambda inputs: agent.process(inputs)
    )
    .check(
        from_fn(
            lambda trace: trace.last.outputs["status"] == "added",
            name="task_added"
        )
    )

    # Add second task
    .interact(
        inputs="Add task: Lock affected accounts",
        outputs=lambda inputs: agent.process(inputs)
    )
    .check(
        from_fn(
            lambda trace: len(trace.last.outputs["tasks"]) == 2,
            name="multiple_tasks"
        )
    )

    # Complete a task
    .interact(
        inputs="Complete the first task",
        outputs=lambda inputs: agent.process(inputs)
    )
    .check(
        from_fn(
            lambda trace: trace.last.outputs["status"] == "completed",
            name="task_completed"
        )
    )

    # List remaining tasks
    .interact(
        inputs="List tasks",
        outputs=lambda inputs: agent.process(inputs)
    )
    .check(
        from_fn(
            lambda trace: (
                len(trace.last.outputs["pending"]) == 1 and
                len(trace.last.outputs["completed"]) == 1
            ),
            name="correct_task_state",
            success_message="Task state tracked correctly",
            failure_message="Task state incorrect"
        )
    )
)
```

# Best Practices

**1. Check State at Each Step**

Add checks after each interaction to validate state:

``` python
(
    scenario("example")
    .interact(...)
    .check(from_fn(lambda trace: validate_state(trace), name="state_check_1"))
    .interact(...)
    .check(from_fn(lambda trace: validate_state(trace), name="state_check_2"))
)
```

**2. Use Descriptive Scenario Names**

Name scenarios to describe the user flow:

``` python
scenario = (
    scenario("user_onboarding_collect_preferences_send_confirmation")
    ...
)
```

**3. Test Both Happy and Error Paths**

Create separate scenarios for success and failure cases:

``` python
happy_path = (
    scenario("booking_success")
    ...
)
error_path = (
    scenario("booking_invalid_date")
    ...
)
```

**4. Leverage the Full Trace**

Checks can inspect any previous interaction:

``` python
from_fn(
    lambda trace: (
        trace.interactions[0].inputs == "initial request" and
        trace.last.outputs == "final response"
    ),
    name="validates_full_flow"
)
```

# Next Steps

- Learn how to write `custom-checks` for domain-specific validation
- Explore `../tutorials/index` for complete examples
- See `single-turn` for single-interaction patterns
