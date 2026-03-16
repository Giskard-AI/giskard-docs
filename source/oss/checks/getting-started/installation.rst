============================
Install & Configure
============================

Install the Python package
--------------------------

Giskard Checks requires **Python 3.12 or higher**. Install using pip:

.. code-block:: bash

   pip install giskard-checks


Configure the default LLM judge model
-------------------------------------

Some checks require calling an LLM (``LLMJudge``, ``Groundedness``, ``Conformity``). To use them, you'll need to configure an LLM provider.

Giskard Checks supports any LiteLLM-compatible provider (Azure, Anthropic, etc.). See the `LiteLLM documentation <https://docs.litellm.ai/docs/providers>`_ for details.

For example, to use OpenAI, you can set the ``OPENAI_API_KEY`` environment variable:

.. code-block:: bash

   export OPENAI_API_KEY="your-api-key"

Preferably, you should set these environment variables in your ``.env`` file.

Then you can set your preferred LLM judge model like this:

.. code-block:: python

   from giskard.agents.generators import Generator
   from giskard.checks import set_default_generator

   # Create a generator with giskard.agents
   llm_judge = Generator(model="openai/gpt-5-mini")

   # Configure the checks to use this judge model by default
   set_default_generator(llm_judge)

Giskard Checks uses the ``giskard-agents`` library to handle LLM generations for judge-based checks. The ``giskard-agents`` package is installed automatically as a dependency of ``giskard-checks``.


Next Steps
----------

Head to the :doc:`../ai-testing/quickstart` to write your first test!
