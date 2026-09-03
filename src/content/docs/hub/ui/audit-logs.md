---
title: "Audit logs"
description: "Track every change made to entities in Giskard Hub with audit logs. View history of modifications to checks, datasets, and scenarios."
sidebar:
  order: 8
---

Audit logs provide full traceability for all changes made to entities within Giskard Hub. This feature allows you to keep track of every change that every person has made on every entity, providing complete audit trails for your evaluation configurations.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/W_9MhdmHouk?si=0cW-jUuMaO8lifS5" title="How to track entity changes with event logs in Giskard Hub" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

**Why use audit logs?**

Audit logs are essential for maintaining accountability and understanding the evolution of your evaluation setup. They help you:

- **Track changes** - See what has been modified on any entity
- **Identify authors** - Know who made each change
- **Understand impact** - Recognize how changes affect your evaluations
- **Maintain compliance** - Keep complete audit trails for regulatory requirements

## Audit logs overview

To begin, click on the "Settings" icon on the left panel, then select **Event Log**.

![Event Log page showing tracked entity changes](/_static/images/hub/event-logs.png)

Every entity in Giskard Hub maintains a complete history of all modifications. This includes:

- **Checks** - Custom validation rules and their configurations
- **Datasets** - Scenario collections and their metadata
- **Scenarios** - Individual scenarios within datasets
- **Other entities** - All project-related entities track their changes

Each change is recorded with:

- **What changed** - The specific field or property that was modified
- **Who made the change** - The user who performed the action
- **When it changed** - Timestamp of the modification
- **Change details** - Description of the modification

#### Viewing event history

To view the event history for a specific entity in the Event Log:

1. Find the row for the entity you want to inspect (e.g., a check, dataset, or scenario)
2. Click on the button in the **History** column
3. Review the list of changes in the **Change History** drawer

![Change History drawer with a timeline of modifications](/_static/images/hub/event-logs-history.png)

## Best practices

- **Review history regularly** - Check audit logs when investigating evaluation results
- **Monitor critical entities** - Pay special attention to changes in checks and datasets that affect production evaluations
- **Coordinate with team** - Review audit logs before making major changes to understand recent modifications

## Next steps

Now that you understand audit logs, you can:

- **Review entity histories** - Check the history of your checks, datasets, and scenarios
- **Investigate changes** - Use audit logs to debug evaluation issues
- **Maintain traceability** - Keep complete audit trails of all modifications

For more information about working with specific entity types, see:

- [Annotate overview](/hub/ui/annotate/overview) - Learn about checks and validation rules
- [Datasets](/hub/ui/datasets) - Understand dataset management
- [Evaluations](/hub/ui/evaluations) - Explore evaluation workflows
