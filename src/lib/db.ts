import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Builds a Prisma Client against a given schema (defaults to "public").
 * Shared by the app's own client below and by tests/helpers/db.ts, so the
 * connection-construction logic (validation, adapter options) can't drift
 * between runtime and tests.
 *
 * `schema` is passed two ways because `pg` (unlike Prisma's own CLI
 * connector) does not honor a `?schema=` query param: `options` sets
 * search_path at the connection level for raw queries, and the adapter's
 * `schema` option covers Prisma-generated queries. Without both, queries
 * silently fall back to "public".
 */
export function createPrismaClient(
  url: string | undefined,
  varName: string,
  schema?: string
): PrismaClient {
  if (!url) {
    throw new Error(`${varName} não está definido.`);
  }

  const adapter = new PrismaPg(
    {
      connectionString: url,
      ...(schema ? { options: `-c search_path=${schema}` } : {}),
    },
    schema ? { schema } : undefined
  );

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
