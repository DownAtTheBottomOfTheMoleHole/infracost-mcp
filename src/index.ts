#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  type ToolArgs,
  formatOutput,
  generateUsageFile,
  generateUsageGuidance,
  readBool,
  readNumber,
  readString,
  readStringArray,
  resolveInfracostCommand,
} from "./utils.js";

const DEFAULT_TIMEOUT_SECONDS = 300;

type ProcessResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

const server = new Server(
  {
    name: "infracost-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

async function runCommand(
  command: string,
  commandArgs: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutSeconds: number,
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 3000);
    }, timeoutSeconds * 1000);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        exitCode: code ?? 1,
        stdout: formatOutput(stdout),
        stderr: formatOutput(stderr),
        timedOut,
      });
    });
  });
}

export const AUTO_REPORT_PATH_CANDIDATES = [
  "infracost-diff.json",
  "infracost-base.json",
  "infracost.json",
  ".infracost/infracost-diff.json",
  ".infracost/infracost-base.json",
  ".infracost/infracost.json",
];

export function resolveReportPath(
  args: ToolArgs,
  workingDirectory: string,
): string | undefined {
  const explicitPath = readString(args, "path");
  if (explicitPath) {
    return explicitPath;
  }

  for (const candidate of AUTO_REPORT_PATH_CANDIDATES) {
    if (existsSync(path.resolve(workingDirectory, candidate))) {
      return candidate;
    }
  }

  return undefined;
}

export function missingReportPathError(toolName: string) {
  return {
    content: [
      {
        type: "text",
        text:
          `Error: no Infracost JSON report found for ${toolName}. ` +
          "Pass 'path', or run infracost_breakdown/infracost_diff with extraArgs ['--format', 'json', '--out-file', '<file>'] first.",
      },
    ],
    isError: true,
  };
}

async function handleBreakdownTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["breakdown"];

  // Path to IaC files
  const pathArg = readString(args, "path");
  if (pathArg) {
    commandArgs.push("--path", pathArg);
  }

  // Config file
  const configFile = readString(args, "configFile");
  if (configFile) {
    commandArgs.push("--config-file", configFile);
  }

  // Usage file for accurate costs
  const usageFile = readString(args, "usageFile");
  if (usageFile) {
    commandArgs.push("--usage-file", usageFile);
  }

  // Output format
  const format = readString(args, "format") ?? "table";
  commandArgs.push("--format", format);

  // Fields to show
  const fields = readStringArray(args, "fields");
  if (fields.length > 0) {
    commandArgs.push("--fields", fields.join(","));
  }

  // Show SKUs
  if (readBool(args, "showSkus")) {
    commandArgs.push("--show-skus");
  }

  // Sync usage file
  if (readBool(args, "syncUsageFile")) {
    commandArgs.push("--sync-usage-file");
  }

  // Compare to baseline
  const compareTo = readString(args, "compareTo");
  if (compareTo) {
    commandArgs.push("--compare-to", compareTo);
  }

  // Terraform workspace
  const terraformWorkspace = readString(args, "terraformWorkspace");
  if (terraformWorkspace) {
    commandArgs.push("--terraform-workspace", terraformWorkspace);
  }

  // Terraform plan flags
  const terraformPlanFlags = readString(args, "terraformPlanFlags");
  if (terraformPlanFlags) {
    commandArgs.push("--terraform-plan-flags", terraformPlanFlags);
  }

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  // Set API key if provided
  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

async function handleDiffTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["diff"];

  // Path to IaC files
  const pathArg = readString(args, "path");
  if (pathArg) {
    commandArgs.push("--path", pathArg);
  }

  // Config file
  const configFile = readString(args, "configFile");
  if (configFile) {
    commandArgs.push("--config-file", configFile);
  }

  // Usage file
  const usageFile = readString(args, "usageFile");
  if (usageFile) {
    commandArgs.push("--usage-file", usageFile);
  }

  // Output format
  const format = readString(args, "format") ?? "table";
  commandArgs.push("--format", format);

  // Compare to baseline
  const compareTo = readString(args, "compareTo");
  if (compareTo) {
    commandArgs.push("--compare-to", compareTo);
  }

  // Show SKUs
  if (readBool(args, "showSkus")) {
    commandArgs.push("--show-skus");
  }

  // Sync usage file
  if (readBool(args, "syncUsageFile")) {
    commandArgs.push("--sync-usage-file");
  }

  // Terraform workspace
  const terraformWorkspace = readString(args, "terraformWorkspace");
  if (terraformWorkspace) {
    commandArgs.push("--terraform-workspace", terraformWorkspace);
  }

  // Terraform plan flags
  const terraformPlanFlags = readString(args, "terraformPlanFlags");
  if (terraformPlanFlags) {
    commandArgs.push("--terraform-plan-flags", terraformPlanFlags);
  }

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

export async function handleOutputTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["output"];

  // Path to Infracost JSON file (auto-detected when omitted)
  const pathArg = resolveReportPath(args, workingDirectory);
  if (!pathArg) {
    return missingReportPathError("infracost_output");
  }
  commandArgs.push("--path", pathArg);

  // Output format
  const format = readString(args, "format") ?? "table";
  commandArgs.push("--format", format);

  // Fields to show
  const fields = readStringArray(args, "fields");
  if (fields.length > 0) {
    commandArgs.push("--fields", fields.join(","));
  }

  // Show SKUs
  if (readBool(args, "showSkus")) {
    commandArgs.push("--show-skus");
  }

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

export async function handleCommentTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["comment"];

  // Platform defaults to GitHub for shorter prompts.
  const platform = readString(args, "platform") ?? "github";
  commandArgs.push(platform);

  // Path to Infracost JSON file (auto-detected when omitted)
  const pathArg = resolveReportPath(args, workingDirectory);
  if (!pathArg) {
    return missingReportPathError("infracost_comment");
  }
  commandArgs.push("--path", pathArg);

  // Repository URL
  const repo = readString(args, "repo");
  if (repo) {
    commandArgs.push("--repo", repo);
  }

  // Pull request number
  const pullRequest = readString(args, "pullRequest");
  if (pullRequest) {
    commandArgs.push("--pull-request", pullRequest);
  }

  // Commit SHA
  const commit = readString(args, "commit");
  if (commit) {
    commandArgs.push("--commit", commit);
  }

  // GitHub/GitLab token
  const token = readString(args, "token");
  if (token) {
    commandArgs.push("--token", token);
  }

  // Tag
  const tag = readString(args, "tag");
  if (tag) {
    commandArgs.push("--tag", tag);
  }

  // Behavior (update, new, delete-and-new)
  const behavior = readString(args, "behavior");
  if (behavior) {
    commandArgs.push("--behavior", behavior);
  }

  // Dry run
  if (readBool(args, "dryRun")) {
    commandArgs.push("--dry-run");
  }

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

export async function handleUploadTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["upload"];

  // Path to Infracost JSON file (auto-detected when omitted)
  const pathArg = resolveReportPath(args, workingDirectory);
  if (!pathArg) {
    return missingReportPathError("infracost_upload");
  }
  commandArgs.push("--path", pathArg);

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

async function handleConfigureTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["configure"];

  // Set specific configuration key
  const set = readString(args, "set");
  if (set) {
    commandArgs.push("set", set);
  }

  // Get specific configuration key
  const get = readString(args, "get");
  if (get) {
    commandArgs.push("get", get);
  }

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

async function handleAuthTool(args: ToolArgs) {
  const infracostCmd = resolveInfracostCommand();
  const workingDirectory = path.resolve(
    readString(args, "workingDirectory") ?? process.cwd(),
  );

  const commandArgs: string[] = ["auth", "login"];

  // Extra args
  const extraArgs = readStringArray(args, "extraArgs");
  if (extraArgs.length > 0) {
    commandArgs.push(...extraArgs);
  }

  const env: NodeJS.ProcessEnv = { ...process.env };

  const apiKey = readString(args, "apiKey");
  if (apiKey) {
    env.INFRACOST_API_KEY = apiKey;
  }

  const timeoutSeconds = Math.max(
    1,
    readNumber(args, "timeoutSeconds", DEFAULT_TIMEOUT_SECONDS),
  );

  const result = await runCommand(
    infracostCmd,
    commandArgs,
    workingDirectory,
    env,
    timeoutSeconds,
  );

  const responseText = [
    `Command: ${infracostCmd} ${commandArgs.join(" ")}`,
    `Working directory: ${workingDirectory}`,
    `Exit code: ${result.exitCode}`,
    result.timedOut ? `Timed out after ${timeoutSeconds} seconds.` : "",
    "",
    "STDOUT:",
    result.stdout || "(empty)",
    "",
    "STDERR:",
    result.stderr || "(empty)",
  ]
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    content: [{ type: "text", text: responseText }],
    isError: result.exitCode !== 0 || result.timedOut,
  };
}

async function handleGenerateUsageTool(args: ToolArgs) {
  // Get resource types (required)
  const resourceTypes = readStringArray(args, "resourceTypes");
  if (resourceTypes.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "Error: 'resourceTypes' parameter is required for infracost_generate_usage",
        },
      ],
      isError: true,
    };
  }

  // Get optional output file path
  const outputFilePath = readString(args, "outputFilePath");

  // Generate the usage file
  const usageData = generateUsageFile(resourceTypes);
  const usageJson = JSON.stringify(usageData, null, 2);

  // Generate guidance
  const guidance = generateUsageGuidance(resourceTypes, outputFilePath);

  // Include format preference
  const includeGuidance = readBool(args, "includeGuidance", true);
  const onlyJson = readBool(args, "onlyJson", false);

  let responseText: string;
  if (onlyJson) {
    responseText = usageJson;
  } else if (includeGuidance) {
    responseText = [
      "Raw JSON for usage file:",
      "```json",
      usageJson,
      "```",
      "",
      guidance,
    ].join("\n");
  } else {
    responseText = usageJson;
  }

  return {
    content: [{ type: "text", text: responseText }],
    isError: false,
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "infracost_breakdown",
        description:
          "Generate cost breakdown for Infrastructure as Code (Terraform, CloudFormation, etc.). Shows cost estimates for cloud resources.",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed. Defaults to current directory.",
            },
            path: {
              type: "string",
              description: "Path to the Terraform/IaC directory or plan JSON file.",
            },
            configFile: {
              type: "string",
              description: "Path to Infracost config file.",
            },
            usageFile: {
              type: "string",
              description: "Path to Infracost usage file for resource usage estimates.",
            },
            format: {
              type: "string",
              description: "Output format: table, json, html, diff, github-comment, gitlab-comment, azure-repos-comment, slack-message, etc.",
              default: "table",
            },
            fields: {
              type: "array",
              description: "Fields to include in output (all, price, monthlyQuantity, unit, hourlyCost, monthlyCost).",
              items: { type: "string" },
            },
            showSkus: {
              type: "boolean",
              description: "Show SKU details in the output.",
              default: false,
            },
            syncUsageFile: {
              type: "boolean",
              description: "Sync usage file with missing resources.",
              default: false,
            },
            compareTo: {
              type: "string",
              description: "Path to baseline Infracost JSON for comparison.",
            },
            terraformWorkspace: {
              type: "string",
              description: "Terraform workspace to use.",
            },
            terraformPlanFlags: {
              type: "string",
              description: "Flags to pass to 'terraform plan'.",
            },
            apiKey: {
              type: "string",
              description: "Infracost API key (can also use INFRACOST_API_KEY env var).",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_diff",
        description:
          "Show cost diff between current IaC and planned changes. Useful for pull request reviews to understand cost impact.",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed. Defaults to current directory.",
            },
            path: {
              type: "string",
              description: "Path to the Terraform/IaC directory or plan JSON file.",
            },
            configFile: {
              type: "string",
              description: "Path to Infracost config file.",
            },
            usageFile: {
              type: "string",
              description: "Path to Infracost usage file.",
            },
            format: {
              type: "string",
              description: "Output format: table, json, html, diff, github-comment, etc.",
              default: "table",
            },
            compareTo: {
              type: "string",
              description: "Path to baseline Infracost JSON for comparison.",
            },
            showSkus: {
              type: "boolean",
              description: "Show SKU details.",
              default: false,
            },
            syncUsageFile: {
              type: "boolean",
              description: "Sync usage file with missing resources.",
              default: false,
            },
            terraformWorkspace: {
              type: "string",
              description: "Terraform workspace to use.",
            },
            terraformPlanFlags: {
              type: "string",
              description: "Flags to pass to 'terraform plan'.",
            },
            apiKey: {
              type: "string",
              description: "Infracost API key.",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_output",
        description:
          "Format Infracost JSON output to different formats (table, html, github-comment, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed.",
            },
            path: {
              type: "string",
              description:
                "Path to Infracost JSON file. Optional; auto-detected from common filenames when omitted.",
            },
            format: {
              type: "string",
              description: "Output format: table, json, html, diff, github-comment, etc.",
              default: "table",
            },
            fields: {
              type: "array",
              description: "Fields to include in output.",
              items: { type: "string" },
            },
            showSkus: {
              type: "boolean",
              description: "Show SKU details.",
              default: false,
            },
            apiKey: {
              type: "string",
              description: "Infracost API key.",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_comment",
        description:
          "Post cost estimate comments to pull requests on GitHub, GitLab, Azure Repos, or Bitbucket.",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed.",
            },
            platform: {
              type: "string",
              description: "Platform: github, gitlab, azure-repos, or bitbucket.",
              default: "github",
            },
            path: {
              type: "string",
              description:
                "Path to Infracost JSON file. Optional; auto-detected from common filenames when omitted.",
            },
            repo: {
              type: "string",
              description: "Repository in format owner/repo.",
            },
            pullRequest: {
              type: "string",
              description: "Pull request number.",
            },
            commit: {
              type: "string",
              description: "Commit SHA.",
            },
            token: {
              type: "string",
              description: "GitHub/GitLab/Azure DevOps/Bitbucket token.",
            },
            tag: {
              type: "string",
              description: "Customize comment tag to support multiple scenarios.",
            },
            behavior: {
              type: "string",
              description: "Behavior: update (default), new, or delete-and-new.",
            },
            dryRun: {
              type: "boolean",
              description: "Dry run mode - generate comment without posting.",
              default: false,
            },
            apiKey: {
              type: "string",
              description: "Infracost API key.",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_upload",
        description:
          "Upload Infracost JSON output to Infracost Cloud for centralized cost visibility and reporting.",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed.",
            },
            path: {
              type: "string",
              description:
                "Path to Infracost JSON file to upload. Optional; auto-detected from common filenames when omitted.",
            },
            apiKey: {
              type: "string",
              description: "Infracost API key.",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_configure",
        description:
          "Get or set Infracost configuration options (API key, currency, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed.",
            },
            set: {
              type: "string",
              description: "Set configuration key-value (e.g., 'api_key=YOUR_KEY' or 'currency=EUR').",
            },
            get: {
              type: "string",
              description: "Get configuration value for a key (e.g., 'api_key', 'currency').",
            },
            apiKey: {
              type: "string",
              description: "Infracost API key.",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_auth",
        description:
          "Authenticate with Infracost Cloud. Opens browser for login flow.",
        inputSchema: {
          type: "object",
          properties: {
            workingDirectory: {
              type: "string",
              description: "Directory where the command is executed.",
            },
            apiKey: {
              type: "string",
              description: "Infracost API key (alternative to browser login).",
            },
            timeoutSeconds: {
              type: "number",
              description: "Command timeout in seconds.",
              default: DEFAULT_TIMEOUT_SECONDS,
            },
            extraArgs: {
              type: "array",
              description: "Additional CLI arguments.",
              items: { type: "string" },
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "infracost_generate_usage",
        description:
          "Generate Infracost usage file with sensible defaults for specified resource types. Complements infracost_configure by providing pre-filled templates.",
        inputSchema: {
          type: "object",
          properties: {
            resourceTypes: {
              type: "array",
              description:
                "Resource types to include in usage file (e.g., [\"aws_lambda_function\", \"aws_s3_bucket\"]). Required.",
              items: { type: "string" },
            },
            outputFilePath: {
              type: "string",
              description: "Optional path where the usage file should be saved (for guidance only).",
            },
            includeGuidance: {
              type: "boolean",
              description:
                "Include formatted guidance on how to use the generated file. Default: true.",
              default: true,
            },
            onlyJson: {
              type: "boolean",
              description: "Return only the raw JSON (no guidance). Overrides includeGuidance. Default: false.",
              default: false,
            },
          },
          required: ["resourceTypes"],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = (request.params.arguments ?? {}) as ToolArgs;

  if (request.params.name === "infracost_breakdown") {
    return handleBreakdownTool(args);
  }

  if (request.params.name === "infracost_diff") {
    return handleDiffTool(args);
  }

  if (request.params.name === "infracost_output") {
    return handleOutputTool(args);
  }

  if (request.params.name === "infracost_comment") {
    return handleCommentTool(args);
  }

  if (request.params.name === "infracost_upload") {
    return handleUploadTool(args);
  }

  if (request.params.name === "infracost_configure") {
    return handleConfigureTool(args);
  }

  if (request.params.name === "infracost_auth") {
    return handleAuthTool(args);
  }

  if (request.params.name === "infracost_generate_usage") {
    return handleGenerateUsageTool(args);
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${request.params.name}`,
      },
    ],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const isMainModule =
  typeof process.argv[1] === "string" &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal MCP server error:", error);
    process.exit(1);
  });
}
