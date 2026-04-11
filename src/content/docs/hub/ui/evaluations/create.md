---
title: "Run and review evaluations"
description: "Run and manage LLM agent evaluations through the Giskard Hub UI. Execute tests, schedule automated runs, and analyze results with metrics."
sidebar:
  order: 2
---

On the Evaluations page, click on "Run evaluation" button in the upper right corner of the screen.

![Evaluation runs list with run evaluation button](/_static/images/hub/evaluation-list.png)

## Configure the evaluation

Next, set the parameters for the evaluation:

- `Agent`: Select the agent you wish to evaluate.

- `Dataset`: Choose the dataset you want to use for the evaluation.

- `Tags` (optional): Limit the evaluation to a specific subset of the dataset by applying tags.

![Evaluation configuration form with agent and dataset selection](/_static/images/hub/evaluation-run.png)

## Checks used in the evaluation

The evaluation run is automatically named and assessed against the checks (built-in and custom ones) that were enabled in each conversation. The built-in checks include:

- **Correctness**: Verifies if the agent's response matches the expected output (reference answer).

- **Conformity**: Ensures the agent's response adheres to the rules, such as "The agent must be polite."

- **Groundedness**: Ensures the agent's response is grounded in the conversation.

- **String matching**: Checks if the agent's response contains a specific string, keyword, or sentence.

- **Metadata**: Verifies the presence of specific (tool calls, user information, etc.) metadata in the agent's response.

- **Semantic Similarity**: Verifies that the agent's response is semantically similar to the expected output.

:::tip
For detailed information about these checks, including examples and how they work, see [Annotate overview](/hub/ui/annotate/overview).
:::

## Review evaluation results

When you open an evaluation run, you can review the overall results before diving into individual test cases. This high-level view helps you understand the evaluation performance at a glance and identify areas that need attention.

:::tip[How to use your test results to correct your AI agent?]
During the development phase, it is essential to diagnose issues and implement corrections to improve the agent's performance.

- **Failure rate per check:** Identifying the checks with the highest failure rate makes it easier to apply targeted corrections. For example, if you created a custom check to verify whether the agent starts with "I'm sorry," it is useful to know how many conversations fail this requirement. If the failure rate is high, you can develop mitigation strategies such as prompt engineering, implementing guardrails, or using routers to address the issue.
- **Failure rate per category:** Measuring failure rates across different vulnerability categories (e.g., hallucination, prompt injection) helps prioritize mitigation strategies for the AI agent.
- **Failure rate per tag:** Measuring failure rates across different tags (e.g., customer-support, technical-support) helps prioritize mitigation strategies for the AI agent.
  :::

### Metrics view

The metrics view displays performance statistics for each check that was used in the evaluation. This view is particularly useful when you have custom checks, as it allows you to see how each check performed across all test cases.

The pie chart below displays the number of evaluations that passed, failed, or were unexecuted.

![Evaluation metrics view showing pass/fail rates per check](/_static/images/hub/evaluation-metrics.png)

The metrics view helps you:

- Identify which checks have the highest failure rates
- Understand which custom checks are most effective
- Prioritize which checks need refinement or adjustment

:::tip
You can read about metric definitions in [Annotate overview](/hub/ui/annotate/overview).
:::

### Failure category view

The failure categories view groups test failures by their failure category. This view is useful to understand the root cause of your failures and identify patterns in how your agent is failing. You can also manually update the failure category to a different one.

The pie chart below displays the number of evaluations that passed, failed, or were unexecuted.

![Failure categories view grouping test results by root cause](/_static/images/hub/evaluation-categories.png)

Using failure categories helps you:

- **Identify patterns** - See which types of failures are most common
- **Prioritize fixes** - Focus on the most critical failure types first
- **Assign tasks** - Route issues to the right team members based on category
- **Track improvements** - Monitor how failure rates change over time

:::tip
You can read about failure category changes in [Modify test cases](/hub/ui/annotate/modify-test-cases).
:::

### Tags view

The tags view helps you filter and analyze results by custom tags.

![Tags view showing test results filtered by category](/_static/images/hub/evaluation-tags.png)

Using tags helps you:

- **Filter results** - Focus on specific test types or scenarios
- **Compare performance** - See how your agent performs across different test categories
- **Identify weak areas** - Discover which types of tests have higher failure rates
- **Organize reviews** - Review test results by category or domain

:::tip
You can read about tag definitions in [Annotate overview](/hub/ui/annotate/overview).
:::

#### Understanding evaluation columns

The evaluation run table displays test cases with several columns that provide important information:

![Evaluation results table with status, metrics, and failure columns](/_static/images/hub/evaluation-columns.png)

These columns help you:

- Quickly identify which test cases need review
- Filter and sort results to focus on specific issues
- Navigate efficiently through large evaluation runs
- Make informed decisions about which test cases require action

Underneath, you can see the types of columns that are displayed for each test case:

- **Sample success** - The overall result of the test case:
  - **Pass** - The test case met all evaluation criteria
  - **Fail** - The test case did not meet one or more evaluation criteria
  - **Error** - An error occurred during evaluation
  - **Skipped** - The test case was not evaluated (typically because required checks or annotations are missing)

- **Metrics** - The metrics that were calculated for the test case

- **Status** - The status of the test case:
  - **Running** - The test case is being evaluated
  - **Finished** - The test case has been evaluated
  - **Error** - An error occurred during evaluation
  - **Skipped** - The test case was not evaluated (typically because the test case is in draft status as part of a task)

- **Failure category** - The category assigned to failed test cases (if applicable)

- **Tags** - Tags associated with the test case for filtering and organization

## Next steps

Now that you have created an evaluation, you can take action on the results.

- **Compare evaluations** - [Compare evaluations](/hub/ui/evaluations/compare)
- **Schedule evaluations** - [Schedule evaluations](/hub/ui/evaluations/schedule)
