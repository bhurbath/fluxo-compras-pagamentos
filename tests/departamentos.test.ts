import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, testDb } from "./helpers/db";
import {
  atribuirDepartamento,
  atualizarDepartamento,
  criarDepartamento,
  listarDepartamentos,
  listarFuncionarios,
  obterDepartamento,
} from "@/lib/departamentos";

async function criarUsuario(sufixo: string) {
  return testDb.usuario.create({
    data: {
      nome: `Funcionário ${sufixo}`,
      email: `funcionario-${sufixo}@empresa.com.br`,
      idEntra: `entra-${sufixo}`,
    },
  });
}

describe("departamentos", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("cria um departamento com responsável e diretor", async () => {
    const responsavel = await criarUsuario("resp");
    const diretor = await criarUsuario("dir");

    const departamento = await criarDepartamento({
      nome: "Marketing",
      responsavelId: responsavel.id,
      diretorId: diretor.id,
    });

    expect(departamento.nome).toBe("Marketing");
    expect(departamento.responsavelId).toBe(responsavel.id);
    expect(departamento.diretorId).toBe(diretor.id);
  });

  it("não permite criar um departamento sem responsável ou diretor válidos", async () => {
    const responsavel = await criarUsuario("resp");

    await expect(
      criarDepartamento({
        nome: "Financeiro",
        responsavelId: responsavel.id,
        diretorId: "id-inexistente",
      })
    ).rejects.toThrow();
  });

  it("não permite que o responsável e o diretor sejam a mesma pessoa", async () => {
    const pessoa = await criarUsuario("mesma-pessoa");

    await expect(
      criarDepartamento({
        nome: "Vendas",
        responsavelId: pessoa.id,
        diretorId: pessoa.id,
      })
    ).rejects.toThrow(/mesma pessoa/);
  });

  it("permite o mesmo diretor em múltiplos departamentos", async () => {
    const respMarketing = await criarUsuario("resp-mkt");
    const respVendas = await criarUsuario("resp-vendas");
    const diretor = await criarUsuario("dir-geral");

    const marketing = await criarDepartamento({
      nome: "Marketing",
      responsavelId: respMarketing.id,
      diretorId: diretor.id,
    });
    const vendas = await criarDepartamento({
      nome: "Vendas",
      responsavelId: respVendas.id,
      diretorId: diretor.id,
    });

    expect(marketing.diretorId).toBe(diretor.id);
    expect(vendas.diretorId).toBe(diretor.id);
  });

  it("lista departamentos com o nome do responsável e do diretor", async () => {
    const responsavel = await criarUsuario("resp");
    const diretor = await criarUsuario("dir");
    await criarDepartamento({
      nome: "Marketing",
      responsavelId: responsavel.id,
      diretorId: diretor.id,
    });

    const departamentos = await listarDepartamentos();

    expect(departamentos).toHaveLength(1);
    expect(departamentos[0].responsavel.nome).toBe(responsavel.nome);
    expect(departamentos[0].diretor.nome).toBe(diretor.nome);
  });

  it("atualiza nome, responsável e diretor de um departamento existente", async () => {
    const responsavel = await criarUsuario("resp");
    const diretor = await criarUsuario("dir");
    const novoResponsavel = await criarUsuario("resp2");
    const departamento = await criarDepartamento({
      nome: "Marketing",
      responsavelId: responsavel.id,
      diretorId: diretor.id,
    });

    const atualizado = await atualizarDepartamento(departamento.id, {
      nome: "Marketing Digital",
      responsavelId: novoResponsavel.id,
      diretorId: diretor.id,
    });

    expect(atualizado.nome).toBe("Marketing Digital");
    expect(atualizado.responsavelId).toBe(novoResponsavel.id);
  });

  it("atribui um funcionário a um departamento", async () => {
    const responsavel = await criarUsuario("resp");
    const diretor = await criarUsuario("dir");
    const funcionario = await criarUsuario("func");
    const departamento = await criarDepartamento({
      nome: "Marketing",
      responsavelId: responsavel.id,
      diretorId: diretor.id,
    });

    const atualizado = await atribuirDepartamento(funcionario.id, departamento.id);

    expect(atualizado.departamentoId).toBe(departamento.id);
  });

  it("permite remover a atribuição de departamento de um funcionário", async () => {
    const responsavel = await criarUsuario("resp");
    const diretor = await criarUsuario("dir");
    const funcionario = await criarUsuario("func");
    const departamento = await criarDepartamento({
      nome: "Marketing",
      responsavelId: responsavel.id,
      diretorId: diretor.id,
    });
    await atribuirDepartamento(funcionario.id, departamento.id);

    const atualizado = await atribuirDepartamento(funcionario.id, null);

    expect(atualizado.departamentoId).toBeNull();
  });

  it("lista todos os funcionários", async () => {
    await criarUsuario("a");
    await criarUsuario("b");

    const funcionarios = await listarFuncionarios();

    expect(funcionarios).toHaveLength(2);
  });

  it("retorna null ao buscar um departamento inexistente", async () => {
    const departamento = await obterDepartamento("id-inexistente");
    expect(departamento).toBeNull();
  });
});
