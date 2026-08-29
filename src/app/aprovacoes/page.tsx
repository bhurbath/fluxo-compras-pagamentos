import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import {
  listarPendentesComprador,
  listarPendentesDesignacaoComprador,
  listarPendentesNivel1,
  listarPendentesNivel2,
  listarPendentesPagamento,
} from "@/lib/workflow";
import { TabelaSolicitacoes } from "../_components/tabela-solicitacoes";

export default async function AprovacoesPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const [pendentesNivel1, pendentesNivel2, pendentesComprador] = await Promise.all([
    listarPendentesNivel1(usuario.id),
    listarPendentesNivel2(usuario.id),
    listarPendentesComprador(usuario.id),
  ]);
  const [pendentesDesignacaoComprador, pendentesPagamento] = usuario.flagFinanceiro
    ? await Promise.all([listarPendentesDesignacaoComprador(), listarPendentesPagamento()])
    : [null, null];

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "46rem" }}>
        <h1 className="page-title">Pendentes de mim</h1>

        <TabelaSolicitacoes
          titulo="Nível 1 (responsável do departamento)"
          itens={pendentesNivel1}
          vazioMensagem="Nenhuma solicitação aguardando sua aprovação de nível 1."
        />

        <TabelaSolicitacoes
          titulo="Nível 2 (diretor)"
          itens={pendentesNivel2}
          vazioMensagem="Nenhuma solicitação aguardando sua aprovação de nível 2."
        />

        <TabelaSolicitacoes
          titulo="Compras (comprador designado)"
          itens={pendentesComprador}
          vazioMensagem="Nenhuma solicitação aguardando sua ação como comprador."
        />

        {pendentesDesignacaoComprador && (
          <TabelaSolicitacoes
            titulo="Designação de comprador (Financeiro)"
            itens={pendentesDesignacaoComprador}
            vazioMensagem="Nenhuma solicitação aguardando designação de comprador."
          />
        )}

        {pendentesPagamento && (
          <TabelaSolicitacoes
            titulo="Aprovação de pagamento (Financeiro)"
            itens={pendentesPagamento}
            vazioMensagem="Nenhuma solicitação aguardando aprovação de pagamento."
          />
        )}

        <Link href="/" className="link">
          Voltar
        </Link>
      </div>
    </main>
  );
}
