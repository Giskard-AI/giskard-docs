---
title: "Setup knowledge bases"
description: "Create, manage, and organize projects, agents and knowledge bases through the user interface. Set up workspaces, configure access controls, and manage team collaboration."
sidebar:
  order: 4
---

In this section, we will walk you through how to setup knowledge bases using the Hub interface.

:::tip
A **Knowledge Base** is a domain-specific collection of information. You can have several knowledge bases for different areas of your business.
:::

## Add a knowledge base

On the Knowledge Bases, click on "Add Knowledge Base" button.

![List of knowledge bases](/_static/images/hub/import-kb-list.png)

## Knowledge base fields

The interface below displays the knowledge base details that need to be filled out.

![Import a knowledge base](/_static/images/hub/import-kb-detail.png)

- `Name`: The name of the knowledge base.
- `File`: The document to upload, containing the knowledge base content. Supported formats are:
    - **JSON**: A JSON file containing an array of objects
    - **JSONL**: A JSON Lines file with one object per line

## File formats

**JSON/JSONL format requirements:**

Each object in your JSON or JSONL file should have the following structure:

```json
{
    "text": "Your document content here",
    "topic": "Optional topic classification"
}
```

- `text` (required): The document content
- `topic` (optional): The topic classification for the document

## Validation rules

**General rules for all formats:**
- If the `text` has a value but the `topic` is blank, the `topic` will be set to 'Others'. However, if all topics are blank, the `topic` will be automatically generated.
- If both the `text` and `topic` are blank, or if the `text` is blank but the `topic` has a value, the entry will not be imported.

The interface below displays information about the knowledge base and its content with corresponding topics. As mentioned above, if no topics were uploaded with the knowledge base, Giskard Hub will also identify and generate them for you. In the example below, the knowledge base is ready to be used with over 1200 documents and 7 topics.

![Knowledge base successfully imported](/_static/images/hub/import-kb-success.png)

## Next steps

Now that you have created a project, you can start setting up your agents and knowledge bases.

- **Setup agents** - [Setup agents](/hub/ui/setup/agents)
- **Manage users and groups** - [Manage users and groups](/hub/ui/access-rights)
- **Create test cases and datasets** - [Create test cases and datasets](/hub/ui/datasets)
- **Launch vulnerability scans** - [Launch vulnerability scans](/hub/ui/scan)
