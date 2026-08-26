import { getDb } from "@/lib/db";

// Loads local env files so the real-Postgres test suite can pick up
// DATABASE_URL_TEST without every test file wiring this up itself.
for (const file of [".env.test", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // File not present — fine, CI injects env vars directly.
  }
}

// Redirect the app's own db client (src/lib/db.ts) at the test schema
// *before* any test file imports it. Service-layer code (e.g.
// src/lib/departamentos.ts) always calls getDb() from "@/lib/db" — there's
// no separate "testDb" version of it — so without this redirect, tests
// would silently read/write the real dev database instead of the isolated
// one. getDb() only constructs its client lazily on first call (not at
// import time), so setting these env vars here, before that first call
// happens, is what makes the redirect take effect.
if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    "DATABASE_URL_TEST não está definido. A suíte de testes roda contra um Postgres " +
      "real (nunca mockado) — defina DATABASE_URL_TEST em .env.test ou .env."
  );
}
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.DATABASE_SCHEMA = "test";

// Don't just assume the redirect worked — confirm the client this process
// will use for the rest of the run is actually talking to "test", not
// "public". Cheap insurance against ever silently running tests against the
// real dev database.
const [{ schema }] = await getDb().$queryRawUnsafe<{ schema: string }[]>(
  "SELECT current_schema() AS schema"
);
if (schema !== "test") {
  throw new Error(
    `Suíte de testes conectada ao schema "${schema}", esperava "test". ` +
      "Abortando para não arriscar tocar no banco de dev."
  );
}
