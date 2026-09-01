// One-off, idempotente: marca "Compras no Mercado Livre" para dispensar
// fornecedor/forma de pagamento (o link da compra já traz essa informação)
// e fixar a empresa em SMELL. Roda de novo sem problema.
//
// Uso: npx tsx scripts/marcar-mercado-livre-simplificado.ts
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const NOME_TIPO = "Compras no Mercado Livre";
const NOME_EMPRESA = "SMELL";

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

async function main() {
  const empresa = await db.empresa.findUnique({ where: { nome: NOME_EMPRESA } });
  if (!empresa) {
    throw new Error(`Nenhuma empresa chamada "${NOME_EMPRESA}" encontrada.`);
  }

  const { count } = await db.tipoCompra.updateMany({
    where: { nome: NOME_TIPO },
    data: { dispensaFornecedorForma: true, empresaFixaId: empresa.id },
  });
  if (count === 0) {
    console.warn(`Aviso: nenhum tipo de compra chamado "${NOME_TIPO}" encontrado — pulei.`);
    return;
  }
  console.log(`OK: "${NOME_TIPO}" marcado com dispensaFornecedorForma e empresaFixa = ${NOME_EMPRESA}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
