# Maintainer Guide

This guide contains operational details for release management, compliance, and automation.

## Release Publishing

Publishing is automated via GitHub Releases and pull request merges.

1. Create a PR with your changes and updates to `package.json` with the new version.
2. After PR approval and testing, merge to `main`.
3. GitHub Actions executes `.github/workflows/publish-mcp.yml`.
4. Package is published to npm and MCP Registry if checks pass.

## Compliance Gate

The publish workflow enforces multiple validation jobs:

- `test-and-build`: runs lint, type checks, tests with coverage, build validation, markdown link checks, and security audits
- `publish`: runs only if tests and build succeed

This blocks non-compliant releases from being published.

## CI and Automation

Primary workflow file:

- `.github/workflows/publish-mcp.yml` (unified CI/test/build/publish workflow)

CI validates:

- ESLint checks
- TypeScript type checks
- Vitest coverage
- Build artifacts
- Markdown link validity
- npm audit for vulnerabilities

## Renovate Policy

`renovate.json` controls dependency updates.

Current behaviour:

- patch updates: auto-merge
- minor updates: auto-merge
- major updates: manual review
- security updates: manual review

## GitVersion Strategy

`GitVersion.yml` uses GitHub Flow with automatic semantic versioning:

- Commits with `+semver: breaking` or `+semver: major` bump major version
- Commits with `+semver: feature` or `+semver: minor` bump minor version
- Commits with `+semver: fix` or `+semver: patch` bump patch version
- Commits with `+semver: none` or `+semver: skip` skip version bumps

For normal operation, use conventional commit messages with semver tags when version bumps are needed.

## Local Maintainer Checks

Run before cutting a release:

```bash
npm run lint
npm run check
npm run test:coverage
npm run build
npm audit --production
```

## Version Management

Release versions must be strict SemVer: `major.minor.patch`.

- ✅ Valid: `1.0.14`
- ❌ Invalid: `1.0.14-2`, `latest`, `1.0.x`

Update `package.json` version before merging to `main`.
