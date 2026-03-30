---
title: "Schedule evaluations"
description: "Schedule evaluations to run automatically at regular intervals. Detect regressions in agent performance over time with automated testing workflows and comprehensive monitoring."
sidebar:
  order: 3
---

You can schedule evaluations to run automatically at regular intervals. This is useful to detect regressions in your agent's performance over time.

## Open the schedule view

On the Evaluations page, click on the "Schedule" tab. This will display a list of all the scheduled evaluations.

![Evaluation schedule list](/_static/images/hub/evaluation-schedule-list.png)

## Create a new schedule

To create a new scheduled evaluation, click on the "Schedule Evaluation" button in the upper right corner of the screen.

![Evaluation schedule](/_static/images/hub/evaluation-schedule.png)

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

## Next steps

Now that you have scheduled an evaluation, you can take action on the results.

* **Compare evaluations** - [Compare evaluations](/hub/ui/evaluations/compare)
