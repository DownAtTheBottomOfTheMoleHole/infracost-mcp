import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

import {
  handleCommentTool,
  handleOutputTool,
  handleUploadTool,
} from "./index.js";

const createMockChild = (
  stdout = "",
  stderr = "",
  exitCode = 0,
  delayMs = 1,
) => {
  const mockChild = new EventEmitter() as ReturnType<typeof spawn>;
  // @ts-expect-error mocked stream
  mockChild.stdout = new EventEmitter();
  // @ts-expect-error mocked stream
  mockChild.stderr = new EventEmitter();
  mockChild.kill = vi.fn();

  setTimeout(() => {
    if (stdout) {
      // @ts-expect-error mocked stream emit
      mockChild.stdout.emit("data", Buffer.from(stdout));
    }
    if (stderr) {
      // @ts-expect-error mocked stream emit
      mockChild.stderr.emit("data", Buffer.from(stderr));
    }
    mockChild.emit("close", exitCode);
  }, delayMs);

  return mockChild;
};

describe("report path auto-detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spawn).mockReturnValue(createMockChild("ok"));
    vi.mocked(existsSync).mockReturnValue(false);
  });

  it("uses explicit path without checking auto-detection candidates", async () => {
    const result = await handleOutputTool({
      workingDirectory: "/tmp/work",
      path: "custom-report.json",
      format: "json",
    });

    expect(result.isError).toBe(false);
    expect(existsSync).not.toHaveBeenCalled();
    expect(spawn).toHaveBeenCalledTimes(1);

    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).toEqual([
      "output",
      "--path",
      "custom-report.json",
      "--format",
      "json",
    ]);
  });

  it("prefers infracost-diff.json when multiple root report files exist", async () => {
    const cwd = "/tmp/work";
    vi.mocked(existsSync).mockImplementation((candidate) => {
      const candidatePath = String(candidate);
      return (
        candidatePath === path.resolve(cwd, "infracost-diff.json") ||
        candidatePath === path.resolve(cwd, "infracost-base.json")
      );
    });

    const result = await handleOutputTool({
      workingDirectory: cwd,
      format: "table",
    });

    expect(result.isError).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(1);
    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).toContain("infracost-diff.json");
    expect(args).not.toContain("infracost-base.json");
  });

  it("supports .infracost report files when root files are missing", async () => {
    const cwd = "/tmp/work";
    vi.mocked(existsSync).mockImplementation((candidate) => {
      return String(candidate) === path.resolve(cwd, ".infracost/infracost-base.json");
    });

    const result = await handleUploadTool({
      workingDirectory: cwd,
    });

    expect(result.isError).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(1);
    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args).toContain(".infracost/infracost-base.json");
  });

  it("returns a clear missing-report error when no candidates are found", async () => {
    const result = await handleCommentTool({
      workingDirectory: "/tmp/work",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain(
      "Error: no Infracost JSON report found for infracost_comment.",
    );
    expect(result.content[0].text).toContain("extraArgs");
    expect(spawn).not.toHaveBeenCalled();
  });

  it("defaults comment platform to github when auto-detecting a report", async () => {
    const cwd = "/tmp/work";
    vi.mocked(existsSync).mockImplementation((candidate) => {
      return String(candidate) === path.resolve(cwd, "infracost-diff.json");
    });

    const result = await handleCommentTool({
      workingDirectory: cwd,
      repo: "org/repo",
      pullRequest: "20",
      dryRun: true,
    });

    expect(result.isError).toBe(false);
    expect(spawn).toHaveBeenCalledTimes(1);

    const [, args] = vi.mocked(spawn).mock.calls[0];
    expect(args.slice(0, 4)).toEqual([
      "comment",
      "github",
      "--path",
      "infracost-diff.json",
    ]);
    expect(args).toContain("--repo");
    expect(args).toContain("org/repo");
    expect(args).toContain("--pull-request");
    expect(args).toContain("20");
    expect(args).toContain("--dry-run");
  });
});
