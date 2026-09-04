import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import { setEmailSender } from "@/lib/email";
import type { EmailMessage } from "@/lib/email";
import {
  aprovarNivel1,
  aprovarNivel2,
  confirmarCompra,
  criarSolicitacao,
  designarCompradorManualmente,
  editarSolicitacao,
  enviarParaPagamento,
  enviarSolicitacao,
  listarMinhasSolicitacoes,
  listarPendentesComprador,
  listarPendentesDesignacaoComprador,
  listarPendentesNivel1,
  listarPendentesNivel2,
  listarPendentesPagamento,
  listarSolicitacoesParaExportar,
  recusarPagamento,
  registrarPagamento,
  reenviarParaPagamento,
  reenviarSolicitacao,
  rejeitar,
  type CriarSolicitacaoInput,
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

async function criarTipoCompra(
  nome: string,
  overrides: { despesaPessoal?: boolean; exigePrevisaoChegada?: boolean } = {}
) {
  return testDb.tipoCompra.create({
    data: {
      nome,
      despesaPessoal: overrides.despesaPessoal ?? false,
      exigePrevisaoChegada: overrides.exigePrevisaoChegada ?? false,
    },
  });
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

// Builds on criarSolicitacaoEnviada by also rejecting it — the starting
// point every editarSolicitacao/reenvio test needs.
async function criarSolicitacaoRejeitada(sufixo: string) {
  const { solicitacao, departamento, solicitante } = await criarSolicitacaoEnviada(sufixo);
  const rejeitada = await rejeitar(
    solicitacao.id,
    departamento.responsavelId,
    "Motivo original de teste"
  );
  return { solicitacao: rejeitada, departamento, solicitante };
}

// Creates a full solicitação already in AGUARDANDO_NIVEL2 — the starting
// point every aprovarNivel2/listarPendentesNivel2 test needs. Uses a fixed
// alçada (valores acima de 1000 exigem nível 2) since no test needs a
// different threshold, and goes through aprovarNivel1 for real rather than
// faking the status directly.
async function criarSolicitacaoAguardandoNivel2(sufixo: string, diretorId?: string) {
  await criarFaixa("0", "1000", false);
  await criarFaixa("1000.01", null, true);
  const { solicitacao, departamento, solicitante } = await criarSolicitacaoEnviada(sufixo, {
    diretorId,
    valor: "5000",
  });
  const aguardando = await aprovarNivel1(solicitacao.id, departamento.responsavelId);
  return { solicitacao: aguardando, departamento, solicitante };
}

// Creates a full solicitação already in APROVADO (no nível 2 involved) —
// the starting point every designarComprador/designarCompradorManualmente/
// listarPendentesDesignacaoComprador test needs. Every call site only cares
// about the resulting solicitação, not the department/solicitante it was
// built from.
async function criarSolicitacaoAprovada(sufixo: string) {
  await criarFaixa("0", null, false);
  const { solicitacao, departamento } = await criarSolicitacaoEnviada(sufixo);
  return aprovarNivel1(solicitacao.id, departamento.responsavelId);
}

// Creates a full solicitação already in APROVADO with a comprador already
// designated (via matriz) — the starting point every
// confirmarCompra/enviarParaPagamento test needs.
async function criarSolicitacaoComCompradorDesignado(
  sufixo: string,
  tipoOverrides: { exigePrevisaoChegada?: boolean } = {}
) {
  const { enviada, departamento, comprador } =
    await criarSolicitacaoEnviadaComEntradaMatriz(sufixo, tipoOverrides);
  const aprovada = await aprovarNivel1(enviada.id, departamento.responsavelId);
  const solicitante = await testDb.usuario.findUniqueOrThrow({
    where: { id: aprovada.solicitanteId },
  });
  return { solicitacao: aprovada, comprador, solicitante };
}

// Creates a full solicitação already in AGUARDANDO_PAGAMENTO — the starting
// point every recusarPagamento/registrarPagamento/listarPendentesPagamento
// test needs. Goes through confirmarCompra + enviarParaPagamento for real
// rather than faking the status directly.
async function criarSolicitacaoAguardandoPagamento(
  sufixo: string,
  tipoOverrides: { exigePrevisaoChegada?: boolean } = {}
) {
  const { solicitacao, comprador, solicitante } = await criarSolicitacaoComCompradorDesignado(
    sufixo,
    tipoOverrides
  );
  await confirmarCompra(
    solicitacao.id,
    comprador.id,
    tipoOverrides.exigePrevisaoChegada ? { previsaoChegada: "2026-09-30" } : {}
  );
  const aguardandoPagamento = await enviarParaPagamento(solicitacao.id, comprador.id, {
    notaFiscalUrls: [`${sufixo}/nota-fiscal.pdf`],
    metodoPagamento: "PIX",
    dadosPagamento: "Chave PIX: 12345678900",
    fornecedorDocumento: "12.345.678/0001-99",
  });
  return { solicitacao: aguardandoPagamento, comprador, solicitante };
}

async function criarEntradaMatriz(
  departamentoId: string,
  tipoCompraId: string,
  compradorId: string
) {
  return testDb.matrizComprador.create({ data: { departamentoId, tipoCompraId, compradorId } });
}

// Creates a solicitação already ENVIADO, with a matriz_comprador entry
// already set up for its (departamento, tipoCompra) pair — the shared setup
// every "designa automaticamente pela matriz" test needs before calling
// aprovarNivel1 itself.
async function criarSolicitacaoEnviadaComEntradaMatriz(
  sufixo: string,
  tipoOverrides: { exigePrevisaoChegada?: boolean } = {}
) {
  const comprador = await criarUsuario(`comp-${sufixo}`);
  await criarFaixa("0", null, false);
  const departamento = await criarDepartamento(sufixo);
  const tipo = await criarTipoCompra(`Tipo ${sufixo}`, tipoOverrides);
  await criarEntradaMatriz(departamento.id, tipo.id, comprador.id);
  const solicitante = await criarUsuario(`sol-${sufixo}`);
  const campos = await criarCamposObrigatorios(sufixo);
  const rascunho = await criarSolicitacao({
    solicitanteId: solicitante.id,
    departamentoId: departamento.id,
    tipoCompraId: tipo.id,
    descricao: "Compra de teste",
    valor: "500",
    ...campos,
  });
  const enviada = await enviarSolicitacao(rascunho.id);
  return { enviada, departamento, comprador };
}

// Reuses every field already on a solicitação as the base for an edit call
// — most editarSolicitacao tests only care about changing one or two
// fields, not retyping the whole shape each time.
function construirInputEdicao(
  solicitacao: Awaited<ReturnType<typeof criarSolicitacaoRejeitada>>["solicitacao"],
  overrides: Partial<CriarSolicitacaoInput> = {}
): CriarSolicitacaoInput {
  return {
    solicitanteId: solicitacao.solicitanteId,
    departamentoId: solicitacao.departamentoId,
    tipoCompraId: solicitacao.tipoCompraId,
    descricao: solicitacao.descricao,
    valor: solicitacao.valor.toString(),
    fornecedor: solicitacao.fornecedor,
    formaPagamento: solicitacao.formaPagamento,
    centroCustoId: solicitacao.centroCustoId,
    centroResultadoId: solicitacao.centroResultadoId,
    contaContabilId: solicitacao.contaContabilId,
    empresaId: solicitacao.empresaId,
    linkCompra: solicitacao.linkCompra,
    informacoesComplementares: solicitacao.informacoesComplementares,
    ...overrides,
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

  it("grava a cotação/orçamento quando informada", async () => {
    const solicitante = await criarUsuario("sol-cot");
    const departamento = await criarDepartamento("mkt-cot");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios("cot");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
      cotacaoUrl: "cotacoes/orcamento.pdf",
    });

    expect(solicitacao.cotacaoUrl).toBe("cotacoes/orcamento.pdf");
  });

  it("não exige cotação/orçamento — fica nula quando não informada", async () => {
    const solicitante = await criarUsuario("sol-semcot");
    const departamento = await criarDepartamento("mkt-semcot");
    const tipo = await criarTipoCompra("Mercado Livre");
    const campos = await criarCamposObrigatorios("semcot");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teclados",
      valor: "500",
      ...campos,
    });

    expect(solicitacao.cotacaoUrl).toBeNull();
  });

  it("não exige fornecedor nem forma de pagamento quando o tipo de compra dispensa (ex.: Mercado Livre)", async () => {
    const solicitante = await criarUsuario("sol-dff");
    const departamento = await criarDepartamento("mkt-dff");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Mercado Livre dff", dispensaFornecedorForma: true },
    });
    const campos = await criarCamposObrigatorios("dff");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra via link",
      valor: "500",
      // fornecedor e formaPagamento propositalmente omitidos.
      centroCustoId: campos.centroCustoId,
      centroResultadoId: campos.centroResultadoId,
      contaContabilId: campos.contaContabilId,
      empresaId: campos.empresaId,
    });

    expect(solicitacao.fornecedor).toBeNull();
    expect(solicitacao.formaPagamento).toBeNull();
  });

  it("continua exigindo valor mesmo quando o tipo de compra dispensa fornecedor/forma", async () => {
    const solicitante = await criarUsuario("sol-dff2");
    const departamento = await criarDepartamento("mkt-dff2");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Mercado Livre dff2", dispensaFornecedorForma: true },
    });
    const campos = await criarCamposObrigatorios("dff2");

    await expect(
      criarSolicitacao({
        solicitanteId: solicitante.id,
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        descricao: "Compra via link",
        valor: "0",
        centroCustoId: campos.centroCustoId,
        centroResultadoId: campos.centroResultadoId,
        contaContabilId: campos.contaContabilId,
        empresaId: campos.empresaId,
      })
    ).rejects.toThrow();
  });

  it("continua exigindo centro de custo/resultado/conta contábil mesmo quando o tipo de compra dispensa fornecedor/forma", async () => {
    const solicitante = await criarUsuario("sol-dff3");
    const departamento = await criarDepartamento("mkt-dff3");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Mercado Livre dff3", dispensaFornecedorForma: true },
    });
    const campos = await criarCamposObrigatorios("dff3");

    await expect(
      criarSolicitacao({
        solicitanteId: solicitante.id,
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        descricao: "Compra via link",
        valor: "500",
        empresaId: campos.empresaId,
      })
    ).rejects.toThrow(/centro de custo/);
  });

  it("usa a empresa fixa do tipo de compra, ignorando o que vier no formulário", async () => {
    const solicitante = await criarUsuario("sol-ef1");
    const departamento = await criarDepartamento("mkt-ef1");
    const empresaFixa = await testDb.empresa.create({ data: { nome: "SMELL ef1" } });
    const outraEmpresa = await testDb.empresa.create({ data: { nome: "Outra ef1" } });
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Mercado Livre ef1", empresaFixaId: empresaFixa.id },
    });
    const campos = await criarCamposObrigatorios("ef1");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra via link",
      valor: "500",
      fornecedor: campos.fornecedor,
      formaPagamento: campos.formaPagamento,
      centroCustoId: campos.centroCustoId,
      centroResultadoId: campos.centroResultadoId,
      contaContabilId: campos.contaContabilId,
      empresaId: outraEmpresa.id,
    });

    expect(solicitacao.empresaId).toBe(empresaFixa.id);
  });

  it("não exige empresa quando o tipo de compra tem empresa fixa", async () => {
    const solicitante = await criarUsuario("sol-ef2");
    const departamento = await criarDepartamento("mkt-ef2");
    const empresaFixa = await testDb.empresa.create({ data: { nome: "SMELL ef2" } });
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Mercado Livre ef2", empresaFixaId: empresaFixa.id },
    });
    const campos = await criarCamposObrigatorios("ef2");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra via link",
      valor: "500",
      fornecedor: campos.fornecedor,
      formaPagamento: campos.formaPagamento,
      centroCustoId: campos.centroCustoId,
      centroResultadoId: campos.centroResultadoId,
      contaContabilId: campos.contaContabilId,
      // empresaId propositalmente omitido.
    });

    expect(solicitacao.empresaId).toBe(empresaFixa.id);
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

  it("pula o nível 1 e vai para AGUARDANDO_NIVEL2 quando o solicitante é o responsável, mesmo que a alçada não exija nível 2", async () => {
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

    expect(enviada.status).toBe("AGUARDANDO_NIVEL2");
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

  it("notifica o diretor por e-mail quando o envio pula direto para AGUARDANDO_NIVEL2", async () => {
    const enviarSpy = vi.spyOn(fake, "send");
    const responsavel = await criarUsuario("resp-dir");
    const departamento = await criarDepartamento("mkt-dir", { responsavelId: responsavel.id });
    const diretor = await testDb.usuario.findUniqueOrThrow({
      where: { id: departamento.diretorId },
    });
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

    await enviarSolicitacao(rascunho.id);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: diretor.email })
    );
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

  it("notifica o diretor por e-mail mesmo quando a alçada não exige nível 2, se o solicitante é o responsável", async () => {
    const enviarSpy = vi.spyOn(fake, "send");
    const responsavel = await criarUsuario("resp");
    const departamento = await criarDepartamento("mkt", { responsavelId: responsavel.id });
    const diretor = await testDb.usuario.findUniqueOrThrow({
      where: { id: departamento.diretorId },
    });
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

    // E-mail de confirmação ao solicitante + aviso de aprovação pendente ao
    // diretor — o nível 1 foi pulado (o solicitante é o próprio
    // responsável), mas o nível 2 nunca é, nesse caso.
    expect(enviarSpy).toHaveBeenCalledTimes(2);
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: diretor.email,
        subject: expect.stringContaining("aguardando sua aprovação"),
      })
    );
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

  it("notifica o diretor por e-mail quando a aprovação de nível 1 avança para nível 2", async () => {
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("a2b", { valor: "5000" });
    const diretor = await testDb.usuario.findUniqueOrThrow({
      where: { id: departamento.diretorId },
    });
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: diretor.email })
    );
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
    // Sem entrada na matriz de comprador, designarComprador cai no
    // fallback e grava seu próprio evento de histórico logo em seguida.
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "aprovado",
      "aguardando_designacao_manual",
    ]);
  });

  it("notifica o solicitante por e-mail quando a aprovação finaliza a solicitação", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento, solicitante } = await criarSolicitacaoEnviada("a7");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    // Confirmação ao solicitante + aviso ao Financeiro (sem entrada na
    // matriz para esse tipo, ver designarComprador).
    expect(enviarSpy).toHaveBeenCalledTimes(2);
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });

  it("não notifica o solicitante quando a aprovação só avança para nível 2", async () => {
    // O diretor é notificado nesse caso (ver o teste "notifica o diretor..."
    // acima) — só o solicitante não deve ser, já que a decisão ainda não
    // chegou a um desfecho para ele.
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento, solicitante } = await criarSolicitacaoEnviada("a8", {
      valor: "5000",
    });
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(enviarSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
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

  // Comprador recusando uma compra em APROVADO — só quando o tipo de
  // compra exige previsão de chegada (ex.: Mercado Livre, cartão de
  // crédito). Ver TipoCompra.exigePrevisaoChegada em workflow.ts.
  it("permite ao comprador designado rejeitar uma compra em APROVADO quando o tipo exige previsão de chegada", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("r8", {
      exigePrevisaoChegada: true,
    });

    const rejeitada = await rejeitar(solicitacao.id, comprador.id, "Item indisponível");

    expect(rejeitada.status).toBe("REJEITADO");
    expect(rejeitada.motivoRejeicao).toBe("Item indisponível");
  });

  it("limpa o comprador designado ao rejeitar", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("r9", {
      exigePrevisaoChegada: true,
    });

    const rejeitada = await rejeitar(solicitacao.id, comprador.id, "Item indisponível");

    expect(rejeitada.compradorId).toBeNull();
  });

  it("lança erro se o comprador tenta rejeitar uma compra de um tipo que não exige previsão de chegada", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("r10");

    await expect(
      rejeitar(solicitacao.id, comprador.id, "Item indisponível")
    ).rejects.toThrow();
  });

  it("lança erro se quem tenta rejeitar não é o comprador designado, mesmo com previsão de chegada", async () => {
    const { solicitacao } = await criarSolicitacaoComCompradorDesignado("r11", {
      exigePrevisaoChegada: true,
    });
    const intruso = await criarUsuario("intruso-r11");

    await expect(
      rejeitar(solicitacao.id, intruso.id, "Item indisponível")
    ).rejects.toThrow();
  });

  it("permite reenviar e designar um comprador de novo depois de o comprador rejeitar", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, comprador, solicitante } = await criarSolicitacaoComCompradorDesignado(
      "r12",
      { exigePrevisaoChegada: true }
    );
    const departamento = await testDb.departamento.findUniqueOrThrow({
      where: { id: solicitacao.departamentoId },
    });
    const rejeitada = await rejeitar(solicitacao.id, comprador.id, "Item indisponível");
    expect(rejeitada.compradorId).toBeNull();

    const editada = await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(rejeitada)
    );
    expect(editada.status).toBe("REJEITADO");

    const reenviada = await reenviarSolicitacao(solicitacao.id);
    expect(reenviada.status).toBe("ENVIADO");

    // Ainda existe entrada na matriz de comprador — designarComprador
    // reatribui o mesmo comprador automaticamente, em vez de ficar travado
    // porque compradorId já estava preenchido (ver rejeitar em
    // workflow.ts).
    const aprovada = await aprovarNivel1(reenviada.id, departamento.responsavelId);
    expect(aprovada.status).toBe("APROVADO");
    expect(aprovada.compradorId).toBe(comprador.id);
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

  it("não lista solicitações de outro departamento nem que já saíram de ENVIADO", async () => {
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
  });
});

describe("workflow: editarSolicitacao", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("edita os campos de uma solicitação rejeitada", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("e1");
    const novoTipo = await criarTipoCompra("Novo tipo e1");

    const editada = await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, {
        tipoCompraId: novoTipo.id,
        descricao: "Descrição corrigida",
        valor: "600",
      })
    );

    expect(editada.descricao).toBe("Descrição corrigida");
    expect(editada.valor.toString()).toBe("600");
    expect(editada.tipoCompraId).toBe(novoTipo.id);
    expect(editada.status).toBe("REJEITADO");
  });

  it("permite anexar/trocar a cotação/orçamento ao editar", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("e-cot");
    expect(solicitacao.cotacaoUrl).toBeNull();

    const editada = await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, { cotacaoUrl: "cotacoes/nova.pdf" })
    );

    expect(editada.cotacaoUrl).toBe("cotacoes/nova.pdf");
  });

  it("mantém o motivo da rejeição visível depois de editar, antes do reenvio", async () => {
    // motivoRejeicao só é limpo quando o reenvio de fato acontece (ver
    // reenviarSolicitacao) — se ele sumisse aqui, um reenvio que falhasse
    // logo em seguida deixaria a solicitação sem nenhum motivo visível na
    // tela, mesmo continuando REJEITADO.
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("e2");
    expect(solicitacao.motivoRejeicao).not.toBeNull();

    const editada = await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao)
    );

    expect(editada.motivoRejeicao).toBe("Motivo original de teste");
  });

  it("lança erro se a solicitação não está rejeitada", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoEnviada("e3");

    await expect(
      editarSolicitacao(
        solicitacao.id,
        solicitante.id,
        construirInputEdicao(solicitacao, { descricao: "Tentativa" })
      )
    ).rejects.toThrow();
  });

  it("lança erro se quem edita não é o solicitante", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao } = await criarSolicitacaoRejeitada("e4");
    const intruso = await criarUsuario("intruso-e4");

    await expect(
      editarSolicitacao(
        solicitacao.id,
        intruso.id,
        construirInputEdicao(solicitacao, { descricao: "Tentativa" })
      )
    ).rejects.toThrow();
  });

  it("grava um evento de histórico ao editar", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("e5");

    await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, { descricao: "Descrição corrigida" })
    );

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "rejeitado",
      "editado_apos_rejeicao",
    ]);
  });
});

describe("workflow: reenviarSolicitacao", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("reenvia uma solicitação rejeitada e reinicia o fluxo a partir do nível 1", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("v1");
    await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, { descricao: "Corrigido" })
    );

    const reenviada = await reenviarSolicitacao(solicitacao.id);

    expect(reenviada.status).toBe("ENVIADO");
  });

  it("limpa o motivo da rejeição da solicitação ao reenviar, mas mantém visível no histórico", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("v2");
    await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, { descricao: "Corrigido" })
    );

    const reenviada = await reenviarSolicitacao(solicitacao.id);

    expect(reenviada.motivoRejeicao).toBeNull();

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "rejeitado",
      "editado_apos_rejeicao",
      "reenviado",
    ]);
    const eventoRejeicao = historico.find((h) => h.evento === "rejeitado");
    expect(eventoRejeicao?.detalhe).toBe("Motivo original de teste");
  });

  it("mantém o motivo da rejeição visível se o reenvio falhar depois da edição", async () => {
    // Regressão: motivoRejeicao não pode ser limpo em editarSolicitacao —
    // só quando o reenvio de fato é confirmado. Aqui a edição sobe o valor
    // para uma faixa sem alçada cadastrada, então reenviarSolicitacao
    // lança e a solicitação continua REJEITADO com o motivo original ainda
    // visível, não silenciosamente vazio.
    await criarFaixa("0", "1000", false);
    const { solicitacao, solicitante } = await criarSolicitacaoRejeitada("v3");

    await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, { valor: "999999" })
    );

    await expect(reenviarSolicitacao(solicitacao.id)).rejects.toThrow(/faixa de alçada/);

    const atual = await testDb.solicitacao.findUniqueOrThrow({ where: { id: solicitacao.id } });
    expect(atual.status).toBe("REJEITADO");
    expect(atual.motivoRejeicao).toBe("Motivo original de teste");
  });

  it("aplica auto-skip normalmente também no reenvio (solicitante é o responsável)", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento, solicitante } = await criarSolicitacaoRejeitada("v4");
    await editarSolicitacao(
      solicitacao.id,
      solicitante.id,
      construirInputEdicao(solicitacao, { descricao: "Corrigido" })
    );
    // Simula o solicitante virando responsável do próprio departamento antes
    // do reenvio, para exercitar o mesmo auto-skip que o envio original já
    // tem — resolverEstadoInicial roda do zero a cada reenvio, não retoma
    // de onde a rejeição parou.
    await testDb.departamento.update({
      where: { id: departamento.id },
      data: { responsavelId: solicitante.id },
    });

    const reenviada = await reenviarSolicitacao(solicitacao.id);

    expect(reenviada.status).toBe("AGUARDANDO_NIVEL2");
  });

  it("lança erro ao tentar reenviar uma solicitação que não está rejeitada", async () => {
    await criarFaixa("0", "1000", false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("v5");
    await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    await expect(reenviarSolicitacao(solicitacao.id)).rejects.toThrow();
  });

  it("lança erro ao tentar reenviar uma solicitação que ainda é rascunho", async () => {
    await criarFaixa("0", "1000", false);
    const solicitante = await criarUsuario("sol-v6");
    const departamento = await criarDepartamento("v6");
    const tipo = await criarTipoCompra("Tipo v6");
    const campos = await criarCamposObrigatorios("v6");
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teste",
      valor: "500",
      ...campos,
    });

    await expect(reenviarSolicitacao(rascunho.id)).rejects.toThrow();
  });
});

describe("workflow: aprovarNivel2", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("aprova e vai direto para APROVADO", async () => {
    const { solicitacao, departamento } = await criarSolicitacaoAguardandoNivel2("n1");

    const aprovada = await aprovarNivel2(solicitacao.id, departamento.diretorId);

    expect(aprovada.status).toBe("APROVADO");
  });

  it("lança erro se quem aprova não é o diretor do departamento", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoNivel2("n2");
    const intruso = await criarUsuario("intruso-n2");

    await expect(aprovarNivel2(solicitacao.id, intruso.id)).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aguardando aprovação de nível 2", async () => {
    const { solicitacao, departamento } = await criarSolicitacaoAguardandoNivel2("n3");
    await aprovarNivel2(solicitacao.id, departamento.diretorId);

    await expect(aprovarNivel2(solicitacao.id, departamento.diretorId)).rejects.toThrow();
  });

  it("grava um evento de histórico ao aprovar", async () => {
    const { solicitacao, departamento } = await criarSolicitacaoAguardandoNivel2("n4");

    await aprovarNivel2(solicitacao.id, departamento.diretorId);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    // Sem entrada na matriz de comprador, designarComprador cai no
    // fallback e grava seu próprio evento de histórico logo em seguida.
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "aguardando_nivel2",
      "aprovado",
      "aguardando_designacao_manual",
    ]);
  });

  it("notifica o solicitante por e-mail ao aprovar", async () => {
    const { solicitacao, departamento, solicitante } =
      await criarSolicitacaoAguardandoNivel2("n5");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel2(solicitacao.id, departamento.diretorId);

    // Confirmação ao solicitante + aviso ao Financeiro (sem entrada na
    // matriz para esse tipo, ver designarComprador).
    expect(enviarSpy).toHaveBeenCalledTimes(2);
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });
});

describe("workflow: listarPendentesNivel2", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações AGUARDANDO_NIVEL2 do departamento onde o usuário é diretor", async () => {
    const { solicitacao, departamento } = await criarSolicitacaoAguardandoNivel2("d1");

    const pendentes = await listarPendentesNivel2(departamento.diretorId);

    expect(pendentes.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("não lista solicitações de outro departamento nem que já saíram de AGUARDANDO_NIVEL2", async () => {
    const { departamento } = await criarSolicitacaoAguardandoNivel2("d2");
    // De outro departamento, com outro diretor.
    await criarSolicitacaoAguardandoNivel2("d2-outro");
    // Do mesmo departamento, mas já aprovada — não deve mais aparecer.
    const { solicitacao: aprovada } = await criarSolicitacaoAguardandoNivel2(
      "d2-aprovada",
      departamento.diretorId
    );
    await aprovarNivel2(aprovada.id, departamento.diretorId);

    const pendentes = await listarPendentesNivel2(departamento.diretorId);

    expect(pendentes).toHaveLength(1);
  });
});

describe("workflow: designarComprador (automático)", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("designa o comprador automaticamente quando há uma entrada na matriz", async () => {
    const { enviada, departamento, comprador } =
      await criarSolicitacaoEnviadaComEntradaMatriz("m1");

    const aprovada = await aprovarNivel1(enviada.id, departamento.responsavelId);

    expect(aprovada.compradorId).toBe(comprador.id);
  });

  it("mantém compradorId nulo e notifica a lista do Financeiro quando não há entrada na matriz", async () => {
    const enviarSpy = vi.spyOn(fake, "send");

    const solicitacao = await criarSolicitacaoAprovada("m2");

    expect(solicitacao.compradorId).toBeNull();
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: process.env.EMAIL_FINANCEIRO })
    );
  });

  it("notifica o comprador designado automaticamente por e-mail", async () => {
    const { enviada, departamento, comprador } =
      await criarSolicitacaoEnviadaComEntradaMatriz("m3");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(enviada.id, departamento.responsavelId);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: comprador.email })
    );
  });

  it("grava um evento de histórico ao designar automaticamente pela matriz", async () => {
    const { enviada, departamento } = await criarSolicitacaoEnviadaComEntradaMatriz("m4");

    const aprovada = await aprovarNivel1(enviada.id, departamento.responsavelId);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: aprovada.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "aprovado",
      "comprador_designado",
    ]);
  });

  it("designa automaticamente também ao aprovar de nível 2", async () => {
    const comprador = await criarUsuario("comp-m5");
    const { solicitacao, departamento } = await criarSolicitacaoAguardandoNivel2("m5");
    await criarEntradaMatriz(departamento.id, solicitacao.tipoCompraId, comprador.id);

    const aprovada = await aprovarNivel2(solicitacao.id, departamento.diretorId);

    expect(aprovada.compradorId).toBe(comprador.id);
  });

  it("designa automaticamente também quando o envio pula direto para aprovado (solicitante é responsável e diretor)", async () => {
    const comprador = await criarUsuario("comp-m6");
    await criarFaixa("0", null, false);
    const pessoa = await criarUsuario("resp-m6");
    const departamento = await criarDepartamento("m6", {
      responsavelId: pessoa.id,
      diretorId: pessoa.id,
    });
    const tipo = await criarTipoCompra("Tipo m6");
    await criarEntradaMatriz(departamento.id, tipo.id, comprador.id);
    const campos = await criarCamposObrigatorios("m6");
    const rascunho = await criarSolicitacao({
      solicitanteId: pessoa.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teste",
      valor: "500",
      ...campos,
    });

    const enviada = await enviarSolicitacao(rascunho.id);

    expect(enviada.status).toBe("APROVADO");
    expect(enviada.compradorId).toBe(comprador.id);
  });

  it("designa o próprio solicitante quando o tipo de compra está configurado assim", async () => {
    await criarFaixa("0", null, false);
    const departamento = await criarDepartamento("m7");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Tipo m7", compradorEhSolicitante: true },
    });
    const solicitante = await criarUsuario("sol-m7");
    const campos = await criarCamposObrigatorios("m7");
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teste",
      valor: "500",
      ...campos,
    });
    const enviada = await enviarSolicitacao(rascunho.id);

    const aprovada = await aprovarNivel1(enviada.id, departamento.responsavelId);

    expect(aprovada.status).toBe("APROVADO");
    expect(aprovada.compradorId).toBe(solicitante.id);
  });

  it("notifica o solicitante como comprador designado quando o tipo de compra está configurado assim", async () => {
    await criarFaixa("0", null, false);
    const departamento = await criarDepartamento("m8");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Tipo m8", compradorEhSolicitante: true },
    });
    const solicitante = await criarUsuario("sol-m8");
    const campos = await criarCamposObrigatorios("m8");
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teste",
      valor: "500",
      ...campos,
    });
    const enviada = await enviarSolicitacao(rascunho.id);
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await aprovarNivel1(enviada.id, departamento.responsavelId);

    expect(enviarSpy).toHaveBeenCalledWith(expect.objectContaining({ to: solicitante.email }));
  });

  it("grava um evento de histórico ao designar o solicitante como comprador", async () => {
    await criarFaixa("0", null, false);
    const departamento = await criarDepartamento("m9");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Tipo m9", compradorEhSolicitante: true },
    });
    const solicitante = await criarUsuario("sol-m9");
    const campos = await criarCamposObrigatorios("m9");
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teste",
      valor: "500",
      ...campos,
    });
    const enviada = await enviarSolicitacao(rascunho.id);

    const aprovada = await aprovarNivel1(enviada.id, departamento.responsavelId);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: aprovada.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "aprovado",
      "comprador_designado",
    ]);
  });

  it("prioriza compradorEhSolicitante sobre uma entrada na matriz", async () => {
    await criarFaixa("0", null, false);
    const outroComprador = await criarUsuario("comp-m10");
    const departamento = await criarDepartamento("m10");
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Tipo m10", compradorEhSolicitante: true },
    });
    await criarEntradaMatriz(departamento.id, tipo.id, outroComprador.id);
    const solicitante = await criarUsuario("sol-m10");
    const campos = await criarCamposObrigatorios("m10");
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra de teste",
      valor: "500",
      ...campos,
    });
    const enviada = await enviarSolicitacao(rascunho.id);

    const aprovada = await aprovarNivel1(enviada.id, departamento.responsavelId);

    expect(aprovada.compradorId).toBe(solicitante.id);
  });
});

describe("workflow: designarCompradorManualmente", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("designa o comprador escolhido manualmente", async () => {
    const solicitacao = await criarSolicitacaoAprovada("man1");
    const financeiro = await criarUsuario("fin-man1");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const comprador = await criarUsuario("comp-man1");

    const designada = await designarCompradorManualmente(
      solicitacao.id,
      financeiro.id,
      comprador.id
    );

    expect(designada.compradorId).toBe(comprador.id);
  });

  it("lança erro se quem designa não é do Financeiro", async () => {
    const solicitacao = await criarSolicitacaoAprovada("man2");
    const naoFinanceiro = await criarUsuario("naofin-man2");
    const comprador = await criarUsuario("comp-man2");

    await expect(
      designarCompradorManualmente(solicitacao.id, naoFinanceiro.id, comprador.id)
    ).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aprovada", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao } = await criarSolicitacaoEnviada("man3");
    const financeiro = await criarUsuario("fin-man3");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const comprador = await criarUsuario("comp-man3");

    await expect(
      designarCompradorManualmente(solicitacao.id, financeiro.id, comprador.id)
    ).rejects.toThrow();
  });

  it("lança erro se a solicitação já tem comprador designado", async () => {
    const solicitacao = await criarSolicitacaoAprovada("man4");
    const financeiro = await criarUsuario("fin-man4");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const comprador1 = await criarUsuario("comp-man4a");
    const comprador2 = await criarUsuario("comp-man4b");
    await designarCompradorManualmente(solicitacao.id, financeiro.id, comprador1.id);

    await expect(
      designarCompradorManualmente(solicitacao.id, financeiro.id, comprador2.id)
    ).rejects.toThrow();
  });

  it("grava um evento de histórico ao designar manualmente", async () => {
    const solicitacao = await criarSolicitacaoAprovada("man5");
    const financeiro = await criarUsuario("fin-man5");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const comprador = await criarUsuario("comp-man5");

    await designarCompradorManualmente(solicitacao.id, financeiro.id, comprador.id);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.at(-1)?.evento).toBe("comprador_designado");
    expect(historico.at(-1)?.atorId).toBe(financeiro.id);
  });

  it("notifica o comprador designado manualmente por e-mail", async () => {
    const solicitacao = await criarSolicitacaoAprovada("man6");
    const financeiro = await criarUsuario("fin-man6");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const comprador = await criarUsuario("comp-man6");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await designarCompradorManualmente(solicitacao.id, financeiro.id, comprador.id);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: comprador.email })
    );
  });
});

describe("workflow: listarPendentesDesignacaoComprador", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações aprovadas sem comprador designado", async () => {
    const solicitacao = await criarSolicitacaoAprovada("p1");

    const pendentes = await listarPendentesDesignacaoComprador();

    expect(pendentes.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("não lista solicitações com comprador já designado nem em outros status", async () => {
    // Aprovada, mas já com comprador — não deve aparecer.
    const comComprador = await criarSolicitacaoAprovada("p2");
    const financeiro = await criarUsuario("fin-p2");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const comprador = await criarUsuario("comp-p2");
    await designarCompradorManualmente(comComprador.id, financeiro.id, comprador.id);

    // Ainda enviada, nem aprovada — não deve aparecer.
    await criarSolicitacaoEnviada("p2-enviada");

    const pendentes = await listarPendentesDesignacaoComprador();

    expect(pendentes).toHaveLength(0);
  });
});

describe("workflow: confirmarCompra", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("confirma a compra e transiciona para COMPRA_CONFIRMADA", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("cc1");

    const confirmada = await confirmarCompra(solicitacao.id, comprador.id);

    expect(confirmada.status).toBe("COMPRA_CONFIRMADA");
  });

  it("lança erro se quem confirma não é o comprador designado", async () => {
    const { solicitacao } = await criarSolicitacaoComCompradorDesignado("cc2");
    const outro = await criarUsuario("outro-cc2");

    await expect(confirmarCompra(solicitacao.id, outro.id)).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aprovada", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("cc3");
    await confirmarCompra(solicitacao.id, comprador.id);

    await expect(confirmarCompra(solicitacao.id, comprador.id)).rejects.toThrow();
  });

  it("grava um evento de histórico ao confirmar a compra", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("cc4");

    await confirmarCompra(solicitacao.id, comprador.id);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.at(-1)?.evento).toBe("compra_confirmada");
    expect(historico.at(-1)?.atorId).toBe(comprador.id);
  });

  it("notifica o solicitante por e-mail", async () => {
    const { solicitacao, comprador, solicitante } =
      await criarSolicitacaoComCompradorDesignado("cc5");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await confirmarCompra(solicitacao.id, comprador.id);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });

  it("não exige previsão de chegada quando o tipo de compra não exige", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("cc6");

    const confirmada = await confirmarCompra(solicitacao.id, comprador.id);

    expect(confirmada.status).toBe("COMPRA_CONFIRMADA");
    expect(confirmada.previsaoChegada).toBeNull();
  });

  it("exige previsão de chegada quando o tipo de compra exige (ex.: Mercado Livre)", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("cc7", {
      exigePrevisaoChegada: true,
    });

    await expect(confirmarCompra(solicitacao.id, comprador.id)).rejects.toThrow(
      /previsão de chegada/
    );
  });

  it("grava a previsão de chegada e avisa o solicitante dela por e-mail", async () => {
    const { solicitacao, comprador, solicitante } = await criarSolicitacaoComCompradorDesignado(
      "cc8",
      { exigePrevisaoChegada: true }
    );
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    const confirmada = await confirmarCompra(solicitacao.id, comprador.id, {
      previsaoChegada: "2026-09-30",
    });

    expect(confirmada.previsaoChegada?.toISOString().slice(0, 10)).toBe("2026-09-30");
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: solicitante.email,
        html: expect.stringContaining("Previsão de chegada"),
      })
    );
  });
});

// Input válido para enviarParaPagamento — a maioria dos testes só quer
// passar pela validação dos campos obrigatórios sem testar essa validação em
// si; os testes que testam essa validação sobrescrevem um campo por vez.
const INPUT_PAGAMENTO_VALIDO = {
  notaFiscalUrls: ["sol-teste/1700000000000-nota-fiscal.pdf"],
  metodoPagamento: "PIX" as const,
  dadosPagamento: "Chave PIX: 12345678900",
  fornecedorDocumento: "12.345.678/0001-99",
};

describe("workflow: enviarParaPagamento", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("envia para pagamento e transiciona para AGUARDANDO_PAGAMENTO", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep1");
    await confirmarCompra(solicitacao.id, comprador.id);

    const enviada = await enviarParaPagamento(
      solicitacao.id,
      comprador.id,
      INPUT_PAGAMENTO_VALIDO
    );

    expect(enviada.status).toBe("AGUARDANDO_PAGAMENTO");
  });

  it("grava nota fiscal, método de pagamento, dados de pagamento e CNPJ/CPF do fornecedor", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep1b");
    await confirmarCompra(solicitacao.id, comprador.id);

    const enviada = await enviarParaPagamento(
      solicitacao.id,
      comprador.id,
      INPUT_PAGAMENTO_VALIDO
    );

    expect(enviada.notaFiscalUrls).toEqual(INPUT_PAGAMENTO_VALIDO.notaFiscalUrls);
    expect(enviada.metodoPagamento).toBe("PIX");
    expect(enviada.dadosPagamento).toBe(INPUT_PAGAMENTO_VALIDO.dadosPagamento);
    expect(enviada.fornecedorDocumento).toBe(INPUT_PAGAMENTO_VALIDO.fornecedorDocumento);
  });

  it("grava mais de uma nota fiscal/comprovante quando mais de um arquivo é enviado", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep1c");
    await confirmarCompra(solicitacao.id, comprador.id);

    const enviada = await enviarParaPagamento(solicitacao.id, comprador.id, {
      ...INPUT_PAGAMENTO_VALIDO,
      notaFiscalUrls: ["ep1c/nota-fiscal.pdf", "ep1c/boleto.pdf"],
    });

    expect(enviada.notaFiscalUrls).toEqual(["ep1c/nota-fiscal.pdf", "ep1c/boleto.pdf"]);
  });

  it("lança erro se a nota fiscal não for informada", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep2");
    await confirmarCompra(solicitacao.id, comprador.id);

    await expect(
      enviarParaPagamento(solicitacao.id, comprador.id, {
        ...INPUT_PAGAMENTO_VALIDO,
        notaFiscalUrls: [],
      })
    ).rejects.toThrow();
  });

  it("lança erro se quem envia não é o comprador designado", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep3");
    await confirmarCompra(solicitacao.id, comprador.id);
    const outro = await criarUsuario("outro-ep3");

    await expect(
      enviarParaPagamento(solicitacao.id, outro.id, INPUT_PAGAMENTO_VALIDO)
    ).rejects.toThrow();
  });

  it("lança erro se a compra ainda não foi confirmada", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep4");

    await expect(
      enviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO)
    ).rejects.toThrow();
  });

  it("lança erro se o método de pagamento não for informado", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep4b");
    await confirmarCompra(solicitacao.id, comprador.id);

    await expect(
      enviarParaPagamento(solicitacao.id, comprador.id, {
        ...INPUT_PAGAMENTO_VALIDO,
        metodoPagamento: "" as never,
      })
    ).rejects.toThrow();
  });

  it("lança erro se os dados de pagamento não forem informados", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep4c");
    await confirmarCompra(solicitacao.id, comprador.id);

    await expect(
      enviarParaPagamento(solicitacao.id, comprador.id, {
        ...INPUT_PAGAMENTO_VALIDO,
        dadosPagamento: "  ",
      })
    ).rejects.toThrow();
  });

  it("lança erro se o CNPJ/CPF do fornecedor não for informado", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep4d");
    await confirmarCompra(solicitacao.id, comprador.id);

    await expect(
      enviarParaPagamento(solicitacao.id, comprador.id, {
        ...INPUT_PAGAMENTO_VALIDO,
        fornecedorDocumento: "  ",
      })
    ).rejects.toThrow();
  });

  it("grava um evento de histórico ao enviar para pagamento", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("ep5");
    await confirmarCompra(solicitacao.id, comprador.id);

    await enviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.at(-1)?.evento).toBe("enviado_para_pagamento");
    expect(historico.at(-1)?.atorId).toBe(comprador.id);
  });

  it("notifica o solicitante e a lista do Financeiro por e-mail", async () => {
    const { solicitacao, comprador, solicitante } =
      await criarSolicitacaoComCompradorDesignado("ep6");
    await confirmarCompra(solicitacao.id, comprador.id);
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await enviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO);

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: process.env.EMAIL_FINANCEIRO })
    );
  });

  it("lança erro se a solicitação está com pagamento recusado (usar reenviarParaPagamento)", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("ep7");
    const financeiro = await criarUsuario("fin-ep7");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await recusarPagamento(solicitacao.id, financeiro.id, "Nota fiscal ilegível");

    await expect(
      enviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO)
    ).rejects.toThrow();
  });

  it("notifica só o Financeiro (não o solicitante) quando o tipo de compra exige previsão de chegada", async () => {
    const { solicitacao, comprador, solicitante } = await criarSolicitacaoComCompradorDesignado(
      "ep8",
      { exigePrevisaoChegada: true }
    );
    await confirmarCompra(solicitacao.id, comprador.id, { previsaoChegada: "2026-09-30" });
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await enviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO);

    expect(enviarSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: process.env.EMAIL_FINANCEIRO })
    );
  });
});

describe("workflow: reenviarParaPagamento", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("reenvia a partir de PAGAMENTO_RECUSADO, limpando o motivo da recusa", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("rv1");
    const financeiro = await criarUsuario("fin-rv1");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await recusarPagamento(solicitacao.id, financeiro.id, "Nota fiscal ilegível");

    const reenviada = await reenviarParaPagamento(solicitacao.id, comprador.id, {
      ...INPUT_PAGAMENTO_VALIDO,
      notaFiscalUrls: ["rv1/nota-fiscal-corrigida.pdf"],
    });

    expect(reenviada.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(reenviada.motivoRecusaPagamento).toBeNull();
    expect(reenviada.notaFiscalUrls).toEqual(["rv1/nota-fiscal-corrigida.pdf"]);
  });

  it("lança erro se a solicitação não está com pagamento recusado", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("rv2");

    await expect(
      reenviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO)
    ).rejects.toThrow();
  });

  it("lança erro se quem reenvia não é o comprador designado", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("rv3");
    const financeiro = await criarUsuario("fin-rv3");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await recusarPagamento(solicitacao.id, financeiro.id, "Motivo qualquer");
    const outro = await criarUsuario("outro-rv3");

    await expect(
      reenviarParaPagamento(solicitacao.id, outro.id, INPUT_PAGAMENTO_VALIDO)
    ).rejects.toThrow();
  });

  it("grava um evento reenviado_para_pagamento no histórico", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("rv4");
    const financeiro = await criarUsuario("fin-rv4");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await recusarPagamento(solicitacao.id, financeiro.id, "Motivo qualquer");

    await reenviarParaPagamento(solicitacao.id, comprador.id, INPUT_PAGAMENTO_VALIDO);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.at(-1)?.evento).toBe("reenviado_para_pagamento");
    expect(historico.at(-1)?.atorId).toBe(comprador.id);
  });
});

describe("workflow: recusarPagamento", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("recusa o pagamento e transiciona para PAGAMENTO_RECUSADO", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("rp1");
    const financeiro = await criarUsuario("fin-rp1");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    const recusada = await recusarPagamento(solicitacao.id, financeiro.id, "Falta nota fiscal");

    expect(recusada.status).toBe("PAGAMENTO_RECUSADO");
    expect(recusada.motivoRecusaPagamento).toBe("Falta nota fiscal");
  });

  it("lança erro se o motivo estiver vazio", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("rp2");
    const financeiro = await criarUsuario("fin-rp2");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await expect(recusarPagamento(solicitacao.id, financeiro.id, "  ")).rejects.toThrow();
  });

  it("lança erro se quem recusa não é do Financeiro", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("rp3");
    const naoFinanceiro = await criarUsuario("naofin-rp3");

    await expect(
      recusarPagamento(solicitacao.id, naoFinanceiro.id, "Motivo qualquer")
    ).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aguardando pagamento", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("rp4");
    await confirmarCompra(solicitacao.id, comprador.id);
    const financeiro = await criarUsuario("fin-rp4");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await expect(
      recusarPagamento(solicitacao.id, financeiro.id, "Motivo qualquer")
    ).rejects.toThrow();
  });

  it("grava um evento de histórico com o motivo ao recusar", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("rp5");
    const financeiro = await criarUsuario("fin-rp5");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await recusarPagamento(solicitacao.id, financeiro.id, "Dados bancários incorretos");

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.at(-1)?.evento).toBe("pagamento_recusado");
    expect(historico.at(-1)?.atorId).toBe(financeiro.id);
    expect(historico.at(-1)?.detalhe).toBe("Dados bancários incorretos");
  });

  it("notifica o comprador designado por e-mail", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("rp6");
    const financeiro = await criarUsuario("fin-rp6");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await recusarPagamento(solicitacao.id, financeiro.id, "Motivo qualquer");

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: comprador.email })
    );
  });
});

describe("workflow: registrarPagamento", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("registra o pagamento e transiciona para PAGO", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("pg1");
    const financeiro = await criarUsuario("fin-pg1");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    const paga = await registrarPagamento(solicitacao.id, financeiro.id, {
      comprovantePagamentoUrl: "pg1/comprovante.pdf",
    });

    expect(paga.status).toBe("PAGO");
    expect(paga.comprovantePagamentoUrl).toBe("pg1/comprovante.pdf");
  });

  it("lança erro se o comprovante não for informado", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("pg2");
    const financeiro = await criarUsuario("fin-pg2");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await expect(
      registrarPagamento(solicitacao.id, financeiro.id, { comprovantePagamentoUrl: "  " })
    ).rejects.toThrow();
  });

  it("lança erro se quem registra não é do Financeiro", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("pg3");
    const naoFinanceiro = await criarUsuario("naofin-pg3");

    await expect(
      registrarPagamento(solicitacao.id, naoFinanceiro.id, {
        comprovantePagamentoUrl: "pg3/comprovante.pdf",
      })
    ).rejects.toThrow();
  });

  it("lança erro se a solicitação não está aguardando pagamento", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("pg4");
    await confirmarCompra(solicitacao.id, comprador.id);
    const financeiro = await criarUsuario("fin-pg4");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await expect(
      registrarPagamento(solicitacao.id, financeiro.id, {
        comprovantePagamentoUrl: "pg4/comprovante.pdf",
      })
    ).rejects.toThrow();
  });

  it("grava um evento de histórico ao registrar o pagamento", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("pg5");
    const financeiro = await criarUsuario("fin-pg5");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await registrarPagamento(solicitacao.id, financeiro.id, {
      comprovantePagamentoUrl: "pg5/comprovante.pdf",
    });

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.at(-1)?.evento).toBe("pago");
    expect(historico.at(-1)?.atorId).toBe(financeiro.id);
  });

  it("notifica o solicitante por e-mail", async () => {
    const { solicitacao, solicitante } = await criarSolicitacaoAguardandoPagamento("pg6");
    const financeiro = await criarUsuario("fin-pg6");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await registrarPagamento(solicitacao.id, financeiro.id, {
      comprovantePagamentoUrl: "pg6/comprovante.pdf",
    });

    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: solicitante.email })
    );
  });

  it("dispensa o comprovante quando o tipo de compra exige previsão de chegada (ex.: Mercado Livre)", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("pg7", {
      exigePrevisaoChegada: true,
    });
    const financeiro = await criarUsuario("fin-pg7");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    const paga = await registrarPagamento(solicitacao.id, financeiro.id, {});

    expect(paga.status).toBe("PAGO");
    expect(paga.comprovantePagamentoUrl).toBeNull();
  });

  it("continua exigindo o comprovante para tipos de compra que não exigem previsão de chegada", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("pg8");
    const financeiro = await criarUsuario("fin-pg8");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });

    await expect(registrarPagamento(solicitacao.id, financeiro.id, {})).rejects.toThrow(
      /comprovante/
    );
  });
});

describe("workflow: listarPendentesPagamento", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações aguardando pagamento", async () => {
    const { solicitacao } = await criarSolicitacaoAguardandoPagamento("lp1");

    const pendentes = await listarPendentesPagamento();

    expect(pendentes.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("não lista solicitações em outros status", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("lp2");
    await confirmarCompra(solicitacao.id, comprador.id);

    const pendentes = await listarPendentesPagamento();

    expect(pendentes).toHaveLength(0);
  });
});

describe("workflow: listarMinhasSolicitacoes", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações criadas pelo usuário, mais recente primeiro", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao: primeira, solicitante } = await criarSolicitacaoEnviada("ms1");
    const { solicitacao: segunda } = await criarSolicitacaoEnviada("ms2", {
      solicitanteId: solicitante.id,
    });

    const minhas = await listarMinhasSolicitacoes(solicitante.id);

    expect(minhas.map((s) => s.id)).toEqual([segunda.id, primeira.id]);
  });

  it("inclui rascunhos (não só solicitações enviadas)", async () => {
    const departamento = await criarDepartamento("ms3");
    const solicitante = await criarUsuario("sol-ms3");
    const tipo = await criarTipoCompra("Tipo ms3");
    const campos = await criarCamposObrigatorios("ms3");
    const rascunho = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Rascunho de teste",
      valor: "100",
      ...campos,
    });

    const minhas = await listarMinhasSolicitacoes(solicitante.id);

    expect(minhas.map((s) => s.id)).toEqual([rascunho.id]);
  });

  it("não lista solicitações de outro usuário", async () => {
    await criarFaixa("0", null, false);
    await criarSolicitacaoEnviada("ms4");
    const outro = await criarUsuario("outro-ms4");

    const minhas = await listarMinhasSolicitacoes(outro.id);

    expect(minhas).toHaveLength(0);
  });
});

describe("workflow: listarPendentesComprador", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações aprovadas aguardando confirmação de compra", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("pc1");

    const pendentes = await listarPendentesComprador(comprador.id);

    expect(pendentes.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("lista solicitações com compra confirmada aguardando envio para pagamento", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoComCompradorDesignado("pc2");
    await confirmarCompra(solicitacao.id, comprador.id);

    const pendentes = await listarPendentesComprador(comprador.id);

    expect(pendentes.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("lista solicitações com pagamento recusado aguardando reenvio", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("pc3");
    const financeiro = await criarUsuario("fin-pc3");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await recusarPagamento(solicitacao.id, financeiro.id, "Motivo qualquer");

    const pendentes = await listarPendentesComprador(comprador.id);

    expect(pendentes.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("não lista solicitações aguardando pagamento", async () => {
    const { comprador } = await criarSolicitacaoAguardandoPagamento("pc4");

    const pendentes = await listarPendentesComprador(comprador.id);

    expect(pendentes).toHaveLength(0);
  });

  it("não lista solicitações já pagas", async () => {
    const { solicitacao, comprador } = await criarSolicitacaoAguardandoPagamento("pc4b");
    const financeiro = await criarUsuario("fin-pc4b");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await registrarPagamento(solicitacao.id, financeiro.id, {
      comprovantePagamentoUrl: "pc4b/comprovante.pdf",
    });

    const pendentes = await listarPendentesComprador(comprador.id);

    expect(pendentes).toHaveLength(0);
  });

  it("não lista solicitações de outro comprador", async () => {
    await criarSolicitacaoComCompradorDesignado("pc5");
    const outro = await criarUsuario("outro-pc5");

    const pendentes = await listarPendentesComprador(outro.id);

    expect(pendentes).toHaveLength(0);
  });
});

describe("workflow: listarSolicitacoesParaExportar", () => {
  beforeEach(async () => {
    await resetDb();
    setEmailSender(new FakeEmailSender());
  });

  it("lista solicitações sem filtro nenhum", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao } = await criarSolicitacaoEnviada("ex1");

    const exportadas = await listarSolicitacoesParaExportar({});

    expect(exportadas.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("filtra por departamento", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, departamento } = await criarSolicitacaoEnviada("ex2");
    await criarSolicitacaoEnviada("ex2b");

    const exportadas = await listarSolicitacoesParaExportar({
      departamentoId: departamento.id,
    });

    expect(exportadas.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("filtra por status", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao } = await criarSolicitacaoEnviada("ex3");
    await criarSolicitacaoRejeitada("ex3b");

    const exportadas = await listarSolicitacoesParaExportar({
      status: "ENVIADO",
    });

    expect(exportadas.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("inclui solicitações criadas dentro do período informado", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao } = await criarSolicitacaoEnviada("ex4");

    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const exportadas = await listarSolicitacoesParaExportar({ de: ontem, ate: amanha });

    expect(exportadas.map((s) => s.id)).toEqual([solicitacao.id]);
  });

  it("exclui solicitações fora do período informado", async () => {
    await criarFaixa("0", null, false);
    await criarSolicitacaoEnviada("ex5");

    const semanaPassada = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const exportadas = await listarSolicitacoesParaExportar({
      de: semanaPassada,
      ate: ontem,
    });

    expect(exportadas).toHaveLength(0);
  });

  it("inclui o histórico completo, com o ator de cada evento", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, solicitante } = await criarSolicitacaoEnviada("ex6");

    const [exportada] = await listarSolicitacoesParaExportar({});

    expect(exportada.id).toBe(solicitacao.id);
    expect(exportada.historico.length).toBeGreaterThan(0);
    expect(exportada.historico[0]?.ator?.id).toBe(solicitante.id);
  });
});

// Encargos, taxas e outras despesas sem etapa de compra (ver DNI 0007:
// ENCARGOS, ANVISA, MOTOBOY) — a documentação e os dados de pagamento já
// chegam anexados na criação, então a aprovação final pula direto para
// AGUARDANDO_PAGAMENTO em vez de designação de comprador/confirmação de
// compra (ver enviarDiretoParaPagamento em src/lib/workflow.ts).
const CAMPOS_SEM_COMPRA = {
  semCompra: true as const,
  notaFiscalUrls: ["guia.pdf"],
  metodoPagamento: "PIX" as const,
  dadosPagamento: "Chave PIX: 12345678900",
  fornecedorDocumento: "12.345.678/0001-99",
};

// Cria uma solicitação sem compra já ENVIADO — mesmo papel que
// criarSolicitacaoEnviada, mas com os campos de semCompra desde a criação.
async function criarSolicitacaoSemCompraEnviada(
  sufixo: string,
  overrides: { solicitanteId?: string; responsavelId?: string; diretorId?: string; valor?: string } = {}
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
    descricao: "Pagamento de encargo",
    valor: overrides.valor ?? "500",
    ...campos,
    ...CAMPOS_SEM_COMPRA,
  });
  const solicitacao = await enviarSolicitacao(rascunho.id);
  return { solicitacao, departamento, solicitante };
}

describe("workflow: solicitação sem compra", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("exige documentação, método, dados de pagamento e CNPJ/CPF do fornecedor", async () => {
    const solicitante = await criarUsuario("sc1");
    const departamento = await criarDepartamento("sc1");
    const tipo = await criarTipoCompra("Tipo sc1");
    const campos = await criarCamposObrigatorios("sc1");
    const base = {
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Pagamento de encargo",
      valor: "500",
      ...campos,
      semCompra: true as const,
    };

    await expect(criarSolicitacao(base)).rejects.toThrow();
    await expect(
      criarSolicitacao({ ...base, notaFiscalUrls: ["guia.pdf"] })
    ).rejects.toThrow();
    await expect(
      criarSolicitacao({ ...base, notaFiscalUrls: ["guia.pdf"], metodoPagamento: "PIX" })
    ).rejects.toThrow();
    await expect(
      criarSolicitacao({
        ...base,
        notaFiscalUrls: ["guia.pdf"],
        metodoPagamento: "PIX",
        dadosPagamento: "Chave PIX: 123",
      })
    ).rejects.toThrow();
  });

  it("grava os campos de pagamento já na criação", async () => {
    const solicitante = await criarUsuario("sc2");
    const departamento = await criarDepartamento("sc2");
    const tipo = await criarTipoCompra("Tipo sc2");
    const campos = await criarCamposObrigatorios("sc2");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Pagamento de encargo",
      valor: "500",
      ...campos,
      ...CAMPOS_SEM_COMPRA,
    });

    expect(solicitacao.semCompra).toBe(true);
    expect(solicitacao.notaFiscalUrls).toEqual(["guia.pdf"]);
    expect(solicitacao.metodoPagamento).toBe("PIX");
    expect(solicitacao.fornecedorDocumento).toBe("12.345.678/0001-99");
  });

  it("não grava os campos de pagamento quando semCompra não é informado", async () => {
    const solicitante = await criarUsuario("sc3");
    const departamento = await criarDepartamento("sc3");
    const tipo = await criarTipoCompra("Tipo sc3");
    const campos = await criarCamposObrigatorios("sc3");

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Compra normal",
      valor: "500",
      ...campos,
      notaFiscalUrls: ["não deveria ser gravado"],
    });

    expect(solicitacao.semCompra).toBe(false);
    expect(solicitacao.notaFiscalUrls).toEqual([]);
  });

  it("ao ser aprovada (nível 1, sem exigir nível 2), pula direto para AGUARDANDO_PAGAMENTO sem designar comprador", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, departamento } = await criarSolicitacaoSemCompraEnviada("sc4");
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    expect(aprovada.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(aprovada.compradorId).toBeNull();
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: process.env.EMAIL_FINANCEIRO })
    );
  });

  it("ao ser aprovada com o envio pulando direto para aprovado, também vai direto para AGUARDANDO_PAGAMENTO", async () => {
    await criarFaixa("0", null, false);
    const pessoa = await criarUsuario("resp-sc5");
    const departamento = await criarDepartamento("sc5", {
      responsavelId: pessoa.id,
      diretorId: pessoa.id,
    });
    const tipo = await criarTipoCompra("Tipo sc5");
    const campos = await criarCamposObrigatorios("sc5");
    const rascunho = await criarSolicitacao({
      solicitanteId: pessoa.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Pagamento de encargo",
      valor: "500",
      ...campos,
      ...CAMPOS_SEM_COMPRA,
    });

    const enviada = await enviarSolicitacao(rascunho.id);

    expect(enviada.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(enviada.compradorId).toBeNull();
  });

  it("ao ser aprovada em nível 2, também pula direto para AGUARDANDO_PAGAMENTO", async () => {
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao, departamento } = await criarSolicitacaoSemCompraEnviada("sc6", {
      valor: "5000",
    });
    const aguardandoNivel2 = await aprovarNivel1(solicitacao.id, departamento.responsavelId);
    expect(aguardandoNivel2.status).toBe("AGUARDANDO_NIVEL2");

    const aprovada = await aprovarNivel2(aguardandoNivel2.id, departamento.diretorId);

    expect(aprovada.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(aprovada.compradorId).toBeNull();
  });

  it("registra um histórico direto de aprovado para enviado_para_pagamento", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, departamento } = await criarSolicitacaoSemCompraEnviada("sc7");

    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: aprovada.id },
      orderBy: { criadoEm: "asc" },
    });
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "enviado",
      "aprovado",
      "enviado_para_pagamento",
    ]);
  });

  it("permite ao solicitante (não a um comprador) corrigir e reenviar após recusa de pagamento", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, departamento, solicitante } =
      await criarSolicitacaoSemCompraEnviada("sc8");
    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);
    const financeiro = await criarUsuario("fin-sc8");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const recusada = await recusarPagamento(aprovada.id, financeiro.id, "Guia vencida");
    expect(recusada.status).toBe("PAGAMENTO_RECUSADO");

    const outraPessoa = await criarUsuario("outra-sc8");
    await expect(
      reenviarParaPagamento(recusada.id, outraPessoa.id, {
        notaFiscalUrls: ["guia-nova.pdf"],
        metodoPagamento: "PIX",
        dadosPagamento: "Chave PIX: nova",
        fornecedorDocumento: "12.345.678/0001-99",
      })
    ).rejects.toThrow();

    const reenviada = await reenviarParaPagamento(recusada.id, solicitante.id, {
      notaFiscalUrls: ["guia-nova.pdf"],
      metodoPagamento: "PIX",
      dadosPagamento: "Chave PIX: nova",
      fornecedorDocumento: "12.345.678/0001-99",
    });
    expect(reenviada.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(reenviada.notaFiscalUrls).toEqual(["guia-nova.pdf"]);
  });

  it("lista para o solicitante, em listarPendentesComprador, uma solicitação sem compra recusada", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, departamento, solicitante } =
      await criarSolicitacaoSemCompraEnviada("sc9");
    const aprovada = await aprovarNivel1(solicitacao.id, departamento.responsavelId);
    const financeiro = await criarUsuario("fin-sc9");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    await recusarPagamento(aprovada.id, financeiro.id, "Guia vencida");

    const pendentes = await listarPendentesComprador(solicitante.id);

    expect(pendentes.map((s) => s.id)).toEqual([aprovada.id]);
  });
});

// Salários, encargos, benefícios, taxas etc. (ver TipoCompra.despesaPessoal)
// — formulário reduzido, sem aprovação nem etapa de compra, direto para
// AGUARDANDO_PAGAMENTO. Mesmo papel que criarSolicitacaoSemCompraEnviada,
// mas para esse tipo de compra.
async function criarSolicitacaoDespesaPessoalEnviada(
  sufixo: string,
  overrides: { solicitanteId?: string; responsavelId?: string; diretorId?: string; valor?: string } = {}
) {
  const departamento = await criarDepartamento(sufixo, {
    responsavelId: overrides.responsavelId,
    diretorId: overrides.diretorId,
  });
  const solicitante = overrides.solicitanteId
    ? await testDb.usuario.findUniqueOrThrow({ where: { id: overrides.solicitanteId } })
    : await criarUsuario(`sol-dp-${sufixo}`);
  const tipo = await criarTipoCompra(`Despesa Pessoal ${sufixo}`, { despesaPessoal: true });
  const categoria = await testDb.categoriaDespesaPessoal.create({
    data: { nome: `Categoria ${sufixo}` },
  });
  const empresa = await testDb.empresa.create({ data: { nome: `Empresa dp ${sufixo}` } });
  const rascunho = await criarSolicitacao({
    solicitanteId: solicitante.id,
    departamentoId: departamento.id,
    tipoCompraId: tipo.id,
    descricao: "Vale-transporte",
    valor: overrides.valor ?? "500",
    fornecedor: "Fornecedor Teste",
    empresaId: empresa.id,
    categoriaDespesaPessoalId: categoria.id,
    dataVencimento: "2026-09-30",
    notaFiscalUrls: ["guia.pdf"],
  });
  const solicitacao = await enviarSolicitacao(rascunho.id);
  return { solicitacao, departamento, solicitante, tipo, categoria };
}

describe("workflow: despesa de pessoal", () => {
  let fake: FakeEmailSender;

  beforeEach(async () => {
    await resetDb();
    fake = new FakeEmailSender();
    setEmailSender(fake);
  });

  it("exige categoria, data de vencimento e ao menos um anexo", async () => {
    const solicitante = await criarUsuario("dp1");
    const departamento = await criarDepartamento("dp1");
    const tipo = await criarTipoCompra("Despesa Pessoal dp1", { despesaPessoal: true });
    const empresa = await testDb.empresa.create({ data: { nome: "Empresa dp1" } });
    const base = {
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Vale-transporte",
      valor: "500",
      fornecedor: "Fornecedor Teste",
      empresaId: empresa.id,
    };

    await expect(criarSolicitacao(base)).rejects.toThrow(/categoria/);
    await expect(
      criarSolicitacao({ ...base, categoriaDespesaPessoalId: "categoria-x" })
    ).rejects.toThrow(/vencimento/);
    await expect(
      criarSolicitacao({
        ...base,
        categoriaDespesaPessoalId: "categoria-x",
        dataVencimento: "2026-09-30",
      })
    ).rejects.toThrow(/anexo/);
  });

  it("não exige os campos padrão (centro de custo, resultado, conta contábil, forma de pagamento)", async () => {
    const solicitante = await criarUsuario("dp2");
    const departamento = await criarDepartamento("dp2");
    const tipo = await criarTipoCompra("Despesa Pessoal dp2", { despesaPessoal: true });
    const categoria = await testDb.categoriaDespesaPessoal.create({
      data: { nome: "Categoria dp2" },
    });
    const empresa = await testDb.empresa.create({ data: { nome: "Empresa dp2" } });

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Vale-transporte",
      valor: "500",
      fornecedor: "Fornecedor Teste",
      empresaId: empresa.id,
      categoriaDespesaPessoalId: categoria.id,
      dataVencimento: "2026-09-30",
      notaFiscalUrls: ["guia.pdf"],
    });

    expect(solicitacao.centroCustoId).toBeNull();
    expect(solicitacao.centroResultadoId).toBeNull();
    expect(solicitacao.contaContabilId).toBeNull();
    expect(solicitacao.formaPagamento).toBeNull();
    expect(solicitacao.semCompra).toBe(true);
    expect(solicitacao.categoriaDespesaPessoalId).toBe(categoria.id);
    expect(solicitacao.notaFiscalUrls).toEqual(["guia.pdf"]);
  });

  it("grava nº do pedido e dados de pagamento, ambos opcionais, e mantém método/CNPJ-CPF nulos", async () => {
    const solicitante = await criarUsuario("dp3");
    const departamento = await criarDepartamento("dp3");
    const tipo = await criarTipoCompra("Despesa Pessoal dp3", { despesaPessoal: true });
    const categoria = await testDb.categoriaDespesaPessoal.create({
      data: { nome: "Categoria dp3" },
    });
    const empresa = await testDb.empresa.create({ data: { nome: "Empresa dp3" } });

    const solicitacao = await criarSolicitacao({
      solicitanteId: solicitante.id,
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      descricao: "Vale-transporte",
      valor: "500",
      fornecedor: "Fornecedor Teste",
      empresaId: empresa.id,
      categoriaDespesaPessoalId: categoria.id,
      dataVencimento: "2026-09-30",
      notaFiscalUrls: ["guia.pdf"],
      numeroPedido: "PED-123",
      dadosPagamento: "Chave PIX: 123",
    });

    expect(solicitacao.numeroPedido).toBe("PED-123");
    expect(solicitacao.dadosPagamento).toBe("Chave PIX: 123");
    expect(solicitacao.metodoPagamento).toBeNull();
    expect(solicitacao.fornecedorDocumento).toBeNull();
  });

  it("pula aprovação e vai direto para AGUARDANDO_PAGAMENTO, mesmo quando o solicitante não é o responsável e o valor exigiria nível 2", async () => {
    await criarFaixa("0", "1000", false);
    await criarFaixa("1000.01", null, true);
    const { solicitacao } = await criarSolicitacaoDespesaPessoalEnviada("dp4", { valor: "5000" });

    expect(solicitacao.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(solicitacao.compradorId).toBeNull();
  });

  it("registra um histórico direto de aprovado para enviado_para_pagamento, sem nenhuma etapa de aprovação", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao } = await criarSolicitacaoDespesaPessoalEnviada("dp5");

    const historico = await testDb.solicitacaoHistorico.findMany({
      where: { solicitacaoId: solicitacao.id },
      orderBy: { criadoEm: "asc" },
    });
    // Diferente de "sem compra" (que ainda passa por ENVIADO antes de
    // auto-aprovar), despesa de pessoal pula ENVIADO por completo — o
    // próprio resolverEstadoInicial já resolve para APROVADO no envio.
    expect(historico.map((h) => h.evento)).toEqual([
      "rascunho_criado",
      "aprovado",
      "enviado_para_pagamento",
    ]);
  });

  it("notifica o Financeiro ao ser enviada, nunca um responsável/diretor para aprovação", async () => {
    await criarFaixa("0", null, false);
    const enviarSpy = vi.spyOn(fake, "send");
    enviarSpy.mockClear();

    await criarSolicitacaoDespesaPessoalEnviada("dp6");

    expect(enviarSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("aguardando sua aprovação") })
    );
    expect(enviarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: process.env.EMAIL_FINANCEIRO })
    );
  });

  it("permite ao solicitante corrigir e reenviar após recusa de pagamento, sem exigir método de pagamento nem CNPJ/CPF do fornecedor", async () => {
    await criarFaixa("0", null, false);
    const { solicitacao, solicitante } = await criarSolicitacaoDespesaPessoalEnviada("dp7");
    const financeiro = await criarUsuario("fin-dp7");
    await testDb.usuario.update({ where: { id: financeiro.id }, data: { flagFinanceiro: true } });
    const recusada = await recusarPagamento(solicitacao.id, financeiro.id, "Guia vencida");
    expect(recusada.status).toBe("PAGAMENTO_RECUSADO");

    const reenviada = await reenviarParaPagamento(recusada.id, solicitante.id, {
      notaFiscalUrls: ["guia-nova.pdf"],
    });

    expect(reenviada.status).toBe("AGUARDANDO_PAGAMENTO");
    expect(reenviada.notaFiscalUrls).toEqual(["guia-nova.pdf"]);
    expect(reenviada.metodoPagamento).toBeNull();
    expect(reenviada.fornecedorDocumento).toBeNull();
  });
});
