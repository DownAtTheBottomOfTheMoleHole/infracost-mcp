# GitHub Personal Access Token Setup

## Why is this needed?

The release workflow may need to trigger subsequent workflow runs when publishing. By default, the `GITHUB_TOKEN` does not trigger workflows (to prevent infinite loops). To enable the full CI/CD pipeline, you can optionally create a Personal Access Token (PAT) with workflow permissions for enhanced automation.

## Setup Instructions (Optional)

### 1. Create a Fine-Grained Personal Access Token

1. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure the token:
   - **Token name**: `Infracost MCP Release Workflow`
   - **Expiration**: Choose your preference (90 days or custom)
   - **Repository access**: Select "Only select repositories" → Choose `infracost-mcp`
   - **Repository permissions**:
     - **Contents**: Read and write
     - **Metadata**: Read-only (automatically selected)
     - **Workflows**: Read and write

4. Click **Generate token**
5. **Copy the token immediately** (you won't be able to see it again)

### 2. Add Token to Repository Secrets

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PAT_TOKEN`
4. Value: Paste your token
5. Click **Add secret**

### 3. Verify the Setup

Merge a PR to the `main` branch and verify:

1. The PR merge triggers the publish workflow
2. Publishing to npm and MCP Registry completes successfully
3. A GitHub Release is created with the changelog

## Workflow Behaviour

### With PAT_TOKEN configured

```text
PR merge to main → publish workflow runs → npm + MCP Registry publish → GitHub Release created
```

### Without PAT_TOKEN (default)

```text
PR merge to main → publish workflow runs → npm + MCP Registry publish → GitHub Release created
```

## Security Notes

- The token is scoped to this repository only
- It has minimal permissions (contents + workflows)
- Rotate the token before expiration
- Never commit the token to the repository
- The workflow defaults to `GITHUB_TOKEN` which works for most use cases

## Troubleshooting

**Problem**: Publishing fails with authentication error

- **Solution**: Verify npm Trusted Publisher is configured correctly for this repository

**Problem**: GitHub Release is not created

- **Solution**: Check the workflow run logs in Actions tab for detailed error messages

**Problem**: Token expired

- **Solution**: Generate a new token and update the `PAT_TOKEN` secret
