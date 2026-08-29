import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusSolicitacao } from "@prisma/client";
import {
  aprovarNivel1Action,
  aprovarNivel2Action,
  designarCompradorManualmenteAction,
  registrarPagamentoAction,
  recusarPagamentoAction,
  rejeitarAction,
} from "@/app/aprovacoes/actions";
import {
  confirmarCompraAction,
  editarEReenviarAction,
  enviarParaPagamentoAction,
  reenviarParaPagamentoAction,
} from "../actions";
import { DetalhesSolicitacao } from "../_components/detalhes-solicitacao";
import { PainelAprovacao } from "../_components/painel-aprovacao";
import { PainelEdicaoReenvio } from "../_components/painel-edicao-reenvio";
import { PainelDesignacaoComprador } from "../_components/painel-designacao-comprador";
import { PainelConfirmarCompra } from "../_components/painel-confirmar-compra";
import { PainelEnviarPagamento } from "../_components/painel-enviar-pagamento";
import { PainelRegistrarPagamento } from "../_components/painel-registrar-pagamento";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { obterSolicitacao } from "@/lib/workflow";
import { listarListasSolicitacao } from "@/lib/solicitacao-listas";
import { listarFuncionarios } from "@/lib/departamentos";
import { gerarUrlAssinada } from "@/lib/storage";

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
  // responsável (nível 1), diretor (nível 2), the designated comprador, or
  // Financeiro can view it too, but only once it has actually been
  // submitted — not a draft the solicitante hasn't sent for approval yet.
  const podeVer =
    solicitacao !== null &&
    (solicitacao.solicitanteId === usuario.id ||
      ((solicitacao.departamento.responsavelId === usuario.id ||
        solicitacao.departamento.diretorId === usuario.id ||
        solicitacao.compradorId === usuario.id ||
        usuario.flagFinanceiro) &&
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

  const podeDesignarComprador =
    solicitacao.status === StatusSolicitacao.APROVADO &&
    solicitacao.compradorId === null &&
    usuario.flagFinanceiro;

  const podeConfirmarCompra =
    solicitacao.status === StatusSolicitacao.APROVADO &&
    solicitacao.compradorId === usuario.id;

  const podeEnviarParaPagamento =
    solicitacao.status === StatusSolicitacao.COMPRA_CONFIRMADA &&
    solicitacao.compradorId === usuario.id;

  const podeReenviarParaPagamento =
    solicitacao.status === StatusSolicitacao.PAGAMENTO_RECUSADO &&
    solicitacao.compradorId === usuario.id;

  const podeAprovarPagamento =
    solicitacao.status === StatusSolicitacao.AGUARDANDO_PAGAMENTO && usuario.flagFinanceiro;

  // Só busca as listas dos dropdowns quando a seção de edição vai
  // efetivamente aparecer — evita 6 consultas desnecessárias em toda
  // visualização de uma solicitação que não está rejeitada.
  const listasParaEdicao = podeEditarEReenviar ? await listarListasSolicitacao() : null;

  const funcionarios = podeDesignarComprador ? await listarFuncionarios() : null;

  // Independentes entre si (URLs assinadas de dois anexos diferentes) — cada
  // uma é uma chamada de rede real ao Storage, então rodam em paralelo em
  // vez de uma esperar a outra.
  const [notaFiscalUrlAssinada, comprovantePagamentoUrlAssinada] = await Promise.all([
    solicitacao.notaFiscalUrl ? gerarUrlAssinada(solicitacao.notaFiscalUrl) : null,
    solicitacao.comprovantePagamentoUrl
      ? gerarUrlAssinada(solicitacao.comprovantePagamentoUrl)
      : null,
  ]);

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "36rem" }}>
        <div className="panel flex flex-col gap-4">
          <h1 className="page-title">Solicitação de compra</h1>

          <ErroMensagem erro={erro} />

          <DetalhesSolicitacao
            solicitacao={solicitacao}
            notaFiscalUrlAssinada={notaFiscalUrlAssinada}
            comprovantePagamentoUrlAssinada={comprovantePagamentoUrlAssinada}
          />
        </div>

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

        {funcionarios && (
          <PainelDesignacaoComprador
            solicitacaoId={solicitacao.id}
            funcionarios={funcionarios}
            action={designarCompradorManualmenteAction}
          />
        )}

        {podeConfirmarCompra && (
          <PainelConfirmarCompra
            solicitacaoId={solicitacao.id}
            action={confirmarCompraAction}
          />
        )}

        {podeEnviarParaPagamento && (
          <PainelEnviarPagamento
            solicitacaoId={solicitacao.id}
            action={enviarParaPagamentoAction}
          />
        )}

        {podeReenviarParaPagamento && (
          <PainelEnviarPagamento
            solicitacaoId={solicitacao.id}
            action={reenviarParaPagamentoAction}
            titulo="Corrigir e reenviar para pagamento"
          />
        )}

        {podeAprovarPagamento && (
          <PainelRegistrarPagamento
            solicitacaoId={solicitacao.id}
            registrarAction={registrarPagamentoAction}
            recusarAction={recusarPagamentoAction}
          />
        )}

        <Link href="/" className="link">
          Voltar
        </Link>
      </div>
    </main>
  );
}
