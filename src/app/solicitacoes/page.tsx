import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { listarMinhasSolicitacoes } from "@/lib/workflow";
import { TabelaSolicitacoes } from "../_components/tabela-solicitacoes";

export default async function MinhasSolicitacoesPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const solicitacoes = await listarMinhasSolicitacoes(usuario.id);

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-xl font-semibold">Minhas solicitações</h1>

        <Link
          href="/solicitacoes/nova"
          className="w-fit rounded bg-blue-600 px-4 py-2 text-white"
        >
          Nova solicitação de compra
        </Link>

        <TabelaSolicitacoes
          itens={solicitacoes}
          vazioMensagem="Você ainda não criou nenhuma solicitação."
          mostrarSolicitante={false}
          linkTexto="Ver"
        />

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
