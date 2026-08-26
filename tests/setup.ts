// Loads local env files so the real-Postgres test suite (see tests/helpers/db.ts)
// can pick up DATABASE_URL_TEST without every test file wiring this up itself.
for (const file of [".env.test", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // File not present — fine, CI injects env vars directly.
  }
}
