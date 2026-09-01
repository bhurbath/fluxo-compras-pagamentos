// One-off, idempotente: cria a lista inicial de categorias de despesa de
// pessoal e o tipo de compra "Despesa de Pessoal" (marcado despesaPessoal),
// caso ainda não existam. Roda de novo sem problema — upsert por nome.
//
// Uso: npx tsx scripts/seed-despesa-pessoal.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const CATEGORIAS = [
  "Salários",
  "Adiantamentos",
  "Férias",
  "Rescisões",
  "Benefícios",
  "Taxas Assistenciais",
  "Taxas Sindicais",
  "Encargos",
  "Exames",
  "Entidades de apoio",
  "Planos de Saúde",
];

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  for (const nome of CATEGORIAS) {
    await db.categoriaDespesaPessoal.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }
  console.log(`OK: ${CATEGORIAS.length} categorias de despesa de pessoal garantidas.`);

  const tipo = await db.tipoCompra.upsert({
    where: { nome: "Despesa de Pessoal" },
    update: { despesaPessoal: true },
    create: { nome: "Despesa de Pessoal", despesaPessoal: true },
  });
  console.log(`OK: tipo de compra "${tipo.nome}" marcado como despesa de pessoal.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
