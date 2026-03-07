import process from "node:process";

export type ToolArgs = Record<string, unknown>;

export function readString(args: ToolArgs, key: string): string | undefined {
  const value = args[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function readBool(
  args: ToolArgs,
  key: string,
  defaultValue = false,
): boolean {
  const value = args[key];
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
}

export function readNumber(
  args: ToolArgs,
  key: string,
  defaultValue: number,
): number {
  const value = args[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

export function readStringArray(args: ToolArgs, key: string): string[] {
  const value = args[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function formatOutput(output: string, maxChars = 120_000): string {
  if (maxChars <= 0) {
    return "";
  }

  if (output.length <= maxChars) {
    return output;
  }

  const marker = "\n\n... output truncated ...\n\n";

  // If the maximum allowed size is too small to include the marker and any
  // surrounding content, just return a prefix of the original output.
  if (maxChars <= marker.length) {
    return output.slice(0, maxChars);
  }

  const remaining = maxChars - marker.length;
  const headLength = Math.floor(remaining * 0.6);
  const tailLength = remaining - headLength;

  const head = output.slice(0, headLength);
  const tail = output.slice(output.length - tailLength);

  return `${head}${marker}${tail}`;
}

export function resolveInfracostCommand(): string {
  // Users can override the Infracost binary path via environment variable
  return process.env.INFRACOST_BINARY_PATH ?? "infracost";
}

export type UsageDefaults = Record<string, Record<string, number | string | boolean>>;

export const INFRACOST_USAGE_DEFAULTS: UsageDefaults = {
  // AWS Lambda
  aws_lambda_function: {
    monthly_requests: 1_000_000,
    request_duration_ms: 300,
  },
  // AWS EC2
  aws_instance: {
    operating_system: "linux",
    allocated_storage_gb: 30,
    vcpu_count: 2,
    memory_gb: 4,
  },
  // AWS RDS
  "aws_db_instance": {
    allocated_storage_gb: 100,
    engine: "postgres",
    multi_az: false,
    backup_retention_days: 7,
  },
  // AWS S3
  aws_s3_bucket: {
    storage_gb: 500,
    monthly_put_requests: 100_000,
    monthly_get_requests: 1_000_000,
  },
  // AWS DynamoDB
  aws_dynamodb_table: {
    billing_mode: "PAY_PER_REQUEST",
    on_demand_write_capacity: 1,
    on_demand_read_capacity: 1,
  },
  // AWS EBS
  aws_ebs_volume: {
    size_gb: 100,
    iops: 100,
    throughput_mbps: 125,
  },
  // AWS CloudFront
  aws_cloudfront_distribution: {
    monthly_data_transfer_out_gb: 1000,
    monthly_requests: 10_000_000,
  },
  // AWS Load Balancer
  aws_lb: {
    monthly_new_connections: 100_000,
    monthly_processed_bytes_gb: 100,
  },
  // AWS NAT Gateway
  aws_nat_gateway: {
    monthly_data_processed_gb: 10,
  },
  // Google Compute Engine VM
  google_compute_instance: {
    machine_type: "n1-standard-2",
    os: "linux",
    storage_gb: 50,
  },
  // Google Cloud Storage
  google_storage_bucket: {
    storage_gb: 500,
    monthly_class_a_operations: 100_000,
    monthly_class_b_operations: 500_000,
  },
  // Azure VM
  azurerm_windows_virtual_machine: {
    vm_size: "Standard_B2s",
    storage_gb: 128,
  },
  azurerm_linux_virtual_machine: {
    vm_size: "Standard_B2s",
    storage_gb: 128,
  },
  // Azure Storage Account
  azurerm_storage_account: {
    storage_gb: 500,
    monthly_access_tier: "Hot",
  },
  // Azure SQL Database
  azurerm_mssql_database: {
    sku_name: "Standard_S1",
    storage_gb: 250,
  },
};

/**
 * Generate an Infracost usage file with sensible defaults for specified resource types.
 * @param resourceTypes - Array of resource types (e.g., ["aws_lambda_function", "aws_s3_bucket"])
 * @returns A JavaScript object representing the usage file
 */
export function generateUsageFile(resourceTypes: string[]): UsageDefaults {
  const usage: UsageDefaults = {};

  for (const resourceType of resourceTypes) {
    if (resourceType in INFRACOST_USAGE_DEFAULTS) {
      usage[resourceType] = INFRACOST_USAGE_DEFAULTS[resourceType];
    }
  }

  return usage;
}

/**
 * Generate guidance text describing how to use the generated usage file.
 * @param resourceTypes - Array of resource types that were generated
 * @param outputFilePath - Optional path where the file should be saved
 * @returns Formatted guidance text
 */
export function generateUsageGuidance(
  resourceTypes: string[],
  outputFilePath?: string,
): string {
  const lines: string[] = [
    "## Generated Infracost Usage File",
    "",
    `This usage file includes sensible defaults for ${resourceTypes.length} resource type(s):`,
    "",
    resourceTypes.map((type) => `  • ${type}`).join("\n"),
    "",
    "## How to Use",
    "",
    "1. **Save the file**: Use the JSON output above and save it to a file (e.g., `infracost-usage.json`).",
    outputFilePath
      ? `   Suggested path: ${outputFilePath}`
      : "   Example path: `./infracost-usage.json`",
    "",
    "2. **Customize values**: The defaults assume moderate usage. Adjust values to match your actual workload:",
    "   - For Lambda: Increase `monthly_requests` for high-traffic functions",
    "   - For S3: Adjust `storage_gb` and request volumes based on your application",
    "   - For RDS: Set appropriate `allocated_storage_gb` and backup retention",
    "   - For DynamoDB: Update capacity based on provisioned or on-demand mode",
    "",
    "3. **Use with Infracost**:",
    "",
    "   **Breakdown:**",
    "   ```bash",
    "   infracost breakdown --path . --usage-file ./infracost-usage.json --format table",
    "   ```",
    "",
    "   **Diff (for PR reviews):**",
    "   ```bash",
    "   infracost diff --path . --usage-file ./infracost-usage.json --format github-comment",
    "   ```",
    "",
    "4. **Sync with Infracost Cloud** (optional):",
    "   ```bash",
    "   infracost breakdown --path . --usage-file ./infracost-usage.json --sync-usage-file",
    "   ```",
    "",
    "## Resource Types and Key Usage Metrics",
    "",
    ...resourceTypes.map((resourceType) => {
      const defaults = INFRACOST_USAGE_DEFAULTS[resourceType];
      if (!defaults) return `  - ${resourceType}: (no defaults available)`;

      const metrics = Object.entries(defaults)
        .map(([key, value]) => {
          if (typeof value === "number") {
            return `${key}: ${value.toLocaleString()}`;
          }

          return `${key}: ${value}`;
        })
        .join(", ");

      return `  - ${resourceType}: ${metrics}`;
    }),
    "",
    "## Validation",
    "",
    "Run `infracost validate-config --file ./infracost-usage.json` to check for syntax errors.",
    "",
    "## Documentation",
    "",
    "For more information on usage files, see:",
    "  https://www.infracost.io/docs/features/usage_based_resources/",
  ];

  return lines.join("\n");
}
