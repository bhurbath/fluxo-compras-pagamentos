import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. in CI where vars are injected directly).
}

// The CLI (migrate, studio) needs a direct/session connection — Postgres
// migrations require prepared statements, which the transaction-mode pooler
// (DATABASE_URL, used by the app at runtime) doesn't support.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
