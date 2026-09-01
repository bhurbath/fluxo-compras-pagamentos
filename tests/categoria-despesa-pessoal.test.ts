import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import {
  atualizarCategoriaDespesaPessoal,
  criarCategoriaDespesaPessoal,
  excluirCategoriaDespesaPessoal,
  listarCategoriasDespesaPessoal,
  obterCategoriaDespesaPessoal,
} from "@/lib/categoria-despesa-pessoal";

describe("categorias de despesa de pessoal", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("cria uma categoria", async () => {
    const categoria = await criarCategoriaDespesaPessoal({ nome: "Salários" });
    expect(categoria.nome).toBe("Salários");
  });

  it("rejeita um nome vazio", async () => {
    await expect(criarCategoriaDespesaPessoal({ nome: "" })).rejects.toThrow();
    await expect(criarCategoriaDespesaPessoal({ nome: "   " })).rejects.toThrow();
  });

  it("rejeita um nome duplicado", async () => {
    await criarCategoriaDespesaPessoal({ nome: "Férias" });
    await expect(criarCategoriaDespesaPessoal({ nome: "Férias" })).rejects.toThrow();
  });

  it("lista as categorias ordenadas por nome", async () => {
    await criarCategoriaDespesaPessoal({ nome: "Zebra" });
    await criarCategoriaDespesaPessoal({ nome: "Alfa" });

    const categorias = await listarCategoriasDespesaPessoal();

    expect(categorias.map((c) => c.nome)).toEqual(["Alfa", "Zebra"]);
  });

  it("atualiza uma categoria", async () => {
    const categoria = await criarCategoriaDespesaPessoal({ nome: "Nome antigo" });

    const atualizada = await atualizarCategoriaDespesaPessoal(categoria.id, {
      nome: "Nome novo",
    });

    expect(atualizada.nome).toBe("Nome novo");
  });

  it("exclui uma categoria", async () => {
    const categoria = await criarCategoriaDespesaPessoal({ nome: "Descartável" });

    await excluirCategoriaDespesaPessoal(categoria.id);

    expect(await obterCategoriaDespesaPessoal(categoria.id)).toBeNull();
  });

  it("não permite excluir uma categoria em uso em alguma solicitação", async () => {
    const categoria = await criarCategoriaDespesaPessoal({ nome: "Em uso" });
    const responsavel = await testDb.usuario.create({
      data: { nome: "Resp", email: "resp-cdp@empresa.com.br", idEntra: "resp-cdp" },
    });
    const diretor = await testDb.usuario.create({
      data: { nome: "Dir", email: "dir-cdp@empresa.com.br", idEntra: "dir-cdp" },
    });
    const departamento = await testDb.departamento.create({
      data: { nome: "Depto CDP", responsavelId: responsavel.id, diretorId: diretor.id },
    });
    const tipo = await testDb.tipoCompra.create({
      data: { nome: "Despesa de Pessoal CDP", despesaPessoal: true },
    });
    const empresa = await testDb.empresa.create({ data: { nome: "Empresa CDP" } });
    await testDb.solicitacao.create({
      data: {
        solicitanteId: responsavel.id,
        departamentoId: departamento.id,
        tipoCompraId: tipo.id,
        descricao: "Vale-transporte",
        valor: "500",
        fornecedor: "Fornecedor CDP",
        empresaId: empresa.id,
        semCompra: true,
        categoriaDespesaPessoalId: categoria.id,
        dataVencimento: new Date(),
      },
    });

    await expect(excluirCategoriaDespesaPessoal(categoria.id)).rejects.toThrow(/em uso/);
    expect(await obterCategoriaDespesaPessoal(categoria.id)).not.toBeNull();
  });
});
