---
title: "Modify the scenarios"
description: "Refine scenarios and validation rules. Follow the product owner workflow to draft/undraft scenarios, enable/disable checks, and structure your dataset."
sidebar:
  order: 5
---

This section guides you through the product owner workflow for modifying scenarios. This workflow is designed for product owners and technical team members who need to refine scenarios, adjust validation rules, and structure datasets based on review feedback.

:::tip
Scenarios (conversations) are part of datasets. For information on creating and managing datasets, see [Datasets](/hub/ui/datasets).
:::

:::tip
**When to modify scenarios**

- Review feedback indicates that scenarios need adjustment (see [Review test results](/hub/ui/annotate/review-test-results))
- Scenarios are not accurately representing the intended scenarios
- Checks need to be adjusted to better match evaluation criteria
- Scenarios need to be organized with tags and descriptions

This workflow is typically triggered after a business user reviews test results and identifies issues that need modification.
:::

### Modify scenarios

## Draft/Undraft your scenario

Drafting and undrafting scenarios allows you to control which scenarios are included in evaluation runs.

Setting a scenario to draft status:

- **Excludes it from evaluation runs** - Draft scenarios are not used in evaluations until they are undrafted
- **Indicates work in progress** - Shows that the scenario is being reviewed or modified
- **Prevents biased metrics** - Ensures that incomplete or problematic scenarios don't affect your evaluation results

To draft a scenario:

1. Open the scenario (conversation) you want to draft
2. Set it to draft status using the draft toggle or option
3. The scenario will be excluded from future evaluation runs until it is undrafted

You can also set a scenario to draft when creating a task from an evaluation run. This ensures that failed scenarios are automatically excluded from subsequent evaluations until they are reviewed and fixed.

:::tip
For more information about creating tasks and setting scenarios to draft, see [Task management](/hub/ui/annotate/task-management).
:::

### Hide/Unhide

In addition to drafting, you can hide false positive results to organize your evaluation overview:

- **Hide** - Makes the false positive result less visible in the evaluation overview and for the metrics computations in the dashboard
- **Unhide** - Makes the false positive result visible again in the evaluation overview

:::tip
You can look at understanding the overview of evaluations in [Create evaluations](/hub/ui/evaluations/create).
:::

## Rerun the scenario

After modifying a scenario or its checks, you should rerun it to validate your changes. From the scenario screen, there are two ways to do this: **Run scenario**, which reruns everything, and **Run check**, which reruns a single check.

**When to rerun:**

- After modifying the conversation structure
- After updating the answer example
- After enabling or disabling checks
- After modifying check requirements
- After making any changes that could affect the test result

### Run scenario

The **Run scenario** button sits in the fixed toolbar at the top of the scenario screen, so it stays available as you scroll through interactions.

![Run scenario button in the fixed toolbar above the interactions list](/_static/images/hub/scenario-run-scenario-button.png)

Clicking it regenerates the trace for every interaction and then runs all of their checks. Use it when you've changed the conversation itself, or when you want a full, up-to-date result across every check.

### Run check

Each check also has its own **Run check** button, next to its enable/disable toggle.

![Run check button next to a single check](/_static/images/hub/scenario-run-check-button.png)

This is more granular:

- If the interaction's trace hasn't been generated yet, it's generated first, then only the clicked check is processed.
- If the trace already exists, it's reused as-is and only the clicked check runs — sibling checks on the same interaction are left untouched.

Use **Run check** when you're iterating on a single check's configuration. It's especially useful once a scenario has many interactions or checks, since rerunning the whole scenario each time you tweak one check is much slower than rerunning just that check.

Rerunning helps you:

- Validate that your modifications work as expected
- Catch issues before including the scenario in a full evaluation run
- Iterate quickly on scenario improvements
- Ensure that your changes don't introduce new problems

:::tip
**Rerun before full evaluation**

Always rerun scenarios after modifications to validate changes before including them in a full evaluation run. This saves time and ensures your modifications work as intended.
:::

## Remove scenario

If a scenario is not relevant to your use case or doesn't test meaningful behavior, you can remove it.

**When to remove a scenario:**

- The scenario is not relevant to your use case
- The scenario is too ambiguous or difficult to evaluate consistently
- You have duplicate or redundant scenarios
- The scenario concept is fundamentally flawed and cannot be fixed

**How to remove:**

1. Open the scenario you want to remove
2. Use the delete or remove option
3. Confirm the removal

:::caution
Removing a scenario is permanent. Make sure you want to remove it before confirming. Consider drafting it instead if you might need it later.
:::

### Modify checks

Checks are evaluation criteria that measure the quality of your agent's responses. You can enable or disable checks on individual scenarios to control what is being evaluated.

It is important to understand any changes you make to the checks and how they will affect the evaluation results.

- **Enable/Disable checks** - Enable or disable checks on a scenario to control what is being evaluated
- **Modify check requirement** - Modify the requirements of a check to better match your evaluation criteria
- **Validate the check** - Validate the check to ensure it works correctly

:::tip
For an overview of the different checks and how to choose the right one, see [Overview](/hub/ui/annotate/overview).
:::

## Enable/Disable checks

You can enable multiple checks on a single scenario to evaluate different aspects of the agent's response.

Disabling a check removes it from the evaluation for that specific scenario, but the check definition remains available for use on other scenarios.

## Modify check requirements

You can adjust the parameters of most built-in checks (like context or reference answer) specifically for the current scenario by editing them directly within the scenario view. These changes only impact the selected scenario.

If you want to change the requirements of a custom check (such as its overall rules or similarity threshold), you must edit the custom check itself from the Checks page. Modifying a custom check will affect all scenarios using that check. For major or experimental changes, it's recommended to create a new custom check instead--then enable it only on the scenarios where you want the new behavior.

:::tip
To get a full overview of the different checks and the parameters to configure them, see [Overview](/hub/ui/annotate/overview).
:::

## Validate the check

After modifying a check, you should validate it to ensure it works correctly.

### Rerunning the agent answer

To validate that your check modifications work correctly:

1. **Rerun the scenario** - Execute the scenario with the modified check
2. **Review the result** - Check if the test passes or fails as expected
3. **Review the explanation** - Understand why the check passed or failed
4. **Compare with expectations** - Verify that the result matches what you intended

Rerunning the agent answer helps you:

- Verify that the check correctly evaluates the agent's response in different scenarios
- Ensure that your modifications don't break the check
- Catch issues before using the check in full evaluation runs

### Rerunning the check evaluation

You may also need to validate the check evaluation by rerunning it multiples for each of the regenereated answers.

1. **Review check explanations** - Understand how the check evaluated the response
2. **Check for consistency** - Ensure the check provides consistent evaluations
3. **Validate against examples** - Test the check against known good and bad examples
4. **Adjust if needed** - Modify the check prompt or configuration if results are inconsistent

For more information about iterating on checks, see [Overview](/hub/ui/annotate/overview).

### Structure your scenarios with tags

Tags are optional but highly recommended labels that help you organize and filter your scenarios. Tags help you analyze evaluation results by allowing you to:

- **Filter results** - Focus on specific scenarios or scenarios
- **Compare performance** - See how your agent performs across different test categories
- **Identify weak areas** - Discover which types of tests have higher failure rates
- **Organize reviews** - Review scenarios by category or domain

:::tip
For more information about tags, see [Overview](/hub/ui/annotate/overview).
:::

### Next steps

Now that you understand how to modify scenarios, you can:

- **Review test results** - Understand how test results are reviewed [Review test results](/hub/ui/annotate/review-test-results)
- **Distribute tasks** - Learn how tasks are created and managed [Task management](/hub/ui/annotate/task-management)
- **Learn about checks** - Get detailed information about check types [Overview](/hub/ui/annotate/overview)
- **Learn about tags** - Understand how to organize with tags [Overview](/hub/ui/annotate/overview)
