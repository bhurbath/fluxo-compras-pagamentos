import Link from "next/link";

export function AcessoRestrito() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Acesso restrito ao Financeiro.</p>
      <Link href="/" className="underline">
        Voltar
      </Link>
    </main>
  );
}
