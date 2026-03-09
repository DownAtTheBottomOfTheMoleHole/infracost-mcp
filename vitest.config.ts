import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "vitest.config.ts",
      ],
          thresholds: {
            branches: 30,
            functions: 55,
            lines: 40,
            statements: 40,
          },
    },
  },
});
