# Infracost MCP Server

<!-- mcp-name: io.github.downatthebottomofthemolehole/infracost -->

[![CI/Publish](https://github.com/DownAtTheBottomOfTheMoleHole/infracost-mcp/actions/workflows/publish-mcp.yml/badge.svg)](https://github.com/DownAtTheBottomOfTheMoleHole/infracost-mcp/actions/workflows/publish-mcp.yml)
[![Coverage](https://codecov.io/gh/DownAtTheBottomOfTheMoleHole/infracost-mcp/branch/main/graph/badge.svg)](https://codecov.io/gh/DownAtTheBottomOfTheMoleHole/infracost-mcp)
[![npm](https://img.shields.io/npm/v/@downatthebottomofthemolehole/infracost-mcp-server.svg)](https://www.npmjs.com/package/@downatthebottomofthemolehole/infracost-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)

> **Note:** This is a community-maintained MCP server. It is not an official Model Context Protocol server from Infracost.

A Model Context Protocol (MCP) server for running the [Infracost CLI](https://www.infracost.io/) to estimate, compare, and publish infrastructure cost changes from Terraform and other Infrastructure as Code projects.

## Overview

This server provides eight MCP tools across estimation, reporting, collaboration, and operations workflows:

- `infracost_breakdown` to generate baseline cost estimates.
- `infracost_diff` to compare planned cost changes.
- `infracost_output` to render existing Infracost JSON in different formats.
- `infracost_comment` to post PR comments on supported SCM platforms.
- `infracost_upload` to upload reports to Infracost Cloud.
- `infracost_configure` to get or set CLI configuration.
- `infracost_auth` to run authentication flow.
- `infracost_generate_usage` to generate usage files with sensible defaults.

### Platform Compatibility

This MCP server is platform-agnostic and works in local and CI environments:

- Local development
- GitHub Actions
- GitLab CI/CD
- Azure DevOps
- CircleCI, Jenkins, and Bitbucket Pipelines
- AI Agents and Copilot workflows

The primary requirements are Node.js and the Infracost CLI binary.

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
| `infracost_generate_usage` | Utilities | Pre-filled usage file template with defaults |

## Tools

### `infracost_breakdown`

Runs `infracost breakdown`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `path` (string, optional): Path to Terraform/IaC directory or plan JSON.
- `configFile` (string, optional): Path to Infracost config file.
- `usageFile` (string, optional): Path to usage file.
- `format` (string, optional): Output format. Default: `table`.
- `fields` (string[], optional): Fields to include in output.
- `showSkus` (boolean, optional): Include SKU details.
- `syncUsageFile` (boolean, optional): Sync usage file with detected resources.
- `compareTo` (string, optional): Baseline Infracost JSON path.
- `terraformWorkspace` (string, optional): Terraform workspace.
- `terraformPlanFlags` (string, optional): Flags for `terraform plan`.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_diff`

Runs `infracost diff`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `path` (string, optional): Path to Terraform/IaC directory or plan JSON.
- `configFile` (string, optional): Path to Infracost config file.
- `usageFile` (string, optional): Path to usage file.
- `format` (string, optional): Output format. Default: `table`.
- `compareTo` (string, optional): Baseline Infracost JSON path.
- `showSkus` (boolean, optional): Include SKU details.
- `syncUsageFile` (boolean, optional): Sync usage file with detected resources.
- `terraformWorkspace` (string, optional): Terraform workspace.
- `terraformPlanFlags` (string, optional): Flags for `terraform plan`.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_output`

Runs `infracost output`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `path` (string, required): Infracost JSON file path.
- `format` (string, optional): Output format. Default: `table`.
- `fields` (string[], optional): Fields to include in output.
- `showSkus` (boolean, optional): Include SKU details.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_comment`

Runs `infracost comment`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `platform` (string, optional): Platform (`github`, `gitlab`, `azure-repos`, `bitbucket`).
- `path` (string, required): Infracost JSON file path.
- `repo` (string, optional): Repository (`owner/repo`).
- `pullRequest` (string, optional): Pull request number.
- `commit` (string, optional): Commit SHA.
- `token` (string, optional): Platform token.
- `tag` (string, optional): Comment tag.
- `behavior` (string, optional): Comment update behavior.
- `dryRun` (boolean, optional): Generate without posting.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_upload`

Runs `infracost upload`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `path` (string, required): Infracost JSON file path.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_configure`

Runs `infracost configure`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `set` (string, optional): Set configuration value.
- `get` (string, optional): Read configuration value.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_auth`

Runs `infracost auth login`.

Inputs:

- `workingDirectory` (string, optional): Command working directory.
- `timeoutSeconds` (number, optional): Timeout in seconds.
- `extraArgs` (string[], optional): Additional CLI arguments.

### `infracost_generate_usage`

Generates an Infracost usage file with sensible defaults for specified resource types. This is a utility tool that complements `infracost_configure` by providing pre-filled templates you can customize for your workloads. Returns both raw JSON and formatted guidance.

Inputs:

- `resourceTypes` (string[], required): Resource types to include (e.g., `["aws_lambda_function", "aws_s3_bucket"]`).
- `outputFilePath` (string, optional): Path where usage file should be saved (for guidance only).
- `includeGuidance` (boolean, optional): Include formatted guidance. Default: `true`.
- `onlyJson` (boolean, optional): Return only raw JSON (no guidance). Default: `false`.

Supported resource types: `aws_lambda_function`, `aws_instance`, `aws_db_instance`, `aws_s3_bucket`, `aws_dynamodb_table`, `aws_ebs_volume`, `aws_cloudfront_distribution`, `aws_lb`, `aws_nat_gateway`, `google_compute_instance`, `google_storage_bucket`, `azurerm_windows_virtual_machine`, `azurerm_linux_virtual_machine`, `azurerm_storage_account`, `azurerm_mssql_database`.

## Prompt Cookbook

Use these copy/paste prompts in Copilot Chat with `@infracost`.

### Run breakdown (`infracost_breakdown`)

```text
@infracost run infracost_breakdown with:
- workingDirectory: ${workspaceFolder}
- path: .
- format: table
- timeoutSeconds: 600
```

Expected output: Baseline cost estimate with command output, exit code, stdout, and stderr.

### Run diff (`infracost_diff`)

```text
@infracost run infracost_diff with:
- workingDirectory: ${workspaceFolder}
- path: .
- format: diff
- timeoutSeconds: 600
```

Expected output: Cost delta from the planned change compared to current baseline.

### Render output (`infracost_output`)

```text
@infracost run infracost_output with:
- path: infracost-base.json
- format: html
```

Expected output: Formatted output from existing Infracost JSON.

### Post PR comment (`infracost_comment`)

```text
@infracost run infracost_comment with:
- platform: github
- path: infracost-diff.json
- repo: owner/repo
- pullRequest: 123
- dryRun: true
```

Expected output: Generated comment payload, or posted comment when not in dry-run mode.

### Upload report (`infracost_upload`)

```text
@infracost run infracost_upload with:
- path: infracost-diff.json
```

Expected output: Upload confirmation for Infracost Cloud ingestion.

### Configure CLI (`infracost_configure`)

```text
@infracost run infracost_configure with:
- set: currency=USD
```

Expected output: Configuration update confirmation from the CLI.

### Authenticate (`infracost_auth`)

```text
@infracost run infracost_auth with:
- timeoutSeconds: 120
```

Expected output: Authentication flow prompt or login success details.

### Generate usage file (`infracost_generate_usage`)

```text
@infracost run infracost_generate_usage with:
- resourceTypes: ["aws_lambda_function", "aws_s3_bucket", "aws_dynamodb_table"]
- outputFilePath: ./infracost-usage.json
- includeGuidance: true
```

Expected output: Pre-filled usage file JSON with sensible defaults, plus guidance on customization and usage. Use `onlyJson: true` to return only the JSON for programmatic handling.

## Dependencies

### System Dependencies

- Node.js `>=24.0.0`
- npm (bundled with Node.js)
- Infracost CLI installed and available in `PATH` (or via `INFRACOST_BINARY_PATH`)

### npm Dependencies

Runtime:

- `@modelcontextprotocol/sdk` (MCP server SDK)

Development:

- `typescript` (build/compile)
- `tsx` (development runner)
- `vitest` (unit test runner)
- `@types/node` (Node.js typings)

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

Then query the server from Copilot Chat with `@infracost`, for example:

```text
@infracost run infracost_breakdown for path . with format table
@infracost run infracost_diff for path . with format diff
```

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

Build first with `npm run build`, then start your MCP client.

## Running

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Built mode:

```bash
npm run start
```

## Debugging

Use `.vscode/launch.json`:

- `Debug MCP Server` (runs `npm run dev`)
- `Debug MCP Server (Built)` (runs `dist/index.js` after build)

Set breakpoints in `src/index.ts`, then press `F5`.

## Testing

See [docs/TESTING.md](./docs/TESTING.md) for Copilot Chat scenarios, manual JSON-RPC checks, and troubleshooting guidance.

Quick validation prompt in Copilot Chat:

```text
@infracost run infracost_breakdown for path . with format table
```

## Interactive VS Code Workflows

### 1. PR Cost Impact Review

1. Generate a baseline:

```text
@infracost run infracost_breakdown with:
- path: .
- format: json
```

1. Generate a diff:

```text
@infracost run infracost_diff with:
- path: .
- format: diff
```

1. Draft a PR comment:

```text
@infracost run infracost_comment with:
- platform: github
- path: infracost-diff.json
- repo: owner/repo
- pullRequest: 123
- dryRun: true
```

### 2. Reporting Pipeline Setup

1. Render a report for humans:

```text
@infracost run infracost_output with:
- path: infracost-diff.json
- format: html
```

1. Upload for centralized tracking:

```text
@infracost run infracost_upload with:
- path: infracost-diff.json
```

### 3. Environment Bootstrap

1. Configure defaults:

```text
@infracost run infracost_configure with:
- set: currency=USD
```

1. Authenticate:

```text
@infracost run infracost_auth
```

### Best Practices

- Keep `workingDirectory` explicit when running inside monorepos.
- Use `--format json` for machine processing and `--format table` for human triage.
- Keep `timeoutSeconds` high enough for large Terraform plans.
- Prefer `infracost_comment` with `dryRun=true` before posting to production PR threads.
- Use `infracost_upload` for historical visibility in Infracost Cloud.

## Additional Use Cases

- Pre-merge cost gates in pull requests.
- Scheduled baseline cost snapshots in CI.
- Cost delta reporting for release trains.
- Team-level FinOps dashboards based on uploaded reports.

## Related Projects

### Infracost Resources

- [Infracost website](https://www.infracost.io/)
- [Infracost documentation](https://www.infracost.io/docs/)
- [Infracost CLI repository](https://github.com/infracost/infracost)

### Model Context Protocol

- [MCP official documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP servers registry](https://github.com/mcp)

## Community and Contributing

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [Testing Guide](./docs/TESTING.md)
- [Maintainer Guide](./docs/MAINTAINERS.md)

## Attribution and License

Maintained by Carl Dawson under the [Down At The Bottom Of The Mole Hole](https://github.com/downatthebottomofthemolehole) organization.

## Development

```bash
npm run lint
npm test
npm run build
```

## License

Licensed under the MIT License.
