import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import { setEmailSender } from "@/lib/email";
import type { EmailMessage } from "@/lib/email";
import {
  aprovarNivel1,
  criarSolicitacao,
  enviarSolicitacao,
  listarPendentesNivel1,
  rejeitar,
} from "@/lib/workflow";

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

// Creates a full solicitação already in ENVIADO — the starting point every
// aprovarNivel1/rejeitar/listarPendentesNivel1 test needs. Caller must have
// already created whatever FaixaAlcada the test's `valor` requires.
async function criarSolicitacaoEnviada(
  sufixo: string,
  overrides: {
    solicitanteId?: string;
    responsavelId?: string;
    diretorId?: string;
    valor?: string;
  } = {}
) {
  const departamento = await criarDepartamento(sufixo, {
    responsavelId: overrides.responsavelId,
    diretorId: overrides.diretorId,
  });
  const solicitante = overrides.solicitanteId
    ? await testDb.usuario.findUniqueOrThrow({ where: { id: overrides.solicitanteId } })
    : await criarUsuario(`sol-${sufixo}`);
  const tipo = await criarTipoCompra(`Tipo ${sufixo}`);
  const campos = await criarCamposObrigatorios(sufixo);
  const rascunho = await criarSolicitacao({
    solicitanteId: solicitante.id,
    departamentoId: departamento.id,
    tipoCompraId: tipo.id,
    descricao: "Compra de teste",
    valor: overrides.valor ?? "500",
    ...campos,
  });
  const solicitacao = await enviarSolicitacao(rascunho.id);
  return { solicitacao, departamento, solicitante };
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

  it("notifica o responsável do departamento quando a solicitação vai para ENVIADO", async () => {
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

    const responsavel = await testDb.usuario.findUniqueOrThrow({
      where: { id: departamento.responsavelId },
    });
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: responsavel.email })
    );
  });

  it("não envia e-mail de responsável quando a solicitação pula direto para aprovado", async () => {
    const enviarSpy = vi.spyOn(fake, "send");
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

    await enviarSolicitacao(rascunho.id);

    // Só o e-mail de confirmação ao solicitante — ninguém está aguardando
    // aprovar, já que a etapa foi pulada automaticamente.
    expect(enviarSpy).toHaveBeenCalledTimes(1);
  });
});

describe("workflow: aprovarNivel1", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("aprova e vai para APROVADO quando a alçada não exige nível 2", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a1");

    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(aprovada.status).toBe("APROVADO");
  });

  it("vai para AGUARDANDO_NIVEL2 quando a alçada exige nível 2 e o solicitante não é o diretor", async () => {
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a2", { valor: "5000" });

    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(aprovada.status).toBe("AGUARDANDO_NIVEL2");
  });

  it("pula nível 2 e vai direto para APROVADO quando o solicitante é o diretor do departamento", async () => {
    const diretor = await criarUsuario("dir-a3");
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a3", {
      diretorId: diretor.id,
      solicitanteId: diretor.id,
      valor: "5000",
    });

    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(aprovada.status).toBe("APROVADO");
  });

  it("lança erro se quem aprova não é o responsável do departamento", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao } = await criarSolicitacaoEnviada("a4");
    const intruso = await criarUsuario("intruso-a4");

    await expect(aprovarNivel1(solicitacao.id, intruso.id)).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aguardando aprovação de nível 1", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a5");
    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    await expect(
      aprovarNivel1(solicitacao.id, departamento.responsavelId)
    ).rejects.toThrow();
  });

  it("grava um evento de histórico ao aprovar", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a6");

    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "aprovado",
    ]);
  });

  it("notifica o solicitante por e-mail quando a aprovação finaliza a solicitação", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento, solicitante } = await criarSolicitacaoEnviada("a7");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(enviarSpy).toHaveBeenCalledTimes(1);
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });

  it("não notifica o solicitante quando a aprovação só avança para nível 2", async () => {
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a8", { valor: "5000" });
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(enviarSpy).not.toHaveBeenCalled();
  });
});

describe("workflow: rejeitar", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("rejeita uma solicitação em ENVIADO quando quem rejeita é o responsável", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("r1");

    const rejeitada = await rejeitar(
      solicitacao.id,
      departamento.responsavelId,
      "Fora do orçamento"
    );

    expect(rejeitada.status).toBe("REJEITADO");
    expect(rejeitada.motivoRejeicao).toBe("Fora do orçamento");
  });

  it("rejeita uma solicitação em AGUARDANDO_NIVEL2 quando quem rejeita é o diretor", async () => {
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("r2", { valor: "5000" });
    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    const rejeitada = await rejeitar(
      solicitacao.id,
      departamento.diretorId,
      "Não é prioridade agora"
    );

    expect(rejeitada.status).toBe("REJEITADO");
  });

  it("lança erro se o motivo estiver vazio", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("r3");

    await expect(
      rejeitar(solicitacao.id, departamento.responsavelId, "   ")
    ).rejects.toThrow();
  });

  it("lança erro se quem rejeita não é o aprovador esperado", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao } = await criarSolicitacaoEnviada("r4");
    const intruso = await criarUsuario("intruso-r4");

    await expect(
      rejeitar(solicitacao.id, intruso.id, "Motivo qualquer")
    ).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aguardando aprovação", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("r5");
    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    await expect(
      rejeitar(solicitacao.id, departamento.responsavelId, "Motivo qualquer")
    ).rejects.toThrow();
  });

  it("grava um evento de histórico com o motivo ao rejeitar", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("r6");

    await rejeitar(solicitacao.id, departamento.responsavelId, "Fora do orçamento");

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "rejeitado",
    ]);
    expect(historico.at(-1)?.detalhe).toBe("Fora do orçamento");
  });

  it("notifica o solicitante por e-mail ao rejeitar", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento, solicitante } = await criarSolicitacaoEnviada("r7");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await rejeitar(solicitacao.id, departamento.responsavelId, "Fora do orçamento");

    expect(enviarSpy).toHaveBeenCalledTimes(1);
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });
});

describe("workflow: listarPendentesNivel1", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações ENVIADO do departamento onde o usuário é responsável", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao: s1, departamento } = await criarSolicitacaoEnviada("l1");
    const { solicitacao: s2 } = await criarSolicitacaoEnviada("l1b", {
      responsavelId: departamento.responsavelId,
    });

    const pendentes = await listarPendentesNivel1(departamento.responsavelId);

    expect(pendentes.map((s) => s.id).sort()).toEqual([s1.id, s2.id].sort());
  });

  it(
    "não lista solicitações de outro departamento nem que já saíram de ENVIADO",
    async () => {
      await criarFaixa("0", "1000", false);
      const { departamento } = await criarSolicitacaoEnviada("l2");
      // De outro departamento, com outro responsável.
      await criarSolicitacaoEnviada("l2-outro");
      // Do mesmo departamento, mas já aprovada — não deve mais aparecer.
      const { solicitacao: aprovada } = await criarSolicitacaoEnviada("l2-aprovada", {
        responsavelId: departamento.responsavelId,
      });
      await aprovarNivel1(aprovada.id, departamento.responsavelId);

      const pendentes = await listarPendentesNivel1(departamento.responsavelId);

      expect(pendentes).toHaveLength(1);
    },
    15000
  );
});
