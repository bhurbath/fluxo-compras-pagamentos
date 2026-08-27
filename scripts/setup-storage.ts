// Bootstrapping tool, not a user-facing feature: creates the private Storage
// bucket anexos-solicitacoes uses, if it doesn't already exist. Safe to
// re-run (no-ops when the bucket is already there).
//
// Usage: npx tsx scripts/setup-storage.ts
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment.
}

const BUCKET = "anexos-solicitacoes";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function main() {
  const { data: existentes, error: erroLista } = await supabase.storage.listBuckets();
  if (erroLista) {
    console.error(`Falha ao listar buckets: ${erroLista.message}`);
    process.exit(1);
  }

  if (existentes.some((b) => b.name === BUCKET)) {
    console.log(`OK: bucket "${BUCKET}" já existe.`);
    return;
  }

  const { error: erroCriacao } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: "10MB",
  });
  if (erroCriacao) {
    console.error(`Falha ao criar bucket: ${erroCriacao.message}`);
    process.exit(1);
  }

  console.log(`OK: bucket "${BUCKET}" criado (privado).`);
}

main();
