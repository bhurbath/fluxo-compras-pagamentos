// One-off, idempotente: cria o tipo de compra "Adiantamento para Compras
// Industriais", marcado com a flag adiantamentoIndustrial, caso ainda não
// exista. Roda de novo sem problema — upsert por nome.
//
// Uso: npx tsx scripts/seed-adiantamento-industrial.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  const tipo = await db.tipoCompra.upsert({
    where: { nome: "Adiantamento para Compras Industriais" },
    update: { adiantamentoIndustrial: true },
    create: { nome: "Adiantamento para Compras Industriais", adiantamentoIndustrial: true },
  });
  console.log(`OK: tipo de compra "${tipo.nome}" marcado como Adiantamento Industrial.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
