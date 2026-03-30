---
title: "Setup agents"
description: "Create, manage, and organize projects, agents and knowledge bases through the user interface. Set up workspaces, configure access controls, and manage team collaboration."
sidebar:
  order: 3
---

In this section, we will walk you through how to setup agents using the Hub interface.

:::tip
Agents are configured through an API endpoint. They can be evaluated against datasets.
:::

## Create a new agent

On the Agents page, click on the "New agent" button.

![List of agents](/_static/images/hub/setup-agent-list.png)

## Agent fields

The interface below displays the agent details that need to be filled out.

![Setup an agent](/_static/images/hub/setup-agent-detail.png)

- `Name`: The name of the agent.
- `Description`: Used to refine automatic evaluation and generation for better accuracy in your specific use case.
- `Supported Languages`: Add the languages your agent can handle. Note that this affects data generation.
- `Connection Settings`:
    - `Agent API Endpoint`: The URL of your agent's API endpoint. This is where requests are sent to interact with your agent.
    - `Headers`: These are useful for authentication and other custom headers

## Request payload

The endpoint should expect an object with the following structure:

```python
{
    "messages": [
        {
        "role": "user",
        "content": "Hello!"
        },
        {
        "role": "assistant",
        "content": "Hello! How can I help you?"
        },
        {
        "role": "user",
        "content": "What color is an orange?"
        }
    ]
}
```

## Response payload

The endpoint's response should have the following structure:

```python
{
    "response": {
        "role": "assistant",
        "content": "An orange is green"
    },
    "metadata": {
        "some_key": "whatever value"
    }
}
```

## Next steps

Now that you have created an agent, you can start setting up your knowledge bases and create test cases and datasets.

- **Setup knowledge bases** - [Setup knowledge bases](/hub/ui/setup/knowledge-bases)
- **Manage users and groups** - [Manage users and groups](/hub/ui/access-rights)
- **Create test cases and datasets** - [Create test cases and datasets](/hub/ui/datasets)
- **Launch vulnerability scans** - [Launch vulnerability scans](/hub/ui/scan)
