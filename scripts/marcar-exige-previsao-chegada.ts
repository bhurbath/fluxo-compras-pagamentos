// One-off, idempotente: marca os tipos de compra que já existem no
// sistema (Mercado Livre, cartão de crédito) com exigePrevisaoChegada.
// Roda de novo sem problema.
//
// Uso: npx tsx scripts/marcar-exige-previsao-chegada.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const NOMES = ["Compras no Mercado Livre", "Compras no cartão de crédito"];

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  for (const nome of NOMES) {
    const { count } = await db.tipoCompra.updateMany({
      where: { nome },
      data: { exigePrevisaoChegada: true },
    });
    if (count === 0) {
      console.warn(`Aviso: nenhum tipo de compra chamado "${nome}" encontrado — pulei.`);
      continue;
    }
    console.log(`OK: "${nome}" marcado com exigePrevisaoChegada.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
