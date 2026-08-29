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
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "46rem" }}>
        <div className="flex items-center justify-between">
          <h1 className="page-title">Minhas solicitações</h1>
          <Link href="/solicitacoes/nova" className="btn-primary">
            Nova solicitação de compra
          </Link>
        </div>

        <TabelaSolicitacoes
          itens={solicitacoes}
          vazioMensagem="Você ainda não criou nenhuma solicitação."
          mostrarSolicitante={false}
          linkTexto="Ver"
        />

        <Link href="/" className="link">
          Voltar
        </Link>
      </div>
    </main>
  );
}
