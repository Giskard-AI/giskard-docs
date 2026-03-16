==============
Built-in Checks
==============

Ready-to-use checks for common testing scenarios.

.. currentmodule:: giskard.checks


Function-Based Checks
---------------------

from_fn
~~~~~~~

.. autofunction:: from_fn

Create a check from a simple function.

**Example:**

.. code-block:: python

   from giskard.checks import from_fn, Trace

   def my_validation(trace: Trace) -> bool:
       return len(trace.last.outputs) > 10

   check = from_fn(
       my_validation,
       name="min_length",
       success_message="Output is long enough",
       failure_message="Output too short"
   )


FnCheck
~~~~~~~

.. autoclass:: FnCheck
   :members:
   :undoc-members:
   :show-inheritance:

Check class created by ``from_fn``.


String Matching
---------------

StringMatching
~~~~~~~~~~~~~~~~~~~

.. autoclass:: StringMatching
   :members:
   :undoc-members:
   :show-inheritance:

Check if a keyword appears within a text string.

**Example:**

.. code-block:: python

   from giskard.checks import StringMatching

   check = StringMatching(
       name="contains_answer",
       keyword="Paris",
       text_key="trace.last.outputs.answer"
   )


Comparison Checks
-----------------

Equals
~~~~~~

.. autoclass:: Equals
   :members:
   :undoc-members:
   :show-inheritance:

Check if extracted value equals expected value.

**Example:**

.. code-block:: python

   from giskard.checks import Equals

   check = Equals(
       name="correct_confidence",
       expected_value=0.95,
       key="trace.last.outputs.confidence"
   )

NotEquals
~~~~~~~~~

.. autoclass:: NotEquals
   :members:
   :undoc-members:
   :show-inheritance:

Check if extracted value does not equal expected value.

**Example:**

.. code-block:: python

   from giskard.checks import NotEquals

   check = NotEquals(
       name="non_empty_answer",
       expected_value="",
       key="trace.last.outputs.answer"
   )

GreaterThan
~~~~~~~~~~~

.. autoclass:: GreaterThan
   :members:
   :undoc-members:
   :show-inheritance:

Check if extracted value is greater than expected value.

**Example:**

.. code-block:: python

   from giskard.checks import GreaterThan

   check = GreaterThan(
       name="min_latency_ms",
       expected_value=250,
       key="trace.last.metadata.latency_ms"
   )

GreaterEquals
~~~~~~~~~~~~~

.. autoclass:: GreaterEquals
   :members:
   :undoc-members:
   :show-inheritance:

Check if extracted value is greater than or equal to expected value.

**Example:**

.. code-block:: python

   from giskard.checks import GreaterEquals

   check = GreaterEquals(
       name="meets_threshold",
       expected_value=0.8,
       key="trace.last.outputs.score"
   )

LesserThan
~~~~~~~~~~

.. autoclass:: LesserThan
   :members:
   :undoc-members:
   :show-inheritance:

Check if extracted value is less than expected value.

**Example:**

.. code-block:: python

   from giskard.checks import LesserThan

   check = LesserThan(
       name="max_tokens",
       expected_value=512,
       key="trace.last.metadata.token_count"
   )

LesserThanEquals
~~~~~~~~~~~~~~~~

.. autoclass:: LesserThanEquals
   :members:
   :undoc-members:
   :show-inheritance:

Check if extracted value is less than or equal to expected value.

**Example:**

.. code-block:: python

   from giskard.checks import LesserThanEquals

   check = LesserThanEquals(
       name="max_cost",
       expected_value=0.02,
       key="trace.last.metadata.cost"
   )


LLM-Based Checks
----------------

BaseLLMCheck
~~~~~~~~~~~~

.. autoclass:: BaseLLMCheck
   :members:
   :undoc-members:
   :show-inheritance:

Base class for checks that use LLMs for evaluation.


Groundedness
~~~~~~~~~~~~

.. autoclass:: Groundedness
   :members:
   :undoc-members:
   :show-inheritance:

Check if outputs are grounded in the provided context/inputs.

**Example:**

.. code-block:: python

   from giskard.checks import Groundedness

   check = Groundedness(
       name="answer_grounded",
       answer_key="trace.last.outputs.answer",
       context="Your reference context here.",
       description="Verify answer is based on context"
   )


Conformity
~~~~~~~~~~

.. autoclass:: Conformity
   :members:
   :undoc-members:
   :show-inheritance:

Check if outputs conform to instructions or specifications.

**Example:**

.. code-block:: python

   from giskard.checks import Conformity

   check = Conformity(
       name="follows_instructions",
       key="trace.last.outputs",
       rule="Always respond in JSON",
       description="Ensure response follows the given instructions"
   )


LLMJudge
~~~~~~~~

.. autoclass:: LLMJudge
   :members:
   :undoc-members:
   :show-inheritance:

Custom LLM-based evaluation with user-defined prompt.

**Example:**

.. code-block:: python

   from giskard.checks import LLMJudge

   check = LLMJudge(
       name="tone_check",
       prompt="""
       Evaluate if the response has a professional tone.

       Input: {{ inputs }}
       Output: {{ outputs }}

       Return 'passed: true' if professional, 'passed: false' otherwise.
       """
   )

RegexMatching
~~~~~~~~~~~~~

.. autoclass:: RegexMatching
   :members:
   :undoc-members:
   :show-inheritance:

Check if a regex pattern matches within text.

**Example:**

.. code-block:: python

   from giskard.checks import RegexMatching

   check = RegexMatching(
       name="valid_email",
       pattern=r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
       text_key="trace.last.outputs.response"
   )


SemanticSimilarity
~~~~~~~~~~~~~~~~~

.. autoclass:: SemanticSimilarity
   :members:
   :undoc-members:
   :show-inheritance:

Check if text is semantically similar to the expected content.

**Example:**

.. code-block:: python

   from giskard.checks import SemanticSimilarity

   check = SemanticSimilarity(
       name="answer_similarity",
       reference_text="Paris is the capital of France.",
       threshold=0.9
   )


LLMCheckResult
~~~~~~~~~~~~~~

.. autoclass:: LLMCheckResult
   :members:
   :undoc-members:
   :show-inheritance:

Result type for LLM-based checks with structured output.


Custom Check Examples
---------------------

Creating a custom LLM check:

.. code-block:: python

   from pydantic import BaseModel
   from giskard.agents.workflow import TemplateReference
   from giskard.checks import BaseLLMCheck, Check, CheckResult, Trace

   class CustomEvaluation(BaseModel):
       score: float
       passed: bool
       reasoning: str

   @Check.register("custom_eval")
   class CustomEvalCheck(BaseLLMCheck):
       threshold: float = 0.8

       def get_prompt(self) -> TemplateReference | str:
           return "Evaluate this: {{ outputs }}"

       @property
       def output_type(self) -> type[BaseModel]:
           return CustomEvaluation

       async def _handle_output(
           self,
           output_value: CustomEvaluation,
           template_inputs: dict,
           trace: Trace,
       ) -> CheckResult:
           if output_value.score >= self.threshold:
               return CheckResult.success(
                   message=f"Score {output_value.score} meets threshold"
               )
           return CheckResult.failure(
               message=f"Score {output_value.score} below threshold"
           )
