import { describe, expect, it } from "vitest";
import { StatusSolicitacao } from "@prisma/client";
import {
  calcularDuracoesPorCategoria,
  calcularFilaParada,
  construirRelatorioSla,
  donoAtual,
  type EventoHistoricoSla,
  type SolicitacaoParaFila,
  type SolicitacaoParaSla,
} from "@/lib/sla";

// Timestamps em horas a partir de uma origem fixa, só pra deixar os testes
// legíveis (h(5) = 5 horas depois de h(0)) sem escrever ISO strings.
const ORIGEM = new Date("2026-01-01T00:00:00.000Z").getTime();
function h(horas: number): Date {
  return new Date(ORIGEM + horas * 3_600_000);
}
function evento(nome: string, horas: number): EventoHistoricoSla {
  return { evento: nome, criadoEm: h(horas) };
}

describe("calcularDuracoesPorCategoria", () => {
  it("soma o intervalo entre cada evento e o seguinte, na categoria do evento inicial", () => {
    const historico = [
      evento("rascunho_criado", 0),
      evento("enviado", 1),
      evento("aprovado", 5),
      evento("comprador_designado", 5.1),
      evento("compra_confirmada", 10),
      evento("enviado_para_pagamento", 15),
      evento("aguardando_comprovante", 20),
      evento("pago", 24),
    ];

    const duracoes = calcularDuracoesPorCategoria(historico);

    expect(duracoes.aprovacaoGestor).toBeCloseTo(4 * 3_600_000); // enviado (h1) -> aprovado (h5)
    expect(duracoes.compradorExecutarCompra).toBeCloseTo(4.9 * 3_600_000); // comprador_designado -> compra_confirmada
    expect(duracoes.compradorEnviarPagamento).toBeCloseTo(5 * 3_600_000); // compra_confirmada -> enviado_para_pagamento
    expect(duracoes.financeiroRegistrarPagamento).toBeCloseTo(5 * 3_600_000); // enviado_para_pagamento -> aguardando_comprovante
    expect(duracoes.financeiroAnexarComprovante).toBeCloseTo(4 * 3_600_000); // aguardando_comprovante -> pago
    // rascunho_criado e aprovado não são atribuídos a ninguém.
    expect(duracoes.designacaoManual).toBeUndefined();
  });

  it("soma múltiplas ocorrências da mesma categoria (ex.: duas recusas de pagamento)", () => {
    const historico = [
      evento("enviado_para_pagamento", 0),
      evento("pagamento_recusado", 2), // 2h de "financeiroRegistrarPagamento"
      evento("reenviado_para_pagamento", 3), // 1h de correção
      evento("pagamento_recusado", 6), // 3h de "financeiroRegistrarPagamento" de novo
      evento("reenviado_para_pagamento", 6.5), // 0.5h de correção
      evento("pago", 10), // 3.5h de "financeiroRegistrarPagamento"
    ];

    const duracoes = calcularDuracoesPorCategoria(historico);

    expect(duracoes.financeiroRegistrarPagamento).toBeCloseTo((2 + 3 + 3.5) * 3_600_000);
    expect(duracoes.correcaoPagamentoRecusado).toBeCloseTo((1 + 0.5) * 3_600_000);
  });

  it("não gera intervalo para o último evento do histórico (solicitação ainda em aberto)", () => {
    const historico = [evento("enviado", 0), evento("aprovado", 1)];
    const duracoes = calcularDuracoesPorCategoria(historico);
    // "aprovado" é o último evento — não deveria contribuir com nenhuma
    // categoria (não há um "próximo evento" que feche o intervalo).
    expect(Object.keys(duracoes)).toEqual(["aprovacaoGestor"]);
  });

  it("ignora eventos desconhecidos sem lançar erro", () => {
    const historico = [evento("evento_inexistente_no_mapa", 0), evento("pago", 1)];
    expect(() => calcularDuracoesPorCategoria(historico)).not.toThrow();
    expect(calcularDuracoesPorCategoria(historico)).toEqual({});
  });
});

function solicitacaoSla(
  tipoCompra: string,
  historico: EventoHistoricoSla[]
): SolicitacaoParaSla {
  return { id: crypto.randomUUID(), tipoCompra: { nome: tipoCompra }, historico };
}

describe("construirRelatorioSla", () => {
  it("calcula aprovadoAPago como o intervalo entre o primeiro 'aprovado' e 'pago'", () => {
    const s = solicitacaoSla("Padrão", [
      evento("enviado", 0),
      evento("aprovado", 2),
      evento("comprador_designado", 2.1),
      evento("compra_confirmada", 10),
      evento("enviado_para_pagamento", 12),
      evento("pago", 20),
    ]);

    const relatorio = construirRelatorioSla([s]);

    expect(relatorio.aprovadoAPago.contagem).toBe(1);
    expect(relatorio.aprovadoAPago.mediaHoras).toBeCloseTo(18); // 20h - 2h
  });

  it("isola o SLA do Financeiro do SLA do comprador", () => {
    const s = solicitacaoSla("Padrão", [
      evento("aprovado", 0),
      evento("comprador_designado", 0), // comprador demora 8h pra confirmar a compra
      evento("compra_confirmada", 8),
      evento("enviado_para_pagamento", 8), // financeiro demora 1h pra registrar
      evento("aguardando_comprovante", 9), // financeiro demora 2h pra anexar comprovante
      evento("pago", 11),
    ]);

    const relatorio = construirRelatorioSla([s]);

    expect(relatorio.financeiro.mediaHoras).toBeCloseTo(3); // 1h + 2h, nunca as 8h do comprador
    expect(relatorio.comprador.mediaHoras).toBeCloseTo(8);
  });

  it("agrupa o SLA do Financeiro por tipo de compra, ordenado do maior pro menor", () => {
    const lenta = solicitacaoSla("Compra normal", [
      evento("enviado_para_pagamento", 0),
      evento("pago", 10), // 10h
    ]);
    const rapida = solicitacaoSla("Despesa de Pessoal", [
      evento("enviado_para_pagamento", 0),
      evento("pago", 1), // 1h
    ]);

    const relatorio = construirRelatorioSla([lenta, rapida]);

    expect(relatorio.porTipoCompra).toEqual([
      expect.objectContaining({ tipoCompra: "Compra normal" }),
      expect.objectContaining({ tipoCompra: "Despesa de Pessoal" }),
    ]);
  });

  it("agrupa a tendência mensal pela data do evento 'pago', não pela criação", () => {
    const jan = solicitacaoSla("Padrão", [
      evento("enviado_para_pagamento", 0),
      { evento: "pago", criadoEm: new Date("2026-01-15T00:00:00.000Z") },
    ]);
    const fev = solicitacaoSla("Padrão", [
      evento("enviado_para_pagamento", 0),
      { evento: "pago", criadoEm: new Date("2026-02-15T00:00:00.000Z") },
    ]);

    const relatorio = construirRelatorioSla([jan, fev]);

    expect(relatorio.porMes.map((m) => m.mes)).toEqual(["2026-01", "2026-02"]);
  });

  it("não conta uma solicitação sem nenhum tempo atribuível ao Financeiro nas estatísticas do Financeiro", () => {
    // Só passou por aprovação de gestor — nunca chegou perto do Financeiro
    // (cenário hipotético/defensivo; não deveria existir com status PAGO na
    // prática, mas a função não deve quebrar nem contar "0h" como uma
    // amostra real).
    const s = solicitacaoSla("Padrão", [evento("enviado", 0), evento("aprovado", 1)]);
    const relatorio = construirRelatorioSla([s]);
    expect(relatorio.financeiro.contagem).toBe(0);
  });
});

describe("donoAtual", () => {
  it("mapeia cada status para quem está com a bola agora", () => {
    expect(donoAtual(StatusSolicitacao.ENVIADO, null)).toBe("gestor");
    expect(donoAtual(StatusSolicitacao.AGUARDANDO_NIVEL2, null)).toBe("gestor");
    expect(donoAtual(StatusSolicitacao.COMPRA_CONFIRMADA, "comp-1")).toBe("comprador");
    expect(donoAtual(StatusSolicitacao.AGUARDANDO_PAGAMENTO, "comp-1")).toBe("financeiro");
    expect(donoAtual(StatusSolicitacao.AGUARDANDO_COMPROVANTE, "comp-1")).toBe("financeiro");
    expect(donoAtual(StatusSolicitacao.AGUARDANDO_CONFIRMACAO_BAIXA, "comp-1")).toBe("financeiro");
    expect(donoAtual(StatusSolicitacao.AGUARDANDO_PRESTACAO_CONTAS, "comp-1")).toBe("comprador");
    expect(donoAtual(StatusSolicitacao.PAGAMENTO_RECUSADO, "comp-1")).toBe("comprador");
  });

  it("em APROVADO, depende de já haver comprador designado", () => {
    expect(donoAtual(StatusSolicitacao.APROVADO, null)).toBe("financeiro");
    expect(donoAtual(StatusSolicitacao.APROVADO, "comp-1")).toBe("comprador");
  });

  it("não atribui dono a RASCUNHO, REJEITADO ou PAGO", () => {
    expect(donoAtual(StatusSolicitacao.RASCUNHO, null)).toBeNull();
    expect(donoAtual(StatusSolicitacao.REJEITADO, null)).toBeNull();
    expect(donoAtual(StatusSolicitacao.PAGO, null)).toBeNull();
  });
});

function solicitacaoFila(
  status: StatusSolicitacao,
  compradorId: string | null,
  historico: EventoHistoricoSla[]
): SolicitacaoParaFila {
  return { id: crypto.randomUUID(), descricao: "Teste", status, compradorId, historico };
}

describe("calcularFilaParada", () => {
  it("calcula horas paradas desde o último evento e ordena da mais parada pra mais recente", () => {
    const agora = h(100);
    const antiga = solicitacaoFila(StatusSolicitacao.AGUARDANDO_PAGAMENTO, "c1", [
      evento("enviado_para_pagamento", 10), // parada há 90h
    ]);
    const recente = solicitacaoFila(StatusSolicitacao.AGUARDANDO_PAGAMENTO, "c1", [
      evento("enviado_para_pagamento", 95), // parada há 5h
    ]);

    const fila = calcularFilaParada([recente, antiga], agora);

    expect(fila.map((i) => i.id)).toEqual([antiga.id, recente.id]);
    expect(fila[0].horasParada).toBeCloseTo(90);
    expect(fila[1].horasParada).toBeCloseTo(5);
  });

  it("não inclui RASCUNHO, REJEITADO nem PAGO na fila", () => {
    const agora = h(10);
    const itens = [
      solicitacaoFila(StatusSolicitacao.RASCUNHO, null, [evento("rascunho_criado", 0)]),
      solicitacaoFila(StatusSolicitacao.REJEITADO, null, [evento("rejeitado", 0)]),
      solicitacaoFila(StatusSolicitacao.PAGO, "c1", [evento("pago", 0)]),
    ];

    expect(calcularFilaParada(itens, agora)).toEqual([]);
  });

  it("ignora uma solicitação sem histórico (defensivo — não deveria acontecer na prática)", () => {
    const item = solicitacaoFila(StatusSolicitacao.AGUARDANDO_PAGAMENTO, "c1", []);
    expect(calcularFilaParada([item], h(10))).toEqual([]);
  });
});
