# Maintainer Guide

This guide contains operational details for release management, compliance, and automation.

## Release Publishing

Publishing is automated via the GitHub workflow:

- `.github/workflows/publish-mcp.yml`

Release flow:

1. Merge approved changes into `main`.
2. Create a release tag (for example, `v0.1.0`) or run workflow dispatch with `version`.
3. Workflow runs validation jobs and builds the package.
4. Workflow publishes npm package and MCP registry metadata.

## Compliance Gate

The publish workflow enforces a validation stage before publishing:

- lint
- test
- build

This blocks non-compliant releases.

## CI and Automation

Primary workflow file:

- `.github/workflows/publish-mcp.yml`

Current pipeline validates:

- ESLint checks
- Vitest suite
- TypeScript build output

## Dependency Update Policy

Before releasing:

- Review lockfile updates.
- Verify Node version compatibility (`>=24.0.0`).
- Re-run `npm run lint`, `npm test`, and `npm run build`.

## Local Maintainer Checks

Run before cutting a release:

```bash
npm run check
npm run lint
npm test
npm run build
npm run docs:links
```
