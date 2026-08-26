import { createPrismaClient } from "@/lib/db";

// Same connection-construction logic as the app's own client (src/lib/db.ts),
// just pointed at the "test" schema of the same database instead of
// "public" — so the two can't silently diverge.
export const testDb = createPrismaClient(
  process.env.DATABASE_URL_TEST,
  "DATABASE_URL_TEST",
  "test"
);

// Truncates every domain table between tests so each test starts from a clean
// slate without needing to re-run migrations. Extend this list as new tables
// are added by later tickets. Schema-qualified so it can never reach the dev
// database's tables even if search_path resolution changes.
export async function resetDb(): Promise<void> {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE "test"."usuarios" RESTART IDENTITY CASCADE;`
  );
}
