// Bootstrapping tool, not a user-facing feature: there is no UI to grant the
// Financeiro flag (nothing could grant the first one), so this exists to set
// it directly. The user must already exist (i.e. have logged in once).
//
// Usage: npx tsx scripts/set-financeiro.ts alguem@empresa.com.br
import { createPrismaClient } from "../src/lib/db";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const email = process.argv[2];
if (!email) {
  console.error("Uso: npx tsx scripts/set-financeiro.ts <email>");
  process.exit(1);
}

const db = createPrismaClient(process.env.DATABASE_URL, "DATABASE_URL");

db.usuario
  .update({ where: { email }, data: { flagFinanceiro: true } })
  .then((usuario) => {
    console.log(`OK: ${usuario.nome} <${usuario.email}> agora é Financeiro.`);
  })
  .catch(() => {
    console.error(
      `Não encontrei um usuário com o e-mail ${email}. Ele precisa ter feito login pelo menos uma vez.`
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
