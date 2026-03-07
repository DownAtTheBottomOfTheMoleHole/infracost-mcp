import process from "node:process";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatOutput,
  generateUsageFile,
  generateUsageGuidance,
  readBool,
  readNumber,
  readString,
  readStringArray,
  resolveInfracostCommand,
  type ToolArgs,
} from "./utils.js";

const originalInfracostPath = process.env.INFRACOST_BINARY_PATH;

afterEach(() => {
  if (originalInfracostPath === undefined) {
    delete process.env.INFRACOST_BINARY_PATH;
    return;
  }

  process.env.INFRACOST_BINARY_PATH = originalInfracostPath;
});

describe("utils", () => {
  it("readString returns trimmed non-empty strings", () => {
    const args: ToolArgs = { name: "  test-value  " };
    expect(readString(args, "name")).toBe("test-value");
    expect(readString({ name: "   " }, "name")).toBeUndefined();
    expect(readString({ name: 10 }, "name")).toBeUndefined();
  });

  it("readBool handles booleans, string values, and defaults", () => {
    expect(readBool({ flag: true }, "flag")).toBe(true);
    expect(readBool({ flag: "yes" }, "flag")).toBe(true);
    expect(readBool({ flag: "0" }, "flag", true)).toBe(false);
    expect(readBool({ flag: "invalid" }, "flag", true)).toBe(true);
  });

  it("readNumber parses numeric values and falls back to default", () => {
    expect(readNumber({ timeout: 42 }, "timeout", 10)).toBe(42);
    expect(readNumber({ timeout: "7" }, "timeout", 10)).toBe(7);
    expect(readNumber({ timeout: "abc" }, "timeout", 10)).toBe(10);
  });

  it("readStringArray returns trimmed string items only", () => {
    const args: ToolArgs = {
      values: [" a ", "", "  ", 5, "b"],
    };

    expect(readStringArray(args, "values")).toEqual(["a", "b"]);
    expect(readStringArray({}, "values")).toEqual([]);
  });

  it("formatOutput truncates large output and keeps marker", () => {
    const output = "x".repeat(500);
    const truncated = formatOutput(output, 100);

    expect(truncated.length).toBe(100);
    expect(truncated).toContain("... output truncated ...");
  });

  it("resolveInfracostCommand reads environment override", () => {
    delete process.env.INFRACOST_BINARY_PATH;
    expect(resolveInfracostCommand()).toBe("infracost");

    process.env.INFRACOST_BINARY_PATH = "/usr/local/bin/infracost-custom";
    expect(resolveInfracostCommand()).toBe("/usr/local/bin/infracost-custom");
  });

  it("generateUsageFile creates defaults for specified resource types", () => {
    const usage = generateUsageFile([
      "aws_lambda_function",
      "aws_s3_bucket",
      "unknown_resource",
    ]);

    expect(usage).toHaveProperty("aws_lambda_function");
    expect(usage["aws_lambda_function"]).toHaveProperty("monthly_requests", 1_000_000);
    expect(usage).toHaveProperty("aws_s3_bucket");
    expect(usage["aws_s3_bucket"]).toHaveProperty("storage_gb", 500);
    expect(usage).not.toHaveProperty("unknown_resource");
  });

  it("generateUsageGuidance produces formatted guidance text", () => {
    const guidance = generateUsageGuidance(
      ["aws_lambda_function", "aws_s3_bucket"],
      "./infracost-usage.json",
    );

    expect(guidance).toContain("Generated Infracost Usage File");
    expect(guidance).toContain("aws_lambda_function");
    expect(guidance).toContain("aws_s3_bucket");
    expect(guidance).toContain("./infracost-usage.json");
    expect(guidance).toContain("infracost breakdown");
    expect(guidance).toContain("infracost diff");
    expect(guidance).toContain("monthly_requests");
    expect(guidance).toContain("storage_gb");
  });

  it("generateUsageGuidance handles empty resource types", () => {
    const guidance = generateUsageGuidance([]);

    expect(guidance).toContain("0 resource type");
  });
});
