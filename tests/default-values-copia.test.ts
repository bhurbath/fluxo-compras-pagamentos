import { describe, expect, it } from "vitest";
import {
  construirDefaultValuesCopia,
  construirDefaultValuesSolicitacao,
} from "@/app/solicitacoes/_components/default-values-solicitacao";

type Original = Parameters<typeof construirDefaultValuesSolicitacao>[0];

const original = {
  descricao: "Plano de saúde — outubro",
  valor: { toString: () => "1193.37" },
  tipoCompraId: "tipo-1",
  fornecedor: null,
  formaPagamento: null,
  centroCustoId: null,
  centroResultadoId: null,
  contaContabilId: null,
  empresaId: "empresa-1",
  linkCompra: null,
  informacoesComplementares: "Referente ao mês 10",
  cotacaoUrls: ["a/cotacao.pdf"],
  semCompra: true,
  metodoPagamento: "PIX",
  dadosPagamento: "Chave PIX: 123",
  fornecedorDocumento: "12.345.678/0001-99",
  notaFiscalUrls: ["a/nota.pdf"],
  categoriaDespesaPessoalId: "cat-1",
  numeroPedido: "25662",
  dataVencimento: new Date("2026-10-28T00:00:00.000Z"),
  valorReembolsar: { toString: () => "100" },
  valorCartaoOnfly: null,
  dataRdv: new Date("2026-10-01T00:00:00.000Z"),
  numeroRdv: "RDV-9",
  nomeColaboradorRdv: "Fulano",
  possuiAdiantamento: true,
  dataDespesa: new Date("2026-10-02T00:00:00.000Z"),
} as unknown as Original;

describe("construirDefaultValuesCopia", () => {
  it("mantém os dados que se repetem de um mês para o outro, inclusive o valor", () => {
    const copia = construirDefaultValuesCopia(original);

    expect(copia.descricao).toBe("Plano de saúde — outubro");
    expect(copia.valor).toBe("1193.37");
    expect(copia.tipoCompraId).toBe("tipo-1");
    expect(copia.empresaId).toBe("empresa-1");
    expect(copia.categoriaDespesaPessoalId).toBe("cat-1");
    expect(copia.dadosPagamento).toBe("Chave PIX: 123");
    expect(copia.metodoPagamento).toBe("PIX");
    expect(copia.semCompra).toBe(true);
    expect(copia.nomeColaboradorRdv).toBe("Fulano");
    expect(copia.valorReembolsar).toBe("100");
  });

  it("deixa de fora anexos, cotações, datas e números próprios daquela ocorrência", () => {
    const copia = construirDefaultValuesCopia(original);

    expect(copia.temAnexo).toBe(false);
    expect(copia.temCotacao).toBe(false);
    expect(copia.dataVencimento).toBeNull();
    expect(copia.dataRdv).toBeNull();
    expect(copia.dataDespesa).toBeNull();
    expect(copia.numeroPedido).toBeNull();
    expect(copia.numeroRdv).toBeNull();
  });

  it("não altera o mapeamento usado na edição, que continua trazendo anexos e datas", () => {
    const edicao = construirDefaultValuesSolicitacao(original);

    expect(edicao.temAnexo).toBe(true);
    expect(edicao.temCotacao).toBe(true);
    expect(edicao.dataVencimento).toBe("2026-10-28");
    expect(edicao.numeroPedido).toBe("25662");
  });
});
