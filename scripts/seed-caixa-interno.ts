// One-off, idempotente: cria o tipo de compra "Caixa Interno" (prestação de
// contas de despesa já paga pelo caixa interno), marcado com a flag
// caixaInterno, caso ainda não exista. Roda de novo sem problema — upsert
// por nome.
//
// Uso: npx tsx scripts/seed-caixa-interno.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  const tipo = await db.tipoCompra.upsert({
    where: { nome: "Caixa Interno" },
    update: { caixaInterno: true },
    create: { nome: "Caixa Interno", caixaInterno: true },
  });
  console.log(`OK: tipo de compra "${tipo.nome}" marcado como Caixa Interno.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
