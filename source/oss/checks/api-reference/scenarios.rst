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

A Scenario is a list of steps (interactions and checks) executed sequentially with a shared trace. You create scenarios using the ``scenario()`` function, which is the primary user-facing API. Scenarios work for both single-turn and multi-turn tests - the distinction is conceptual, not API-based.

**Attributes:**

* ``name``: Scenario name
* ``sequence``: List of components (InteractionSpecs and Checks)

**Methods:**

* ``run()``: Execute the scenario and return results

**Example:**

.. code-block:: python

   from giskard.checks import scenario, from_fn

   test_scenario = (
       scenario("conversation_flow")
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
* ``trace``: Final trace with all interactions
* ``results``: List of CheckResult objects
* ``duration_ms``: Total execution time in milliseconds
* ``error``: Optional error message if execution failed


TestCase
--------

.. autoclass:: TestCase
   :members:
   :undoc-members:
   :show-inheritance:

.. note::
   **Internal Implementation Detail**: ``TestCase`` is an internal implementation detail. Users should always use ``scenario()`` to create scenarios, which internally uses TestCase. The ``scenario()`` function creates a Scenario (a list of steps) and is the primary user-facing API.

**Example using scenario() (recommended):**

.. code-block:: python

   from giskard.checks import scenario, StringMatching

   test_scenario = (
       scenario("qa_test")
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
   from giskard.checks import scenario

   test_cases = [
       (
           scenario("test1")
           .interact(...)
           .check(...)
       ),
       (
           scenario("test2")
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

   from giskard.checks import scenario, Trace

   async def dynamic_input(trace: Trace):
       count = len(trace.interactions)
       return f"Message #{count + 1}"

   test_scenario = (
       scenario("dynamic_flow")
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
           print(f"Test failed: {result.error or 'See individual check results'}")
           for check_result in result.results:
               if not check_result.passed:
                   print(f"  - {check_result.name}: {check_result.message}")
   except Exception as e:
       print(f"Test execution error: {e}")
