// Applies the already-generated migrations to the "test" schema (same
// Supabase project as dev, just a different schema — see .env.example).
// `prisma migrate dev` is for the dev schema only; this uses `migrate
// deploy` against DIRECT_URL_TEST so CI/fresh clones can reproduce the test
// database without a human running an ad-hoc command.
import { execSync } from "node:child_process";

try {
  process.loadEnvFile();
} catch {
  // No .env file — fine if the vars are already in the environment (CI).
}

if (!process.env.DIRECT_URL_TEST) {
  console.error("DIRECT_URL_TEST não está definido (ver .env.example).");
  process.exit(1);
}

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DIRECT_URL: process.env.DIRECT_URL_TEST },
});
