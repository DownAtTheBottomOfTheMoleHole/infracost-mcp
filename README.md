# Infracost MCP Server

<!-- mcp-name: io.github.downatthebottomofthemolehole/infracost -->

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)

A Model Context Protocol (MCP) server for running the [Infracost CLI](https://www.infracost.io/) to estimate, compare, and publish infrastructure cost changes from Terraform and other Infrastructure as Code projects.

## Overview

This server provides seven MCP tools:

- `infracost_breakdown` to generate baseline cost estimates.
- `infracost_diff` to compare planned cost changes.
- `infracost_output` to render existing Infracost JSON in different formats.
- `infracost_comment` to post PR comments on supported SCM platforms.
- `infracost_upload` to upload reports to Infracost Cloud.
- `infracost_configure` to get or set CLI configuration.
- `infracost_auth` to run authentication flow.

### Tool Matrix

| Tool | Category | Typical outcome |
| --- | --- | --- |
| `infracost_breakdown` | Estimation | Monthly cost baseline for current IaC |
| `infracost_diff` | Comparison | Cost delta from a planned change |
| `infracost_output` | Reporting | Rendered table/JSON/HTML/comment output |
| `infracost_comment` | Collaboration | PR comment with estimated impact |
| `infracost_upload` | Cloud Sync | Cost report visible in Infracost Cloud |
| `infracost_configure` | Configuration | Persisted CLI config update/read |
| `infracost_auth` | Authentication | Login flow for Infracost Cloud |

## Tool Inputs

### `infracost_breakdown`

Common inputs:

- `workingDirectory` (string, optional)
- `path` (string, optional)
- `configFile` (string, optional)
- `usageFile` (string, optional)
- `format` (string, optional, default `table`)
- `fields` (string[], optional)
- `showSkus` (boolean, optional)
- `syncUsageFile` (boolean, optional)
- `compareTo` (string, optional)
- `terraformWorkspace` (string, optional)
- `terraformPlanFlags` (string, optional)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

### `infracost_diff`

Common inputs:

- `workingDirectory` (string, optional)
- `path` (string, optional)
- `configFile` (string, optional)
- `usageFile` (string, optional)
- `format` (string, optional, default `table`)
- `compareTo` (string, optional)
- `showSkus` (boolean, optional)
- `syncUsageFile` (boolean, optional)
- `terraformWorkspace` (string, optional)
- `terraformPlanFlags` (string, optional)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

### `infracost_output`

Common inputs:

- `workingDirectory` (string, optional)
- `path` (string, required)
- `format` (string, optional, default `table`)
- `fields` (string[], optional)
- `showSkus` (boolean, optional)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

### `infracost_comment`

Common inputs:

- `workingDirectory` (string, optional)
- `platform` (string, optional)
- `path` (string, required)
- `repo` (string, optional)
- `pullRequest` (string, optional)
- `commit` (string, optional)
- `token` (string, optional)
- `tag` (string, optional)
- `behavior` (string, optional)
- `dryRun` (boolean, optional)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

### `infracost_upload`

Common inputs:

- `workingDirectory` (string, optional)
- `path` (string, required)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

### `infracost_configure`

Common inputs:

- `workingDirectory` (string, optional)
- `set` (string, optional)
- `get` (string, optional)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

### `infracost_auth`

Common inputs:

- `workingDirectory` (string, optional)
- `timeoutSeconds` (number, optional)
- `extraArgs` (string[], optional)

## Dependencies

### System Dependencies

- Node.js `>=24.0.0`
- npm (bundled with Node.js)
- Infracost CLI installed and available in `PATH` (or via `INFRACOST_BINARY_PATH`)

### Environment Variables

- `INFRACOST_API_KEY`: Infracost API key for cloud-backed features.
- `INFRACOST_BINARY_PATH`: Override path to Infracost binary.

## Installation

```bash
npm install
npm run build
```

## Configuration

### Usage with VS Code Copilot Chat

This workspace is preconfigured in `.vscode/mcp.json`:

```json
{
	"servers": {
		"infracost": {
			"type": "stdio",
			"command": "node",
			"args": ["./dist/index.js"]
		}
	}
}
```

Reload VS Code (`Cmd+Shift+P` -> `Developer: Reload Window`) after changing MCP configuration.

### Usage with Other MCP Clients

Use stdio transport with the built entrypoint:

```json
{
	"name": "infracost-mcp-server",
	"type": "stdio",
	"command": "node",
	"args": ["/absolute/path/to/infracost-mcp/dist/index.js"]
}
```

## Running

Development mode:

```bash
npm run dev
```

Built mode:

```bash
npm run start
```

## Testing

See [docs/TESTING.md](./docs/TESTING.md) for smoke tests and validation steps.

## Development

```bash
npm run lint
npm test
npm run build
```

## License

MIT
