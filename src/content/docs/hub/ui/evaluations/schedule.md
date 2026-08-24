---
title: "Schedule evaluations"
description: "Schedule LLM agent evaluations to run automatically at regular intervals. Detect performance regressions with automated testing."
sidebar:
  order: 3
---

You can schedule evaluations to run automatically at regular intervals. This is useful to detect regressions in your agent's performance over time.

Agents drift for reasons that have nothing to do with your code: a model provider ships a new version, a retrieval index is rebuilt, a prompt is tweaked upstream. A scheduled evaluation runs the same dataset against the same agent on a fixed cadence, so a change in behavior shows up as a drop in the success rate instead of as a user complaint.

## Open the schedule view

On the Evaluations page, click on the "Schedule" tab. This will display a list of all the scheduled evaluations.

![List of scheduled evaluations with frequency and agent details](/_static/images/hub/evaluation-schedule-list.png)

## Create a new schedule

To create a new scheduled evaluation, click on the "Schedule Evaluation" button in the upper right corner of the screen.

![Schedule evaluation form with agent, dataset, and frequency options](/_static/images/hub/evaluation-schedule.png)

## Configure the schedule

Next, set the parameters for the evaluation:

- `Name`: Give your evaluation a name.

- `Agent`: Select the agent you want to evaluate.

- `Dataset`: Choose the dataset you want to use for the evaluation.

- `Tags` (optional): Limit the evaluation to a specific subset of the dataset by applying tags.

- `Number of runs`: Select the number of runs that need to pass for each evaluation entry.

- `Frequency`: Select the frequency for the evaluation.

- `Time`: Select the time for the evaluation. (This time is based on the time zone of the server where the Giskard Hub is installed.)

After filling the form, click on the "Schedule evaluation" button, which will create the evaluation run and schedule it to run at the specified frequency and time.

## Review scheduled runs

Each scheduled execution produces an evaluation run that appears on the Evaluations page alongside runs you started by hand, with the same result views: overall success rate, per-check metrics, failure categories and tags. Nothing about reviewing them differs from a manual run, so the workflow in [Run and review evaluations](/hub/ui/evaluations/create) applies unchanged.

The value of a schedule comes from reading the runs against each other. Select two runs from different dates and click **Compare** to see which conversations changed status between them, which is the fastest way to tell a real regression from a test case that has always been flaky. See [Compare evaluations](/hub/ui/evaluations/compare).

## Practical tips

- Set the frequency to match how often the agent actually changes. A nightly run on a fast-moving agent is worth it; a weekly run is usually enough for a stable deployment.
- The **Number of runs** setting controls how many runs each entry has to pass, which is useful when your agent's answers vary between calls and a single execution is not conclusive.
- Use **Tags** to schedule a focused subset, for example a nightly run of your critical test cases and a weekly run of the full dataset.
- The **Time** you pick follows the time zone of the server where the Giskard Hub is installed, not your own, so schedule around your agent's quiet hours accordingly.


## Next steps

Now that you have scheduled an evaluation, you can take action on the results.

- **Compare evaluations** - [Compare evaluations](/hub/ui/evaluations/compare)
