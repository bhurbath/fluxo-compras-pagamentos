import { getDb } from "@/lib/db";

// The app's own client, re-exported under this name for readability in test
// files. It's the SAME client service-layer code uses (src/lib/db.ts) —
// tests/setup.ts redirects it at the "test" schema before any test file
// runs (and asserts the redirect worked), so there is no separate test-only
// client to keep in sync.
export const testDb = getDb();

// Truncates every domain table between tests so each test starts from a
// clean slate without needing to re-run migrations. Extend this list as new
// tables are added by later tickets. Schema-qualified so it can never reach
// the dev database's tables even if search_path resolution changes.
export async function resetDb(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "test"."usuarios", "test"."departamentos" RESTART IDENTITY CASCADE;`
  );
}
