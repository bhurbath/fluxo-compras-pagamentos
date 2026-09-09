// One-off, idempotente: cria o tipo de compra "Recarga ONFLY / Fundo Fixo",
// marcado com a flag fundoFixo, caso ainda não exista. Roda de novo sem
// problema — upsert por nome.
//
// Uso: npx tsx scripts/seed-fundo-fixo.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  const tipo = await db.tipoCompra.upsert({
    where: { nome: "Recarga ONFLY / Fundo Fixo" },
    update: { fundoFixo: true },
    create: { nome: "Recarga ONFLY / Fundo Fixo", fundoFixo: true },
  });
  console.log(`OK: tipo de compra "${tipo.nome}" marcado como Fundo Fixo.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
