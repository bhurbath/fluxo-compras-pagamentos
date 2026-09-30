import type { obterSolicitacao } from "@/lib/workflow";

// Compartilhado por PainelEdicaoReenvio (REJEITADO) e PainelEdicaoRascunho
// (RASCUNHO) — os dois reabrem o mesmo formulário (CamposSolicitacao) a
// partir de uma solicitação já salva, então mapeiam os mesmos campos do
// mesmo jeito. Único lugar que faz esse mapeamento evita as duas telas
// saírem de sincronia quando um campo novo for adicionado.
export function construirDefaultValuesSolicitacao(
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>
) {
  return {
    descricao: solicitacao.descricao,
    valor: solicitacao.valor.toString(),
    tipoCompraId: solicitacao.tipoCompraId,
    fornecedor: solicitacao.fornecedor,
    formaPagamento: solicitacao.formaPagamento,
    centroCustoId: solicitacao.centroCustoId,
    centroResultadoId: solicitacao.centroResultadoId,
    contaContabilId: solicitacao.contaContabilId,
    empresaId: solicitacao.empresaId,
    linkCompra: solicitacao.linkCompra,
    informacoesComplementares: solicitacao.informacoesComplementares,
    temCotacao: Boolean(solicitacao.cotacaoUrl),
    semCompra: solicitacao.semCompra,
    metodoPagamento: solicitacao.metodoPagamento,
    dadosPagamento: solicitacao.dadosPagamento,
    fornecedorDocumento: solicitacao.fornecedorDocumento,
    temAnexo: solicitacao.notaFiscalUrls.length > 0,
    categoriaDespesaPessoalId: solicitacao.categoriaDespesaPessoalId,
    numeroPedido: solicitacao.numeroPedido,
    dataVencimento: solicitacao.dataVencimento?.toISOString().slice(0, 10) ?? null,
    valorReembolsar: solicitacao.valorReembolsar?.toString() ?? null,
    valorCartaoOnfly: solicitacao.valorCartaoOnfly?.toString() ?? null,
    dataRdv: solicitacao.dataRdv?.toISOString().slice(0, 10) ?? null,
    numeroRdv: solicitacao.numeroRdv,
    nomeColaboradorRdv: solicitacao.nomeColaboradorRdv,
    possuiAdiantamento: solicitacao.possuiAdiantamento,
    dataDespesa: solicitacao.dataDespesa?.toISOString().slice(0, 10) ?? null,
  };
}
