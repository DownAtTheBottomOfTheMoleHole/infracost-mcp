# Testing Infracost MCP Server

This document describes repeatable tests for the Infracost MCP server.

## Dependencies for Testing

- Node.js `>=24.0.0`
- npm
- Infracost CLI
- Optional: Docker for container-based Infracost

## Prerequisites

1. Build the server:

   ```bash
   npm run build
   ```

2. Verify Infracost CLI is available:

   ```bash
   infracost --version
   ```

3. Reload VS Code so MCP config is reloaded:

   - `Cmd+Shift+P` → `Developer: Reload Window`

## Copilot Chat Validation

Use `@infracost-cost-analyzer` in Copilot Chat.

### Test 1: Get authentication status

```text
@infracost-cost-analyzer check the current Infracost authentication status
```

Expected: JSON output showing authentication details and API key status.

### Test 2: Run a cost breakdown

```text
@infracost-cost-analyzer run a cost breakdown for main.tf in the current directory
```

Expected: Breakdown output showing estimated monthly costs for resources in the Terraform file.

### Test 3: Compare cost differences

```text
@infracost-cost-analyzer compare the plan.json against the baseline for cost delta analysis
```

Expected: Diff output showing cost changes between the baseline and planned state.

### Test 4: List available output formats

```text
@infracost-cost-analyzer show available output formats for Infracost reports
```

Expected: JSON or table output listing supported formats (json, table, html, csv, etc.).

### Test 5: Generate usage file

```text
@infracost-cost-analyzer generate a usage file with defaults for cloud resources
```

Expected: Generated usage YAML file with sensible defaults for common resources.

### Test 6: Post a cost comment

```text
@infracost-cost-analyzer create a PR comment with cost estimates
```

Expected: Formatted markdown comment suitable for posting to GitHub/GitLab PRs.

### Test 7: Configure Infracost settings

```text
@infracost-cost-analyzer get the current Infracost configuration
```

Expected: JSON output showing current CLI configuration including API key and settings.

### Test 8: Upload to Infracost Cloud

```text
@infracost-cost-analyzer upload the cost report to Infracost Cloud
```

Expected: Upload confirmation with link to Infracost Cloud dashboard.

## Debugging

### VS Code debugger

1. Open `src/index.ts`
2. Set breakpoints
3. Press `F5`
4. Choose:

   - `Debug MCP Server`
   - or `Debug MCP Server (Built)`

### Logs

- VS Code: `View` → `Output` → `MCP Servers`
- Terminal:

  ```bash
  npm run dev
  ```

## Manual JSON-RPC Smoke Test

```bash
npm start
```

In a second terminal, test `tools/list`:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Unit Tests

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Troubleshooting

### Infracost CLI not found

- Ensure Infracost is installed: `infracost --version`
- Add Infracost to PATH if needed
- Verify Infracost binary permissions: `which infracost`

### Server not visible in Copilot Chat

- Verify `.vscode/mcp.json` exists
- Reload VS Code window
- Check `Output` → `MCP Servers` for startup errors

### Build failures

- Reinstall dependencies: `npm install`
- Rebuild: `npm run build`
- Re-check project: `npm run check`

### Authentication errors from Infracost

- Verify API key is set: `infracost auth login`
- Check Infracost Cloud credentials if using cloud features
- Verify organization/account permissions in Infracost Cloud

