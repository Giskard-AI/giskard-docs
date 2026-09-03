---
title: "Setup knowledge bases"
description: "Create and manage knowledge bases in Giskard Hub. Upload domain documents to generate targeted scenarios for AI agent evaluation."
sidebar:
  order: 4
---

To import a knowledge base, open Knowledge Bases and click "Add Knowledge Base".

:::tip
A **Knowledge Base** is a domain-specific collection of information. You can have several knowledge bases for different areas of your business.
:::

![Knowledge base list with add knowledge base button](/_static/images/hub/import-kb-list.png)

Fill in the knowledge base details:

![Knowledge base import form for JSON and JSONL files](/_static/images/hub/import-kb-detail.png)

- `Name`: The name of the knowledge base.
- `File`: The document to upload, containing the knowledge base content. Supported formats are:
  - **JSON**: A JSON file containing an array of objects
  - **JSONL**: A JSON Lines file with one object per line

## File formats

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

- If the `text` has a value but the `topic` is blank, the `topic` will be set to 'Others'. However, if all topics are blank, the `topic` will be automatically generated.
- If both the `text` and `topic` are blank, or if the `text` is blank but the `topic` has a value, the entry will not be imported.

Once imported, the knowledge base shows its documents and topics. If no topics were uploaded, Giskard Hub identifies and generates them. In the example below, the knowledge base is ready with 206 documents and 5 topics.

![Imported knowledge base showing document count and topics](/_static/images/hub/import-kb-success.png)

## Next steps

- **Setup agents** - [Setup agents](/hub/ui/setup/agents)
- **Manage users and groups** - [Manage users and groups](/hub/ui/user-management)
- **Create scenarios and datasets** - [Create scenarios and datasets](/hub/ui/datasets)
- **Launch vulnerability scans** - [Launch vulnerability scans](/hub/ui/scan)
