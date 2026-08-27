import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // All test files share one real "test" schema (truncated between each
    // test, not per-file) — running files in parallel would let one file's
    // TRUNCATE race another file's in-flight assertions against the same
    // tables, so file-level parallelism has to stay off.
    fileParallelism: false,
    // Every assertion hits a real Postgres instance over a pooler, not a
    // mock — tests chaining several workflow calls (e.g. reject → edit →
    // resend) routinely take longer than Vitest's 5s default under normal
    // network latency, with no actual hang involved.
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
