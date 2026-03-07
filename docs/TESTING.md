# Testing Infracost MCP Server

This document describes repeatable tests for the Infracost MCP server.

## Dependencies for Testing

- Node.js `>=24.0.0`
- npm
- Infracost CLI available in PATH
- Optional: `INFRACOST_API_KEY` for cloud-backed features

## Prerequisites

1. Build the server:

   ```bash
   npm run build
   ```

1. Confirm Infracost is available:

   ```bash
   infracost --version
   ```

1. Reload VS Code so MCP config is reloaded:

   - `Cmd+Shift+P` -> `Developer: Reload Window`

## Local checks

Run all quality checks:

```bash
npm run lint
npm test
npm run build
```

## Copilot Chat Validation

Use `@infracost` in Copilot Chat.

### Test 1: Run baseline breakdown

```text
@infracost run infracost_breakdown with:
- workingDirectory: ${workspaceFolder}
- path: .
- format: table
- timeoutSeconds: 600
```

Expected: Command output includes cost estimate in stdout and a zero exit code on success.

### Test 2: Run diff

```text
@infracost run infracost_diff with:
- workingDirectory: ${workspaceFolder}
- path: .
- format: diff
- timeoutSeconds: 600
```

Expected: Diff output shows cost increase/decrease summary.

### Test 3: Render existing JSON

```text
@infracost run infracost_output with:
- path: infracost-base.json
- format: html
```

Expected: Rendered output is returned in tool stdout.

### Test 4: Generate PR comment (safe mode)

```text
@infracost run infracost_comment with:
- platform: github
- path: infracost-diff.json
- repo: owner/repo
- pullRequest: 123
- dryRun: true
```

Expected: Comment payload is generated without posting to remote service.

### Test 5: Upload report

```text
@infracost run infracost_upload with:
- path: infracost-diff.json
```

Expected: Upload confirmation from the CLI if authentication is configured.

### Test 6: Update configuration

```text
@infracost run infracost_configure with:
- set: currency=USD
```

Expected: CLI confirms config update.

### Test 7: Auth flow

```text
@infracost run infracost_auth
```

Expected: Login prompt or success output from Infracost auth flow.

## Debugging

### VS Code debugger

1. Open `src/index.ts`
1. Set breakpoints
1. Press `F5`
1. Choose:

   - `Debug MCP Server`
   - or `Debug MCP Server (Built)`

### Logs

- VS Code: `View` -> `Output` -> `MCP Servers`
- Terminal:

  ```bash
  npm run dev
  ```

## Manual MCP smoke test in VS Code

1. Build the server:

```bash
npm run build
```

1. Ensure `.vscode/mcp.json` points to `./dist/index.js`.
1. Reload VS Code window.
1. In Copilot Chat, call:

```text
@infracost run infracost_breakdown for path . with format table
```

Expected behavior:

- Tool executes and returns command, exit code, stdout, and stderr.
- If Infracost is missing, stderr explains command failure.

## Manual JSON-RPC smoke test

```bash
npm start
```

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

## Troubleshooting

### Infracost not found

- Ensure Infracost is installed: `infracost --version`
- Set `INFRACOST_BINARY_PATH` if using a custom install location

### Server not visible in Copilot Chat

- Verify `.vscode/mcp.json` exists
- Reload VS Code window
- Check `Output` -> `MCP Servers` for startup errors

### Build failures

- Reinstall dependencies: `npm install`
- Rebuild: `npm run build`
- Re-check project: `npm run check`
