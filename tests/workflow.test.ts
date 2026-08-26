import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import { setEmailSender } from "@/lib/email";
import type { EmailMessage } from "@/lib/email";
import { criarSolicitacao, enviarSolicitacao } from "@/lib/workflow";

class FakeEmailSender {
  sent: EmailMessage[] = [];
  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}

async function criarUsuario(sufixo: string) {
  return testDb.usuario.create({
    data: {
      nome: `Usuário ${sufixo}`,
      email: `usuario-${sufixo}@empresa.com.br`,
      idEntra: `entra-${sufixo}`,
    },
  });
}

async function criarDepartamento(
  sufixo: string,
  overrides: { responsavelId?: string; diretorId?: string } = {}
) {
  const responsavel = overrides.responsavelId
    ? { id: overrides.responsavelId }
    : await criarUsuario(`resp-${sufixo}`);
  const diretor = overrides.diretorId
    ? { id: overrides.diretorId }
    : await criarUsuario(`dir-${sufixo}`);
  return testDb.departamento.create({
    data: {
      nome: `Departamento ${sufixo}`,
      responsavelId: responsavel.id,
      diretorId: diretor.id,
    },
  });
}

async function criarTipoCompra(nome: string) {
  return testDb.tipoCompra.create({ data: { nome } });
}

async function criarFaixa(valorMin: string, valorMax: string | null, exigeNivel2: boolean) {
  return testDb.faixaAlcada.create({ data: { valorMin, valorMax, exigeNivel2 } });
}

// The template fields (fornecedor, forma de pagamento, e os 4 cadastros)
// are required on every solicitação but irrelevant to what most tests are
// asserting — this creates one of each lookup and returns a ready-to-spread
// object so each test doesn't repeat the setup.
async function criarCamposObrigatorios(sufixo = "1") {
  const [centroCusto, centroResultado, contaContabil, empresa] = await Promise.all([
    testDb.centroCusto.create({ data: { nome: `Centro de custo ${sufixo}` } }),
    testDb.centroResultado.create({ data: { nome: `Centro de resultado ${sufixo}` } }),
    testDb.contaContabil.create({ data: { nome: `Conta contábil ${sufixo}` } }),
    testDb.empresa.create({ data: { nome: `Empresa ${sufixo}` } }),
  ]);
  return {
    fornecedor: "Fornecedor Teste",
    formaPagamento: "A_VISTA" as const,
    centroCustoId: centroCusto.id,
    centroResultadoId: centroResultado.id,
    contaContabilId: contaContabil.id,
    empresaId: empresa.id,
  };
}

describe("workflow: criarSolicitacao", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("cria uma solicitação em rascunho", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    expect(solicitacao.status).toBe("RASCUNHO");
    expect(solicitacao.descricao).toBe("Compra de teclados");
  });

  it("rejeita descrição vazia", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();

    await expect(
      criarSolicitacao({
        solicitanteId: solicitante.id,
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        descricao: "  ",
        valor: "500",
        ...campos,
      })
    ).rejects.toThrow();
  });

  it("rejeita valor zero ou negativo", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();

    await expect(
      criarSolicitacao({
        solicitanteId: solicitante.id,
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        descricao: "Algo",
        valor: "0",
        ...campos,
      })
    ).rejects.toThrow();

    await expect(
      criarSolicitacao({
        solicitanteId: solicitante.id,
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        descricao: "Algo",
        valor: "-10",
        ...campos,
      })
    ).rejects.toThrow();
  });

  it("grava um evento de histórico ao criar", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
    });
    expect(historico).toHaveLength(1);
    expect(historico[0].evento).toBe("rascunho_criado");
  });
});

describe("workflow: enviarSolicitacao", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("vai para ENVIADO quando o solicitante não é o responsável do departamento", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    const enviada = await enviarSolicitacao(rascunho.id);

    expect(enviada.status).toBe("ENVIADO");
  });

  it("pula o nível 1 e vai direto para APROVADO quando o solicitante é o responsável e a alçada não exige nível 2", async () => {
    const responsavel = await criarUsuario("resp");
    const departamento = await criarDepartamento("mkt", { responsavelId: responsavel.id });
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    const rascunho = await criarSolicitacao({
      solicitanteId: responsavel.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    const enviada = await enviarSolicitacao(rascunho.id);

    expect(enviada.status).toBe("APROVADO");
  });

  it("pula o nível 1 e vai para AGUARDANDO_NIVEL2 quando a alçada exige nível 2 e o solicitante não é o diretor", async () => {
    const responsavel = await criarUsuario("resp");
    const departamento = await criarDepartamento("mkt", { responsavelId: responsavel.id });
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const rascunho = await criarSolicitacao({
      solicitanteId: responsavel.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de servidores",
      valor: "5000",
      ...campos,
    });

    const enviada = await enviarSolicitacao(rascunho.id);

    expect(enviada.status).toBe("AGUARDANDO_NIVEL2");
  });

  it("pula os dois níveis e vai direto para APROVADO quando o solicitante é responsável e diretor ao mesmo tempo", async () => {
    const pessoa = await criarUsuario("chefe");
    const departamento = await criarDepartamento("mkt", {
      responsavelId: pessoa.id,
      diretorId: pessoa.id,
    });
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const rascunho = await criarSolicitacao({
      solicitanteId: pessoa.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de servidores",
      valor: "5000",
      ...campos,
    });

    const enviada = await enviarSolicitacao(rascunho.id);

    expect(enviada.status).toBe("APROVADO");
  });

  it("lança erro se nenhuma faixa de alçada cobre o valor", async () => {
    const responsavel = await criarUsuario("resp");
    const departamento = await criarDepartamento("mkt", { responsavelId: responsavel.id });
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    // Nenhuma faixa cadastrada.
    const rascunho = await criarSolicitacao({
      solicitanteId: responsavel.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de servidores",
      valor: "5000",
      ...campos,
    });

    await expect(enviarSolicitacao(rascunho.id)).rejects.toThrow(/faixa de alçada/);
  });

  it("lança erro se nenhuma faixa cobre o valor mesmo quando o solicitante não pula nível 1", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    // Nenhuma faixa cadastrada — o caminho ENVIADO (solicitante não é o
    // responsável) também precisa validar que existe uma faixa cobrindo o
    // valor, não só o caminho de auto-aprovação.
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de servidores",
      valor: "5000",
      ...campos,
    });

    await expect(enviarSolicitacao(rascunho.id)).rejects.toThrow(/faixa de alçada/);
  });

  it("não permite enviar uma solicitação que não está em rascunho", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });
    await enviarSolicitacao(rascunho.id);

    await expect(enviarSolicitacao(rascunho.id)).rejects.toThrow();
  });

  it("grava um evento de histórico ao enviar", async () => {
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    await enviarSolicitacao(rascunho.id);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: rascunho.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual(["rascunho_criado", "enviado"]);
  });

  it("notifica o solicitante por e-mail ao enviar", async () => {
    const enviarSpy = vi.spyOn(fake, "send");
    const solicitante = await criarUsuario("sol");
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios();
    await criarFaixa("0", "1000", false);
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    await enviarSolicitacao(rascunho.id);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });
});
