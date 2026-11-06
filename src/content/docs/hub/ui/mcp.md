---
title: "Connect AI Assistants with MCP"
description: "Connect Claude, Cursor, and other MCP clients to Giskard Hub. Manage projects, agents, datasets, evaluations, and scans from your AI assistant."
sidebar:
  label: "MCP Server"
  order: 9.5
---

Giskard Hub includes a [Model Context Protocol (MCP) ↗](https://modelcontextprotocol.io/) server. With it, an AI assistant can work with the Hub on your behalf. You can ask it to list projects, register agents, create datasets, run evaluations and vulnerability scans, and inspect the results.

The server works with any MCP client that supports the HTTP transport, for example Claude Code, Codex, Cursor, or VS Code.

## Before you start

You need two values:

- **Hub Base URL**: For the Giskard self-serve SaaS, this is `https://saas.giskard.cloud/`. If your organization uses an enterprise Hub, cloud or on-premise, use the URL of that instance.
- **Hub API Key**: Click the user badge in the bottom-left corner of the Hub UI and copy the **API Key** value. See [Finding your API key](/hub/sdk/quickstart#finding-your-api-key).

Set them as environment variables:

```bash
export GISKARD_HUB_BASE_URL="https://saas.giskard.cloud/"
export GISKARD_HUB_API_KEY="<your-api-key>"
```

The MCP server endpoint is your base URL followed by `/_api/mcp/`. The server authenticates each request with the `X-API-Key` header. The assistant has the same permissions as the user who owns the API key. To control who can use API keys, see [User Management](/hub/ui/user-management#configure-global-permissions).

## Connect Claude Code

Run this command to add the Hub as an MCP server for your user:

```bash
claude mcp add --transport http --scope user giskard \
  "${GISKARD_HUB_BASE_URL%/}/_api/mcp/" \
  --header "X-API-Key: $GISKARD_HUB_API_KEY"
```

Then start Claude Code and run `/mcp` to make sure that the `giskard` server is connected.

## Connect other MCP clients

Most clients use a JSON configuration file to declare MCP servers. Add an entry with the endpoint URL and the API key header. The exact file location and format depend on the client, so refer to its documentation.

```json
{
  "mcpServers": {
    "giskard": {
      "url": "https://saas.giskard.cloud/_api/mcp/",
      "headers": {
        "X-API-Key": "<your-api-key>"
      }
    }
  }
}
```

## Example prompts

After you connect, ask your assistant in plain language. For example:

```text wrap
List my Giskard Hub projects and show the latest evaluation results in the Support project.
```

```text wrap
Run a vulnerability scan on the customer-support agent and summarize the critical findings.
```
