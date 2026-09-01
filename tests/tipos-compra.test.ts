import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import {
  atualizarTipoCompra,
  criarTipoCompra,
  excluirTipoCompra,
  listarTiposCompra,
  obterTipoCompra,
} from "@/lib/tipos-compra";
import { criarEntradaMatriz } from "@/lib/matriz-comprador";

describe("tipos de compra", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("cria um tipo de compra", async () => {
    const tipo = await criarTipoCompra({ nome: "Compras no Mercado Livre" });
    expect(tipo.nome).toBe("Compras no Mercado Livre");
  });

  it("rejeita um nome vazio", async () => {
    await expect(criarTipoCompra({ nome: "" })).rejects.toThrow();
    await expect(criarTipoCompra({ nome: "   " })).rejects.toThrow();
  });

  it("rejeita um nome duplicado", async () => {
    await criarTipoCompra({ nome: "Serviços" });
    await expect(criarTipoCompra({ nome: "Serviços" })).rejects.toThrow();
  });

  it("lista os tipos de compra ordenados por nome", async () => {
    await criarTipoCompra({ nome: "Zebra" });
    await criarTipoCompra({ nome: "Alfa" });

    const tipos = await listarTiposCompra();

    expect(tipos.map((t) => t.nome)).toEqual(["Alfa", "Zebra"]);
  });

  it("atualiza um tipo de compra", async () => {
    const tipo = await criarTipoCompra({ nome: "Nome antigo" });

    const atualizado = await atualizarTipoCompra(tipo.id, { nome: "Nome novo" });

    expect(atualizado.nome).toBe("Nome novo");
  });

  it("cria com compradorEhSolicitante false por padrão", async () => {
    const tipo = await criarTipoCompra({ nome: "Padrão" });
    expect(tipo.compradorEhSolicitante).toBe(false);
  });

  it("cria e atualiza compradorEhSolicitante", async () => {
    const tipo = await criarTipoCompra({
      nome: "Serviços por departamento",
      compradorEhSolicitante: true,
    });
    expect(tipo.compradorEhSolicitante).toBe(true);

    const atualizado = await atualizarTipoCompra(tipo.id, {
      nome: tipo.nome,
      compradorEhSolicitante: false,
    });
    expect(atualizado.compradorEhSolicitante).toBe(false);
  });

  it("cria com despesaPessoal false por padrão", async () => {
    const tipo = await criarTipoCompra({ nome: "Padrão dp" });
    expect(tipo.despesaPessoal).toBe(false);
  });

  it("cria e atualiza despesaPessoal", async () => {
    const tipo = await criarTipoCompra({
      nome: "Despesa de Pessoal teste",
      despesaPessoal: true,
    });
    expect(tipo.despesaPessoal).toBe(true);

    const atualizado = await atualizarTipoCompra(tipo.id, {
      nome: tipo.nome,
      despesaPessoal: false,
    });
    expect(atualizado.despesaPessoal).toBe(false);
  });

  it("cria com exigePrevisaoChegada false por padrão", async () => {
    const tipo = await criarTipoCompra({ nome: "Padrão epc" });
    expect(tipo.exigePrevisaoChegada).toBe(false);
  });

  it("cria e atualiza exigePrevisaoChegada", async () => {
    const tipo = await criarTipoCompra({
      nome: "Mercado Livre teste",
      exigePrevisaoChegada: true,
    });
    expect(tipo.exigePrevisaoChegada).toBe(true);

    const atualizado = await atualizarTipoCompra(tipo.id, {
      nome: tipo.nome,
      exigePrevisaoChegada: false,
    });
    expect(atualizado.exigePrevisaoChegada).toBe(false);
  });

  it("cria com dispensaFornecedorForma false e sem empresa fixa por padrão", async () => {
    const tipo = await criarTipoCompra({ nome: "Padrão dff" });
    expect(tipo.dispensaFornecedorForma).toBe(false);
    expect(tipo.empresaFixaId).toBeNull();
  });

  it("cria e atualiza dispensaFornecedorForma e empresaFixaId", async () => {
    const empresa = await testDb.empresa.create({ data: { nome: "SMELL teste" } });

    const tipo = await criarTipoCompra({
      nome: "Mercado Livre dff",
      dispensaFornecedorForma: true,
      empresaFixaId: empresa.id,
    });
    expect(tipo.dispensaFornecedorForma).toBe(true);
    expect(tipo.empresaFixaId).toBe(empresa.id);

    const atualizado = await atualizarTipoCompra(tipo.id, {
      nome: tipo.nome,
      dispensaFornecedorForma: false,
      empresaFixaId: null,
    });
    expect(atualizado.dispensaFornecedorForma).toBe(false);
    expect(atualizado.empresaFixaId).toBeNull();
  });

  it("exclui um tipo de compra", async () => {
    const tipo = await criarTipoCompra({ nome: "Descartável" });

    await excluirTipoCompra(tipo.id);

    expect(await obterTipoCompra(tipo.id)).toBeNull();
  });

  it("não permite excluir um tipo de compra em uso na matriz de comprador", async () => {
    const tipo = await criarTipoCompra({ nome: "Em uso" });
    const responsavel = await testDb.usuario.create({
      data: { nome: "Resp", email: "resp@empresa.com.br", idEntra: "resp" },
    });
    const diretor = await testDb.usuario.create({
      data: { nome: "Dir", email: "dir@empresa.com.br", idEntra: "dir" },
    });
    const comprador = await testDb.usuario.create({
      data: { nome: "Comp", email: "comp@empresa.com.br", idEntra: "comp" },
    });
    const departamento = await testDb.departamento.create({
      data: { nome: "Compras", responsavelId: responsavel.id, diretorId: diretor.id },
    });
    await criarEntradaMatriz({
      departamentoId: departamento.id,
      tipoCompraId: tipo.id,
      compradorId: comprador.id,
    });

    await expect(excluirTipoCompra(tipo.id)).rejects.toThrow(/em uso/);
    expect(await obterTipoCompra(tipo.id)).not.toBeNull();
  });
});
