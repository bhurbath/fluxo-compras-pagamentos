import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusSolicitacao } from "@prisma/client";
import { aprovarNivel1Action, aprovarNivel2Action, rejeitarAction } from "@/app/aprovacoes/actions";
import { editarEReenviarAction } from "../actions";
import { DetalhesSolicitacao } from "../_components/detalhes-solicitacao";
import { PainelAprovacao } from "../_components/painel-aprovacao";
import { PainelEdicaoReenvio } from "../_components/painel-edicao-reenvio";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { obterSolicitacao } from "@/lib/workflow";
import { listarListasSolicitacao } from "@/lib/solicitacao-listas";

export default async function SolicitacaoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const { id } = await params;
  const { erro } = await searchParams;
  const solicitacao = await obterSolicitacao(id);

  // The solicitante can always view their own request. The department's
  // responsável (nível 1) or diretor (nível 2) can view it too, but only
  // once it has actually been submitted — not a draft the solicitante
  // hasn't sent for approval yet. Later tickets (comprador, Financeiro)
  // will broaden this further as those roles are built.
  const podeVer =
    solicitacao !== null &&
    (solicitacao.solicitanteId === usuario.id ||
      ((solicitacao.departamento.responsavelId === usuario.id ||
        solicitacao.departamento.diretorId === usuario.id) &&
        solicitacao.status !== StatusSolicitacao.RASCUNHO));
  if (!solicitacao || !podeVer) {
    notFound();
  }

  const podeAprovarNivel1 =
    solicitacao.status === StatusSolicitacao.ENVIADO &&
    solicitacao.departamento.responsavelId === usuario.id;

  const podeAprovarNivel2 =
    solicitacao.status === StatusSolicitacao.AGUARDANDO_NIVEL2 &&
    solicitacao.departamento.diretorId === usuario.id;

  const podeEditarEReenviar =
    solicitacao.status === StatusSolicitacao.REJEITADO &&
    solicitacao.solicitanteId === usuario.id;

  // Só busca as listas dos dropdowns quando a seção de edição vai
  // efetivamente aparecer — evita 6 consultas desnecessárias em toda
  // visualização de uma solicitação que não está rejeitada.
  const listasParaEdicao = podeEditarEReenviar ? await listarListasSolicitacao() : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">Solicitação de compra</h1>

        <ErroMensagem erro={erro} />

        <DetalhesSolicitacao solicitacao={solicitacao} />

        {podeAprovarNivel1 && (
          <PainelAprovacao
            titulo="Aprovação de nível 1"
            solicitacaoId={solicitacao.id}
            aprovarAction={aprovarNivel1Action}
            rejeitarAction={rejeitarAction}
          />
        )}

        {podeAprovarNivel2 && (
          <PainelAprovacao
            titulo="Aprovação de nível 2"
            solicitacaoId={solicitacao.id}
            aprovarAction={aprovarNivel2Action}
            rejeitarAction={rejeitarAction}
          />
        )}

        {listasParaEdicao && (
          <PainelEdicaoReenvio
            solicitacao={solicitacao}
            listas={listasParaEdicao}
            action={editarEReenviarAction}
          />
        )}

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
