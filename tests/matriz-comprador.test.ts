import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import {
  atualizarEntradaMatriz,
  criarEntradaMatriz,
  excluirEntradaMatriz,
  listarMatrizComprador,
  obterEntradaMatriz,
} from "@/lib/matriz-comprador";

async function criarUsuario(sufixo: string) {
  return testDb.usuario.create({
    data: {
      nome: `Usuário ${sufixo}`,
      email: `usuario-${sufixo}@empresa.com.br`,
      idEntra: `entra-${sufixo}`,
    },
  });
}

async function criarDepartamento(sufixo: string) {
  const responsavel = await criarUsuario(`resp-${sufixo}`);
  const diretor = await criarUsuario(`dir-${sufixo}`);
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

describe("matriz de comprador", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("cria uma entrada na matriz", async () => {
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const comprador = await criarUsuario("comprador");

    const entrada = await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: comprador.id,
    });

    expect(entrada.compradorId).toBe(comprador.id);
  });

  it("não permite duas entradas para a mesma combinação departamento + tipo de compra", async () => {
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const compradorA = await criarUsuario("a");
    const compradorB = await criarUsuario("b");

    await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: compradorA.id,
    });

    await expect(
      criarEntradaMatriz({
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        compradorId: compradorB.id,
      })
    ).rejects.toThrow();
  });

  it("permite a mesma combinação de tipo de compra em departamentos diferentes", async () => {
    const departamentoA = await criarDepartamento("mkt");
    const departamentoB = await criarDepartamento("vendas");
    const tipo = await criarTipoCompra("Mercado Livre");
    const comprador = await criarUsuario("comprador");

    await criarEntradaMatriz({
      departamentoId: departamentoA.id,
      tipoCompraId: tipo.id,
      compradorId: comprador.id,
    });

    await expect(
      criarEntradaMatriz({
        departamentoId: departamentoB.id,
        tipoCompraId: tipo.id,
        compradorId: comprador.id,
      })
    ).resolves.toBeTruthy();
  });

  it("qualquer funcionário pode ser designado como comprador, não só de compras", async () => {
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    // O próprio responsável do departamento também pode ser o comprador.
    const comprador = await testDb.usuario.findUniqueOrThrow({
      where: { id: departamento.responsavelId },
    });

    const entrada = await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: comprador.id,
    });

    expect(entrada.compradorId).toBe(comprador.id);
  });

  it("lista entradas com os nomes de departamento, tipo e comprador", async () => {
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const comprador = await criarUsuario("comprador");
    await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: comprador.id,
    });

    const entradas = await listarMatrizComprador();

    expect(entradas).toHaveLength(1);
    expect(entradas[0].departamento.nome).toBe(departamento.nome);
    expect(entradas[0].tipoCompra.nome).toBe(tipo.nome);
    expect(entradas[0].comprador.nome).toBe(comprador.nome);
  });

  it("atualiza o comprador de uma entrada existente", async () => {
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const compradorA = await criarUsuario("a");
    const compradorB = await criarUsuario("b");
    const entrada = await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: compradorA.id,
    });

    const atualizada = await atualizarEntradaMatriz(entrada.id, {
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: compradorB.id,
    });

    expect(atualizada.compradorId).toBe(compradorB.id);
  });

  it("exclui uma entrada da matriz", async () => {
    const departamento = await criarDepartamento("mkt");
    const tipo = await criarTipoCompra("Mercado Livre");
    const comprador = await criarUsuario("comprador");
    const entrada = await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: comprador.id,
    });

    await excluirEntradaMatriz(entrada.id);

    expect(await obterEntradaMatriz(entrada.id)).toBeNull();
  });
});
