=============
Core Concepts
=============

Understanding the key concepts in Giskard Checks will help you write effective tests for your AI applications.


Overview
--------

Giskard Checks is built around a few core primitives that work together:

* **Interaction**: A single turn of data exchange (inputs and outputs)
* **InteractionSpec**: A specification for generating interactions dynamically
* **Trace**: An immutable snapshot of all interactions in a scenario
* **Check**: A validation that runs on a trace and returns a result
* **Scenario**: A list of steps (interactions and checks) executed sequentially

Interaction
-----------

An ``Interaction`` represents a single turn of data exchange with the system under test.

.. code-block:: python

   from giskard.checks import scenario

   # Interactions are created through the fluent builder
   test_case = (
       scenario("example_interaction")
       .interact(
           inputs="What is the capital of France?",
           outputs="The capital of France is Paris.",
           metadata={"model": "gpt-4", "tokens": 15, "latency_ms": 234}
       )
   )

**Properties:**

* ``inputs``: The input to your system (string, dict, Pydantic model, etc.)
* ``outputs``: The output from your system (any serializable type)
* ``metadata``: Optional dictionary for additional context (timings, model info, etc.)

Interactions are **immutable**, as they represent something that has already happened.


InteractionSpec
---------------

An ``InteractionSpec`` describes *how* to generate an interaction. Both inputs and outputs can be generated dynamically:

.. code-block:: python

   from giskard.checks import scenario
   from openai import OpenAI
   import random

   def generate_random_question() -> str:
       return f"What is 2 + {random.randint(0, 10)}?"

    def generate_answer(inputs: str) -> str:
        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": inputs}],
        )
        return response.choices[0].message.content

   test_case = (
       scenario("dynamic_interaction")
       .interact(
           inputs=generate_random_question,
           outputs=generate_answer,
           metadata={
               "category": "math",
               "difficulty": "easy"
           }
       )
   )

This is very common when you are testing multi-turn scenarios, where inputs and outputs are generated based on previous interactions. See TODO for practical examples.

Trace
-----

A ``Trace`` is an immutable snapshot of all data exchanged with the system under test. In its simplest form, it is a list of interactions.

.. code-block:: python

   from giskard.checks import scenario

   # Create a scenario with multiple interactions
   test_scenario = (
       scenario("multi_interaction_example")
       .interact(inputs="Hello", outputs="Hi there!")
       .interact(inputs="How are you?", outputs="I'm doing well, thanks!")
   )

Traces can also be created from ``InteractionSpec`` objects. In that case, the generation is performed immediately to resolve each spec into a frozen interaction.


Checks
------

A ``Check`` validates something about a trace and returns a ``CheckResult``. There's a library of built-in checks, but you can also create your own.

When referencing values in a trace, use JSONPath expressions that start with ``trace.``. The ``last`` property is a shortcut for ``interactions[-1]`` and can be used in both JSONPath keys and Python code.

.. code-block:: python

   from giskard.checks import Groundedness, Trace

   check = Groundedness(
        answer_key="trace.last.outputs",
        context="Giskard Checks is a testing framework for AI systems."
   )


Creating Scenarios with Checks
-------------------------------

A ``Scenario`` combines interactions and checks. You create scenarios using the ``scenario()`` function, which returns a Scenario (a list of steps). This works for both single-turn and multi-turn tests.

.. code-block:: python

   from giskard.checks import scenario

   test_scenario = (
       scenario("test_with_checks")
       .interact(inputs="test input", outputs="test output")
       .check(check1)
       .check(check2)
   )

   result = await test_scenario.run()

.. note::
   The ``run()`` method is asynchronous. When running in a script, use ``asyncio.run()``:

   .. code-block:: python

      import asyncio

      async def main():
          result = await test_scenario.run()
          return result

      result = asyncio.run(main())

   In async contexts (like pytest with ``@pytest.mark.asyncio``), you can use ``await`` directly.

This will give us a result object with the results of the checks.

.. note::
   **Internal Note**: ``TestCase`` is an internal implementation detail. Users should always use ``scenario()`` to create scenarios, which internally uses TestCase.


Scenario
--------

A ``Scenario`` is a list of steps (interactions and checks) that are executed sequentially with a shared trace. You create scenarios using the ``scenario()`` function, which is the primary user-facing API. Scenarios work for both single-turn and multi-turn tests.

The distinction between single-turn and multi-turn is conceptual - both use the same ``scenario()`` API. For multi-turn scenarios, you simply add multiple interactions and checks in sequence.

For example, we can test a simple conversation flow with two turns:

.. code-block:: python

   from giskard.checks import scenario, Conformity

   test_scenario = (
       scenario("conversation_flow")
       .interact(inputs="Hello", outputs=generate_answer)
       .check(Conformity(key="trace.last.outputs", rule="response should be a friendly greeting"))
       .interact(inputs="Who invented the HTML?", outputs=generate_answer)
       .check(Conformity(key="trace.last.outputs", rule="response should mention Tim Berners-Lee as the inventor of HTML"))
   )

   # Run with asyncio.run() if in a script
   import asyncio
   result = await test_scenario.run()  # or: result = asyncio.run(test_scenario.run())
