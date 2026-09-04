// One-off, idempotente: cria o tipo de compra "RDV" (prestação de contas de
// reembolso), marcado com a flag rdv, caso ainda não exista. Roda de novo
// sem problema — upsert por nome.
//
// Uso: npx tsx scripts/seed-rdv.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  const tipo = await db.tipoCompra.upsert({
    where: { nome: "RDV" },
    update: { rdv: true },
    create: { nome: "RDV", rdv: true },
  });
  console.log(`OK: tipo de compra "${tipo.nome}" marcado como RDV.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
