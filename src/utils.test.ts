import process from "node:process";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatOutput,
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
});
