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
    temCotacao: solicitacao.cotacaoUrls.length > 0,
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

// "Copiar solicitação" — abre o formulário de uma solicitação NOVA a partir
// dos dados de outra (ver /solicitacoes/nova?copiarDe=). Fica de fora o que
// não faz sentido repetir: anexos e cotações (são documentos de cada
// pagamento — o formulário volta a pedi-los) e as datas e números próprios
// daquela ocorrência (vencimento, data da RDV/da despesa, nº do pedido, nº da
// RDV), que numa cópia seriam do mês passado. Os demais campos, inclusive o
// valor, vêm preenchidos para a pessoa só ajustar o que mudou.
export function construirDefaultValuesCopia(
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>
) {
  return {
    ...construirDefaultValuesSolicitacao(solicitacao),
    temCotacao: false,
    temAnexo: false,
    dataVencimento: null,
    dataRdv: null,
    dataDespesa: null,
    numeroPedido: null,
    numeroRdv: null,
  };
}
