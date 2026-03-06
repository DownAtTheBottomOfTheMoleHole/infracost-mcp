# Testing Infracost MCP Server

## Prerequisites

- Node.js 24+
- Infracost CLI installed (`infracost --version`)
- Optional: `INFRACOST_API_KEY` for cloud-backed features

## Local checks

Run all quality checks:

```bash
npm run lint
npm test
npm run build
```

## Manual MCP smoke test in VS Code

1. Build the server:

```bash
npm run build
```

- Ensure `.vscode/mcp.json` points to `./dist/index.js`.
- Reload VS Code window.
- In Copilot Chat, call:

```text
@infracost run infracost_breakdown for path . with format table
```

Expected behavior:

- Tool executes and returns command, exit code, stdout, and stderr.
- If Infracost is missing, stderr explains command failure.

## Manual JSON-RPC smoke test

Use any MCP inspector/client with stdio transport and command:

```text
node /absolute/path/to/dist/index.js
```

Then call `tools/list` and verify these tools appear:

- `infracost_breakdown`
- `infracost_diff`
- `infracost_output`
- `infracost_comment`
- `infracost_upload`
- `infracost_configure`
- `infracost_auth`
