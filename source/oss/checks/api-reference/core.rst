====
Core
====

Core types and base classes for building tests and checks.

.. currentmodule:: giskard.checks


Check
-----

.. autoclass:: Check
   :members:
   :undoc-members:
   :show-inheritance:
   :special-members: __init__

Base class for all checks. Subclass and register with ``@Check.register("kind")`` to create custom checks.

**Example:**

.. code-block:: python

   from giskard.checks import Check, CheckResult, Trace

   @Check.register("my_check")
   class MyCheck(Check):
       threshold: float = 0.8

       async def run(self, trace: Trace) -> CheckResult:
           # Your check logic
           return CheckResult.success("Check passed")


CheckResult
-----------

.. autoclass:: CheckResult
   :members:
   :undoc-members:
   :show-inheritance:

Result of a check execution with status, message, optional metrics, and details.

**Example:**

.. code-block:: python

   # Success
   result = CheckResult.success(
       message="Check passed",
       details={"score": 0.95}
   )

   # Failure
   result = CheckResult.failure(
       message="Check failed",
       details={"reason": "threshold not met"}
   )


Metric
------

.. autoclass:: Metric
   :members:
   :undoc-members:

Named metric value captured during check execution (e.g., scores, timings).


CheckStatus
-----------

.. autoclass:: CheckStatus
   :members:
   :undoc-members:

Enumeration of possible check statuses: ``PASS``, ``FAIL``, ``ERROR``, ``SKIP``.


Interaction
-----------

.. autoclass:: Interaction
   :members:
   :undoc-members:
   :show-inheritance:

A single exchange between inputs and outputs.

**Example:**

.. code-block:: python

   from giskard.checks import Scenario

   # Interactions are created through the fluent builder
   test_case = (
       Scenario("example")
       .interact(
           inputs="What is 2+2?",
           outputs="4",
           metadata={"model": "gpt-5", "tokens": 5}
       )
   )


Trace
-----

.. autoclass:: Trace
   :members:
   :undoc-members:
   :show-inheritance:

Immutable history of all interactions in a scenario.

**Example:**

.. code-block:: python

   from giskard.checks import Scenario

   # Create a scenario with multiple interactions
   test_scenario = (
       Scenario("example_trace")
       .interact(inputs="Hello", outputs="Hi!")
       .interact(inputs="How are you?", outputs="I'm well!")
   )

   # After running, access the trace
   result = await test_scenario.run()
   last = result.final_trace.last


InteractionSpec
---------------

.. autoclass:: InteractionSpec
   :members:
   :undoc-members:
   :show-inheritance:

Declarative specification for generating interactions.

**Example:**

.. code-block:: python

   from giskard.checks import Scenario

   # Static values
   test_case = (
       Scenario("static_example")
       .interact(
           inputs="test input",
           outputs="test output"
       )
   )

   # Callable outputs
   test_case = (
       Scenario("dynamic_example")
       .interact(
           inputs="test",
           outputs=lambda inputs: my_function(inputs)
       )
   )


Interact
--------

.. autoclass:: Interact
   :members:
   :undoc-members:
   :show-inheritance:

Concrete interaction specification for defining exchanges with a system. Use ``Interact(inputs=..., outputs=...)`` directly or via ``Scenario(...).interact(...)``.


Scenario
--------

.. autoclass:: Scenario
   :members:
   :undoc-members:
   :show-inheritance:

Ordered sequence of steps (interactions and checks) with shared trace. Create with ``Scenario(name)`` and chain ``.interact()`` and ``.check()`` methods.

**Example:**

.. code-block:: python

   from giskard.checks import Scenario, from_fn

   test_scenario = (
       Scenario("test_flow")
       .interact(inputs="hello", outputs="hi")
       .check(from_fn(lambda trace: True, name="check1"))
       .interact(inputs="bye", outputs="goodbye")
   )

   result = await test_scenario.run()


Step
----

.. autoclass:: Step
   :members:
   :undoc-members:
   :show-inheritance:

A scenario step groups interactions and checks. Steps are created implicitly when building a Scenario.


TestCase
--------

.. autoclass:: TestCase
   :members:
   :undoc-members:
   :show-inheritance:

.. note::
   **Internal Implementation Detail**: ``TestCase`` is an internal implementation detail. Users should always use ``Scenario()`` to create scenarios, which internally uses TestCase. The ``Scenario(name)`` constructor creates a Scenario (a list of steps) and is the primary user-facing API.

**Example using Scenario() (recommended):**

.. code-block:: python

   from giskard.checks import Scenario, from_fn

   test_scenario = (
       Scenario("my_test")
       .interact(inputs="test", outputs="result")
       .check(from_fn(lambda trace: True, name="check1"))
       .check(from_fn(lambda trace: True, name="check2"))
   )

   result = await test_scenario.run()


Extraction
----------

Checks use JSONPath expressions via the ``key`` parameter (e.g., ``key="trace.last.outputs.answer"``) to extract values from traces. Paths must start with ``trace.``.


Configuration
-------------

.. autofunction:: set_default_generator

Set the default LLM generator for LLM-based checks.

**Example:**

.. code-block:: python

   from giskard.agents.generators import Generator
   from giskard.checks import set_default_generator

   set_default_generator(Generator(model="openai/gpt-5-mini"))


.. autofunction:: get_default_generator

Get the currently configured default generator.


ScenarioRunner
--------------

.. autoclass:: ScenarioRunner
   :members:
   :undoc-members:
   :show-inheritance:

Low-level runner for executing scenarios.
