import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Builds a Prisma Client against a given schema (defaults to "public").
 * Shared by getDb() below and by tests/helpers/db.ts, so the
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

let cachedClient: PrismaClient | undefined;

/**
 * The app's shared Prisma Client, constructed lazily on first call rather
 * than at module-import time. This matters beyond style: `import` statements
 * are hoisted and evaluated before any other code in the importing module,
 * so a module-eval-time singleton reads process.env.DATABASE_URL before
 * that importing module's own env-loading code (e.g. a CLI script calling
 * process.loadEnvFile()) has had a chance to run — it fails even though the
 * import only wanted createPrismaClient, not this client. Deferring
 * construction to first *call* sidesteps that ordering hazard entirely.
 */
export function getDb(): PrismaClient {
  if (cachedClient) return cachedClient;

  if (globalForPrisma.prisma) {
    cachedClient = globalForPrisma.prisma;
    return cachedClient;
  }

  cachedClient = createPrismaClient(
    process.env.DATABASE_URL,
    "DATABASE_URL",
    process.env.DATABASE_SCHEMA
  );

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = cachedClient;
  }

  return cachedClient;
}
