import Link from "next/link";

export function AcessoRestrito({
  mensagem = "Acesso restrito ao Financeiro.",
}: {
  mensagem?: string;
}) {
  return (
    <main className="shell" style={{ justifyContent: "center" }}>
      <div className="panel flex flex-col items-center gap-4" style={{ maxWidth: "24rem" }}>
        <p>{mensagem}</p>
        <Link href="/" className="link">
          Voltar
        </Link>
      </div>
    </main>
  );
}
