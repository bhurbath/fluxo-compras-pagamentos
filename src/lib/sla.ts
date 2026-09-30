import { StatusSolicitacao } from "@prisma/client";

// Cálculo de SLA por trecho do fluxo — nenhuma consulta ao banco aqui de
// propósito, só a lógica de "quanto tempo cada evento do histórico ficou
// esperando uma ação de quem" (ver categorizarEvento, abaixo), pra poder
// testar isoladamente sem precisar de fixtures de banco. Quem chama (ver
// src/app/relatorios/sla/page.tsx) já traz o histórico de
// listarSolicitacoesParaExportar, ordenado por criadoEm ascendente.

// Cada evento de histórico marca a ENTRADA num estado de espera — a
// categoria diz de quem é a bola até o próximo evento. null significa "não
// atribuível a ninguém" (ex.: rascunho_criado não tem espera antes dele;
// aprovado é seguido, na mesma chamada, pela designação automática ou pelo
// envio direto ao Financeiro — a janela real é de milissegundos, então
// contá-la a alguém só acrescentaria ruído).
export type CategoriaSla =
  | "aprovacaoGestor"
  | "designacaoManual"
  | "compradorExecutarCompra"
  | "compradorEnviarPagamento"
  | "financeiroRegistrarPagamento"
  | "financeiroAnexarComprovante"
  | "compradorPrestarContas"
  | "financeiroConfirmarBaixa"
  | "correcaoRejeicao"
  | "correcaoPagamentoRecusado";

const EVENTO_PARA_CATEGORIA: Record<string, CategoriaSla | null> = {
  rascunho_criado: null,
  enviado: "aprovacaoGestor",
  reenviado: "aprovacaoGestor",
  aguardando_nivel2: "aprovacaoGestor",
  editado_apos_rejeicao: null,
  aprovado: null,
  rejeitado: "correcaoRejeicao",
  comprador_designado: "compradorExecutarCompra",
  aguardando_designacao_manual: "designacaoManual",
  compra_confirmada: "compradorEnviarPagamento",
  enviado_para_pagamento: "financeiroRegistrarPagamento",
  reenviado_para_pagamento: "financeiroRegistrarPagamento",
  pagamento_recusado: "correcaoPagamentoRecusado",
  aguardando_comprovante: "financeiroAnexarComprovante",
  comprovante_anexado: "compradorPrestarContas",
  prestacao_contas_adiantamento_enviada: "financeiroConfirmarBaixa",
  pago: null,
};

export const CATEGORIA_LEGIVEL: Record<CategoriaSla, string> = {
  aprovacaoGestor: "Aprovação (responsável/diretor)",
  designacaoManual: "Designação manual de comprador (Financeiro)",
  compradorExecutarCompra: "Comprador: executar a compra",
  compradorEnviarPagamento: "Comprador: enviar para pagamento",
  financeiroRegistrarPagamento: "Financeiro: registrar pagamento",
  financeiroAnexarComprovante: "Financeiro: anexar comprovante",
  compradorPrestarContas: "Comprador: prestar contas do adiantamento",
  financeiroConfirmarBaixa: "Financeiro: confirmar baixa do adiantamento",
  correcaoRejeicao: "Correção após rejeição (solicitante)",
  correcaoPagamentoRecusado: "Correção após pagamento recusado (comprador/solicitante)",
};

// As três categorias que compõem "SLA do Financeiro" — as únicas etapas em
// que a próxima ação é literalmente de alguém do Financeiro. Designação
// manual fica de fora do número principal (é uma tarefa administrativa
// pontual, não uma etapa de pagamento em si), mas é reportada à parte.
const CATEGORIAS_FINANCEIRO: CategoriaSla[] = [
  "financeiroRegistrarPagamento",
  "financeiroAnexarComprovante",
  "financeiroConfirmarBaixa",
];
const CATEGORIAS_COMPRADOR: CategoriaSla[] = [
  "compradorExecutarCompra",
  "compradorEnviarPagamento",
  "compradorPrestarContas",
];
const CATEGORIAS_CORRECAO: CategoriaSla[] = ["correcaoRejeicao", "correcaoPagamentoRecusado"];

export type EventoHistoricoSla = { evento: string; criadoEm: Date };

// Soma, por categoria, quanto tempo (ms) cada trecho do histórico desta
// solicitação específica ficou esperando uma ação — uma mesma categoria
// pode aparecer mais de uma vez (ex.: duas recusas de pagamento seguidas)
// e os tempos se somam. O último evento do histórico nunca gera intervalo
// (não há "próximo evento" para fechá-lo) — para uma solicitação ainda em
// aberto, isso é o esperado: o tempo em curso entra no relatório de "fila
// parada agora" (ver calcularFilaParada), não neste cálculo histórico.
export function calcularDuracoesPorCategoria(
  historico: EventoHistoricoSla[]
): Partial<Record<CategoriaSla, number>> {
  const duracoes: Partial<Record<CategoriaSla, number>> = {};
  for (let i = 0; i < historico.length - 1; i++) {
    const categoria = EVENTO_PARA_CATEGORIA[historico[i].evento];
    if (!categoria) continue;
    const ms = historico[i + 1].criadoEm.getTime() - historico[i].criadoEm.getTime();
    if (ms < 0) continue; // defensivo — nunca deveria acontecer com criadoEm ascendente
    duracoes[categoria] = (duracoes[categoria] ?? 0) + ms;
  }
  return duracoes;
}

function somarCategorias(
  duracoes: Partial<Record<CategoriaSla, number>>,
  categorias: CategoriaSla[]
): number {
  return categorias.reduce((total, cat) => total + (duracoes[cat] ?? 0), 0);
}

export type EstatisticasSla = {
  contagem: number;
  mediaHoras: number;
  medianaHoras: number;
  p90Horas: number;
  maxHoras: number;
};

const SEM_DADOS: EstatisticasSla = {
  contagem: 0,
  mediaHoras: 0,
  medianaHoras: 0,
  p90Horas: 0,
  maxHoras: 0,
};

// Só considera solicitações que de fato passaram pela categoria (duração >
// 0 no mapa) — uma Despesa de Pessoal nunca passa por "aprovacaoGestor", por
// exemplo, e não faz sentido contá-la como "0 horas" nessa média, o que
// puxaria o número pra baixo artificialmente.
function estatisticas(valoresMs: number[]): EstatisticasSla {
  if (valoresMs.length === 0) return SEM_DADOS;
  const horas = valoresMs.map((ms) => ms / 3_600_000).sort((a, b) => a - b);
  const soma = horas.reduce((a, b) => a + b, 0);
  const percentil = (p: number) => {
    const idx = Math.min(horas.length - 1, Math.ceil((p / 100) * horas.length) - 1);
    return horas[Math.max(0, idx)];
  };
  return {
    contagem: horas.length,
    mediaHoras: soma / horas.length,
    medianaHoras: percentil(50),
    p90Horas: percentil(90),
    maxHoras: horas[horas.length - 1],
  };
}

export type SolicitacaoParaSla = {
  id: string;
  tipoCompra: { nome: string };
  historico: EventoHistoricoSla[];
};

export type RelatorioSla = {
  // "Aprovado → Pago" literal, como pedido — soma de tudo entre o primeiro
  // "aprovado"/equivalente e "pago", incluindo tempo de comprador e eventuais
  // correções. Ver financeiro, abaixo, para o recorte que isola só a parte
  // do Financeiro.
  aprovadoAPago: EstatisticasSla;
  financeiro: EstatisticasSla;
  comprador: EstatisticasSla;
  aprovacaoGestor: EstatisticasSla;
  correcoes: EstatisticasSla;
  porCategoria: Record<CategoriaSla, EstatisticasSla>;
  porTipoCompra: { tipoCompra: string; financeiro: EstatisticasSla }[];
  porMes: { mes: string; financeiroMediaHoras: number; contagem: number }[];
};

// solicitacoesFechadas: só as que já chegaram a PAGO — métricas históricas
// não fazem sentido para uma solicitação ainda em andamento (ver
// calcularFilaParada para o presente). dataDoFechamento devolve a data do
// evento "pago" de cada uma, usada só para agrupar por mês.
export function construirRelatorioSla(
  solicitacoes: SolicitacaoParaSla[]
): RelatorioSla {
  const porCategoriaMs: Record<CategoriaSla, number[]> = {
    aprovacaoGestor: [],
    designacaoManual: [],
    compradorExecutarCompra: [],
    compradorEnviarPagamento: [],
    financeiroRegistrarPagamento: [],
    financeiroAnexarComprovante: [],
    compradorPrestarContas: [],
    financeiroConfirmarBaixa: [],
    correcaoRejeicao: [],
    correcaoPagamentoRecusado: [],
  };
  const aprovadoAPagoMs: number[] = [];
  const financeiroMs: number[] = [];
  const compradorMs: number[] = [];
  const aprovacaoGestorMs: number[] = [];
  const correcoesMs: number[] = [];
  const porTipoMap = new Map<string, number[]>();
  const porMesMap = new Map<string, number[]>();

  for (const solicitacao of solicitacoes) {
    const duracoes = calcularDuracoesPorCategoria(solicitacao.historico);
    for (const [categoria, ms] of Object.entries(duracoes) as [CategoriaSla, number][]) {
      porCategoriaMs[categoria].push(ms);
    }

    const financeiroTotal = somarCategorias(duracoes, CATEGORIAS_FINANCEIRO);
    const compradorTotal = somarCategorias(duracoes, CATEGORIAS_COMPRADOR);
    const aprovacaoTotal = somarCategorias(duracoes, ["aprovacaoGestor"]);
    const correcaoTotal = somarCategorias(duracoes, CATEGORIAS_CORRECAO);

    const primeiroAprovado = solicitacao.historico.find(
      (h) => h.evento === "aprovado"
    );
    const eventoPago = solicitacao.historico.find((h) => h.evento === "pago");
    if (primeiroAprovado && eventoPago) {
      const ms = eventoPago.criadoEm.getTime() - primeiroAprovado.criadoEm.getTime();
      if (ms >= 0) {
        aprovadoAPagoMs.push(ms);
      }
    }

    if (financeiroTotal > 0) financeiroMs.push(financeiroTotal);
    if (compradorTotal > 0) compradorMs.push(compradorTotal);
    if (aprovacaoTotal > 0) aprovacaoGestorMs.push(aprovacaoTotal);
    if (correcaoTotal > 0) correcoesMs.push(correcaoTotal);

    if (financeiroTotal > 0) {
      const lista = porTipoMap.get(solicitacao.tipoCompra.nome) ?? [];
      lista.push(financeiroTotal);
      porTipoMap.set(solicitacao.tipoCompra.nome, lista);
    }

    if (eventoPago && financeiroTotal > 0) {
      const mes = eventoPago.criadoEm.toISOString().slice(0, 7); // "yyyy-mm"
      const lista = porMesMap.get(mes) ?? [];
      lista.push(financeiroTotal);
      porMesMap.set(mes, lista);
    }
  }

  const porCategoria = Object.fromEntries(
    (Object.keys(porCategoriaMs) as CategoriaSla[]).map((categoria) => [
      categoria,
      estatisticas(porCategoriaMs[categoria]),
    ])
  ) as Record<CategoriaSla, EstatisticasSla>;

  const porTipoCompra = Array.from(porTipoMap.entries())
    .map(([tipoCompra, valores]) => ({ tipoCompra, financeiro: estatisticas(valores) }))
    .sort((a, b) => b.financeiro.mediaHoras - a.financeiro.mediaHoras);

  const porMes = Array.from(porMesMap.entries())
    .map(([mes, valores]) => ({
      mes,
      financeiroMediaHoras: estatisticas(valores).mediaHoras,
      contagem: valores.length,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return {
    aprovadoAPago: estatisticas(aprovadoAPagoMs),
    financeiro: estatisticas(financeiroMs),
    comprador: estatisticas(compradorMs),
    aprovacaoGestor: estatisticas(aprovacaoGestorMs),
    correcoes: estatisticas(correcoesMs),
    porCategoria,
    porTipoCompra,
    porMes,
  };
}

// --- Fila parada agora ---------------------------------------------------

export type DonoFila = "gestor" | "comprador" | "financeiro" | "solicitante";

export const DONO_LEGIVEL: Record<DonoFila, string> = {
  gestor: "Responsável/diretor",
  comprador: "Comprador",
  financeiro: "Financeiro",
  solicitante: "Solicitante",
};

// De quem é a bola AGORA, dado o status atual — não usa o histórico, só o
// status (e se há comprador designado), já que é sobre o presente, não
// sobre o que já aconteceu. RASCUNHO fica de fora (ainda nem foi enviada,
// não é fila de ninguém) e PAGO/REJEITADO também (rejeitado só volta à
// fila quando o solicitante reenviar — até lá está com ele, mas isso já é
// coberto pela tela "Minhas solicitações" do próprio solicitante, não
// interessa a este relatório do Financeiro).
export function donoAtual(
  status: StatusSolicitacao,
  compradorId: string | null
): DonoFila | null {
  switch (status) {
    case StatusSolicitacao.ENVIADO:
    case StatusSolicitacao.AGUARDANDO_NIVEL2:
      return "gestor";
    case StatusSolicitacao.APROVADO:
      return compradorId ? "comprador" : "financeiro";
    case StatusSolicitacao.COMPRA_CONFIRMADA:
      return "comprador";
    case StatusSolicitacao.AGUARDANDO_PAGAMENTO:
    case StatusSolicitacao.AGUARDANDO_COMPROVANTE:
    case StatusSolicitacao.AGUARDANDO_CONFIRMACAO_BAIXA:
      return "financeiro";
    case StatusSolicitacao.AGUARDANDO_PRESTACAO_CONTAS:
    case StatusSolicitacao.PAGAMENTO_RECUSADO:
      return "comprador";
    default:
      return null;
  }
}

export type ItemFilaParada = {
  id: string;
  descricao: string;
  status: StatusSolicitacao;
  dono: DonoFila;
  desdeQuando: Date;
  horasParada: number;
};

export type SolicitacaoParaFila = {
  id: string;
  descricao: string;
  status: StatusSolicitacao;
  compradorId: string | null;
  historico: EventoHistoricoSla[];
};

// agora: injetado (não Date.now() direto) só pra deixar testável sem mockar
// relógio global.
export function calcularFilaParada(
  solicitacoes: SolicitacaoParaFila[],
  agora: Date = new Date()
): ItemFilaParada[] {
  const itens: ItemFilaParada[] = [];
  for (const solicitacao of solicitacoes) {
    const dono = donoAtual(solicitacao.status, solicitacao.compradorId);
    if (!dono) continue;
    const ultimoEvento = solicitacao.historico.at(-1);
    if (!ultimoEvento) continue;
    const horasParada = (agora.getTime() - ultimoEvento.criadoEm.getTime()) / 3_600_000;
    itens.push({
      id: solicitacao.id,
      descricao: solicitacao.descricao,
      status: solicitacao.status,
      dono,
      desdeQuando: ultimoEvento.criadoEm,
      horasParada,
    });
  }
  return itens.sort((a, b) => b.horasParada - a.horasParada);
}
