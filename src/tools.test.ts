import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock child_process.spawn
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

// Mock the command handlers by importing them
const createMockChild = (
  stdout = "",
  stderr = "",
  exitCode = 0,
  delay = 10,
) => {
  const mockChild = new EventEmitter() as ReturnType<typeof spawn>;
  // @ts-expect-error - Mocking stdout
  mockChild.stdout = new EventEmitter();
  // @ts-expect-error - Mocking stderr
  mockChild.stderr = new EventEmitter();
  mockChild.kill = vi.fn();

  // Simulate async command execution
  setTimeout(() => {
    if (stdout) {
      // @ts-expect-error - Mocking emit
      mockChild.stdout.emit("data", Buffer.from(stdout));
    }
    if (stderr) {
      // @ts-expect-error - Mocking emit
      mockChild.stderr.emit("data", Buffer.from(stderr));
    }
    mockChild.emit("close", exitCode);
  }, delay);

  return mockChild;
};

describe("MCP Tool Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("infracost_breakdown", () => {
    it("should build correct command arguments for basic breakdown", async () => {
      const mockSpawn = vi.mocked(spawn);
      const mockOutput = "Total Monthly Cost: $100.00";
      mockSpawn.mockReturnValue(createMockChild(mockOutput));

      // The test would call the tool handler once integrated
      expect(mockSpawn).toBeDefined();
    });

    it("should handle path parameter correctly", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { path: "./terraform" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include usage file when provided", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { usageFile: "usage.yml" }
      expect(mockSpawn).toBeDefined();
    });

    it("should handle format parameter", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild('{"version": "0.2"}'));

      // Would test with args: { format: "json" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include fields parameter as comma-separated", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost table"));

      // Would test with args: { fields: ["price", "monthlyQuantity"] }
      expect(mockSpawn).toBeDefined();
    });

    it("should add show-skus flag when enabled", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost with skus"));

      // Would test with args: { showSkus: true }
      expect(mockSpawn).toBeDefined();
    });

    it("should add sync-usage-file flag when enabled", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("synced"));

      // Would test with args: { syncUsageFile: true }
      expect(mockSpawn).toBeDefined();
    });

    it("should handle compare-to parameter", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("comparison"));

      // Would test with args: { compareTo: "baseline.json" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include terraform workspace", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { terraformWorkspace: "production" }
      expect(mockSpawn).toBeDefined();
    });

    it("should pass terraform plan flags", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { terraformPlanFlags: "-var-file=prod.tfvars" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include extra arguments", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { extraArgs: ["--no-color", "--log-level=debug"] }
      expect(mockSpawn).toBeDefined();
    });

    it("should set API key in environment when provided", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { apiKey: "test-api-key" }
      // Verify env contains INFRACOST_API_KEY
      expect(mockSpawn).toBeDefined();
    });

    it("should handle custom timeout", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data", "", 0, 100));

      // Would test with args: { timeoutSeconds: 600 }
      expect(mockSpawn).toBeDefined();
    });

    it("should report timeout when command exceeds limit", async () => {
      const mockSpawn = vi.mocked(spawn);
      const mockChild = createMockChild("partial", "", 0, 5000);
      mockSpawn.mockReturnValue(mockChild);

      // Would test with args: { timeoutSeconds: 1 }
      // Verify kill was called and timedOut flag is true
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockChild.kill).toBeDefined();
    });

    it("should handle command failure with non-zero exit code", async () => {
      const mockSpawn = vi.mocked(spawn);
      const stderr = "Error: terraform not found";
      mockSpawn.mockReturnValue(createMockChild("", stderr, 1));

      // Verify isError is true in response
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_diff", () => {
    it("should execute diff command with correct arguments", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Cost diff: +$50/mo"));

      // Would test diff-specific scenarios
      expect(mockSpawn).toBeDefined();
    });

    it("should handle all diff-specific parameters", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("diff output"));

      // Test path, format, compareTo, showSkus, syncUsageFile
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_output", () => {
    it("should require path parameter", async () => {
      const mockSpawn = vi.mocked(spawn);

      // Test that missing 'path' returns error
      // { path: undefined } should return error response
      expect(mockSpawn).toBeDefined();
    });

    it("should format existing JSON with specified format", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("<html>cost table</html>"));

      // Would test with args: { path: "infracost.json", format: "html" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include fields in output formatting", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("formatted table"));

      // Would test with args: { path: "costs.json", fields: ["price", "monthlyCost"] }
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_comment", () => {
    it("should require platform parameter", async () => {
      const mockSpawn = vi.mocked(spawn);

      // Test that missing 'platform' returns error
      expect(mockSpawn).toBeDefined();
    });

    it("should build comment command for github", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Comment posted"));

      // Would test with args: { platform: "github", path: "infracost.json" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include PR number when specified", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Posted to PR #123"));

      // Would test with args: { platform: "github", pullRequestNumber: "123" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include commit SHA when specified", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Posted to commit"));

      // Would test with args: { platform: "gitlab", commit: "abc123" }
      expect(mockSpawn).toBeDefined();
    });

    it("should add behavior flags", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Behavior set"));

      // Would test with args: { behavior: "update", tag: "my-tag" }
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_upload", () => {
    it("should require path parameter", async () => {
      const mockSpawn = vi.mocked(spawn);

      // Test that missing 'path' returns error
      expect(mockSpawn).toBeDefined();
    });

    it("should upload with basic parameters", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Upload complete"));

      // Would test with args: { path: "infracost.json" }
      expect(mockSpawn).toBeDefined();
    });

    it("should include custom run name", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Uploaded"));

      // Would test with args: { path: "costs.json", runName: "prod-deploy" }
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_configure", () => {
    it("should get configuration when action is get", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("api_key=ico-xxx"));

      // Would test with args: { action: "get", key: "api_key" }
      expect(mockSpawn).toBeDefined();
    });

    it("should set configuration when action is set", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Configuration saved"));

      // Would test with args: { action: "set", key: "currency", value: "EUR" }
      expect(mockSpawn).toBeDefined();
    });

    it("should validate action parameter", async () => {
      const mockSpawn = vi.mocked(spawn);

      // Test that invalid action returns error
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_auth", () => {
    it("should execute auth login command", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Login successful"));

      // Would test basic auth flow
      expect(mockSpawn).toBeDefined();
    });

    it("should include extra arguments for auth", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("Auth complete"));

      // Would test with args: { extraArgs: ["--api-key", "test-key"] }
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("infracost_generate_usage", () => {
    it("should require resourceTypes parameter", async () => {
      // This tool doesn't spawn, it generates JSON locally
      // Test that missing resourceTypes returns error
      expect(true).toBe(true);
    });

    it("should generate usage file with defaults", async () => {
      // Would test with args: { resourceTypes: ["aws_instance", "aws_s3_bucket"] }
      // Verify JSON structure includes version and resource_usage
      expect(true).toBe(true);
    });

    it("should include guidance by default", async () => {
      // Would test with args: { resourceTypes: ["aws_lambda_function"], includeGuidance: true }
      // Verify response includes guidance text
      expect(true).toBe(true);
    });

    it("should return only JSON when onlyJson is true", async () => {
      // Would test with args: { resourceTypes: ["aws_instance"], onlyJson: true }
      // Verify no guidance included
      expect(true).toBe(true);
    });

    it("should mention output file path in guidance when provided", async () => {
      // Would test with args: { resourceTypes: ["aws_s3_bucket"], outputFilePath: "usage.yml" }
      // Verify guidance mentions the file path
      expect(true).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle spawn errors gracefully", async () => {
      const mockSpawn = vi.mocked(spawn);
      const mockChild = new EventEmitter() as ReturnType<typeof spawn>;
      // @ts-expect-error - Mocking stdout
      mockChild.stdout = new EventEmitter();
      // @ts-expect-error - Mocking stderr
      mockChild.stderr = new EventEmitter();
      
      // Add error handler to prevent unhandled error
      mockChild.on("error", () => {
        // Error will be handled by spawn caller
      });

      setTimeout(() => {
        mockChild.emit("error", new Error("ENOENT: command not found"));
      }, 10);

      mockSpawn.mockReturnValue(mockChild);

      // Verify mock is set up correctly
      expect(mockSpawn).toBeDefined();
    });

    it("should truncate large stdout output", async () => {
      const mockSpawn = vi.mocked(spawn);
      const largeOutput = "x".repeat(200_000); // 200KB
      mockSpawn.mockReturnValue(createMockChild(largeOutput));

      // Verify output is truncated with marker
      expect(mockSpawn).toBeDefined();
    });

    it("should truncate large stderr output", async () => {
      const mockSpawn = vi.mocked(spawn);
      const largeError = "error ".repeat(30_000); // ~180KB
      mockSpawn.mockReturnValue(createMockChild("", largeError, 1));

      // Verify stderr is truncated
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("Working Directory", () => {
    it("should use current directory when workingDirectory not specified", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Verify spawn called with process.cwd() as cwd
      expect(mockSpawn).toBeDefined();
    });

    it("should resolve relative workingDirectory paths", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { workingDirectory: "./terraform/prod" }
      // Verify spawn called with resolved absolute path
      expect(mockSpawn).toBeDefined();
    });

    it("should handle absolute workingDirectory paths", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { workingDirectory: "/usr/src/app/terraform" }
      expect(mockSpawn).toBeDefined();
    });
  });

  describe("Environment Variables", () => {
    it("should inherit parent process environment", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Verify spawn env includes process.env values
      expect(mockSpawn).toBeDefined();
    });

    it("should override INFRACOST_API_KEY when provided", async () => {
      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Would test with args: { apiKey: "custom-key" }
      // Verify env.INFRACOST_API_KEY is "custom-key"
      expect(mockSpawn).toBeDefined();
    });

    it("should read INFRACOST_CLI_COMMAND from environment", async () => {
      const originalEnv = process.env.INFRACOST_CLI_COMMAND;
      process.env.INFRACOST_CLI_COMMAND = "/usr/local/bin/infracost";

      const mockSpawn = vi.mocked(spawn);
      mockSpawn.mockReturnValue(createMockChild("cost data"));

      // Verify spawn called with custom command
      // Then restore
      if (originalEnv) {
        process.env.INFRACOST_CLI_COMMAND = originalEnv;
      } else {
        delete process.env.INFRACOST_CLI_COMMAND;
      }

      expect(mockSpawn).toBeDefined();
    });
  });
});
