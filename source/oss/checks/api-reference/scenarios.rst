=========
Scenarios
=========

Multi-step workflow testing with scenarios and test cases.

.. currentmodule:: giskard.checks


Scenario
--------

.. autoclass:: Scenario
   :members:
   :undoc-members:
   :show-inheritance:

A Scenario is a list of steps (interactions and checks) executed sequentially with a shared trace. You create scenarios using the ``Scenario(...)`` constructor, which is the primary user-facing API. Scenarios work for both single-turn and multi-turn tests - the distinction is conceptual, not API-based.

**Attributes:**

* ``name``: Scenario name
* ``steps``: List of components (InteractionSpecs and Checks)

**Methods:**

* ``run()``: Execute the scenario and return results

**Example:**

.. code-block:: python

   from giskard.checks import Scenario, from_fn

   test_scenario = (
       Scenario("conversation_flow")
       .interact(inputs="Hello", outputs="Hi!")
       .check(from_fn(lambda trace: "Hi" in trace.last.outputs, name="check1"))
       .interact(inputs="How are you?", outputs="I'm well!")
       .check(from_fn(lambda trace: len(trace.interactions) == 2, name="check2"))
   )

   result = await test_scenario.run()
   print(f"Passed: {result.passed}")


ScenarioResult
--------------

.. autoclass:: ScenarioResult
   :members:
   :undoc-members:
   :show-inheritance:

Result of scenario execution.

**Attributes:**

* ``passed``: Whether all checks passed
* ``final_trace``: Final trace with all interactions
* ``steps``: List of ``TestCaseResult``; each step has ``results`` (list of ``CheckResult``)
* ``duration_ms``: Total execution time in milliseconds
* ``scenario_name``: Name of the scenario that was executed


TestCase
--------

.. autoclass:: TestCase
   :members:
   :undoc-members:
   :show-inheritance:

.. note::
   **Internal Implementation Detail**: ``TestCase`` is an internal implementation detail. Users should always use ``Scenario(...)`` to create scenarios, which internally uses TestCase. The ``Scenario`` class is the primary user-facing API.

**Example using Scenario() (recommended):**

.. code-block:: python

   from giskard.checks import Scenario, StringMatching

   test_scenario = (
       Scenario("qa_test")
       .interact(
           inputs="What is the capital of France?",
           outputs=lambda inputs: "Paris"
       )
       .check(
           StringMatching(
               name="contains_paris",
               content="Paris",
               key="trace.last.outputs"
           )
       )
   )

   result = await test_scenario.run()
   assert result.passed


TestCaseResult
--------------

.. autoclass:: TestCaseResult
   :members:
   :undoc-members:
   :show-inheritance:

Result of test case execution.

**Attributes:**

* ``passed``: Whether all checks passed
* ``results``: List of CheckResult objects
* ``duration_ms``: Total execution time
* ``error``: Optional error message


Runners
-------

ScenarioRunner
~~~~~~~~~~~~~~

.. autoclass:: ScenarioRunner
   :members:
   :undoc-members:
   :show-inheritance:

Low-level runner for executing scenarios.

**Example:**

.. code-block:: python

   from giskard.checks import ScenarioRunner

   runner = ScenarioRunner()
   result = await runner.run(test_scenario)


TestCaseRunner
~~~~~~~~~~~~~~

.. autoclass:: TestCaseRunner
   :members:
   :undoc-members:
   :show-inheritance:

Low-level runner for executing test cases.


Usage Patterns
--------------

Running Multiple Test Cases
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import asyncio
   from giskard.checks import Scenario

   test_cases = [
       (
           Scenario("test1")
           .interact(...)
           .check(...)
       ),
       (
           Scenario("test2")
           .interact(...)
           .check(...)
       ),
   ]

   async def run_all():
       results = []
       for tc in test_cases:
           result = await tc.run()
           results.append((tc.name, result))

       passed = sum(1 for _, r in results if r.passed)
       print(f"Passed: {passed}/{len(results)}")

   asyncio.run(run_all())


Scenario with Dynamic Interactions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   from giskard.checks import Scenario, Trace

   async def dynamic_input(trace: Trace):
       count = len(trace.interactions)
       return f"Message #{count + 1}"

   test_scenario = (
       Scenario("dynamic_flow")
       .interact(
           inputs=dynamic_input,
           outputs=lambda inputs: f"Echo: {inputs}"
       )
       .interact(
           inputs=dynamic_input,
           outputs=lambda inputs: f"Echo: {inputs}"
       )
   )


Error Handling
~~~~~~~~~~~~~~

.. code-block:: python

   try:
       result = await tc.run()
       if not result.passed:
           print("Test failed: see individual check results")
           for step in result.steps:
               for check_result in step.results:
                   if not check_result.passed:
                       name = check_result.details.get("check_name", "check")
                       print(f"  - {name}: {check_result.message}")
   except Exception as e:
       print(f"Test execution error: {e}")
