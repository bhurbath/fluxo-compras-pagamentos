import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb, testDb } from "./helpers/db";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { getGestorUsuario, listarDepartamentosGeridos } = await import("@/lib/gestor");

async function criarUsuario(sufixo: string) {
  return testDb.usuario.create({
    data: {
      nome: `Usuário ${sufixo}`,
      email: `usuario-${sufixo}@empresa.com.br`,
      idEntra: `entra-${sufixo}`,
    },
  });
}

describe("gestor de departamento", () => {
  beforeEach(async () => {
    await resetDb();
    mockAuth.mockReset();
  });

  it("listarDepartamentosGeridos traz os departamentos onde é responsável", async () => {
    const responsavel = await criarUsuario("resp");
    const diretor = await criarUsuario("dir");
    const departamento = await testDb.departamento.create({
      data: { nome: "Marketing", responsavelId: responsavel.id, diretorId: diretor.id },
    });

    const geridos = await listarDepartamentosGeridos(responsavel.id);

    expect(geridos.map((d) => d.id)).toEqual([departamento.id]);
  });

  it("listarDepartamentosGeridos traz os departamentos onde é diretor", async () => {
    const responsavel = await criarUsuario("resp2");
    const diretor = await criarUsuario("dir2");
    const departamento = await testDb.departamento.create({
      data: { nome: "Vendas", responsavelId: responsavel.id, diretorId: diretor.id },
    });

    const geridos = await listarDepartamentosGeridos(diretor.id);

    expect(geridos.map((d) => d.id)).toEqual([departamento.id]);
  });

  it("listarDepartamentosGeridos traz múltiplos departamentos da mesma pessoa", async () => {
    const respMarketing = await criarUsuario("resp-mkt");
    const respVendas = await criarUsuario("resp-vendas");
    const diretorGeral = await criarUsuario("dir-geral");
    const marketing = await testDb.departamento.create({
      data: { nome: "Marketing", responsavelId: respMarketing.id, diretorId: diretorGeral.id },
    });
    const vendas = await testDb.departamento.create({
      data: { nome: "Vendas", responsavelId: respVendas.id, diretorId: diretorGeral.id },
    });

    const geridos = await listarDepartamentosGeridos(diretorGeral.id);

    expect(geridos.map((d) => d.id).sort()).toEqual([marketing.id, vendas.id].sort());
  });

  it("listarDepartamentosGeridos retorna vazio para quem não gerencia nenhum departamento", async () => {
    const funcionario = await criarUsuario("comum");

    const geridos = await listarDepartamentosGeridos(funcionario.id);

    expect(geridos).toEqual([]);
  });

  it("getGestorUsuario retorna null quando não há sessão", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getGestorUsuario()).toBeNull();
  });

  it("getGestorUsuario retorna null para quem não gerencia nenhum departamento", async () => {
    const funcionario = await criarUsuario("sem-depto");
    mockAuth.mockResolvedValue({ user: { id: funcionario.id } });

    expect(await getGestorUsuario()).toBeNull();
  });

  it("getGestorUsuario retorna o usuário e os departamentos que gerencia", async () => {
    const responsavel = await criarUsuario("resp3");
    const diretor = await criarUsuario("dir3");
    const departamento = await testDb.departamento.create({
      data: { nome: "Produção", responsavelId: responsavel.id, diretorId: diretor.id },
    });
    mockAuth.mockResolvedValue({ user: { id: responsavel.id } });

    const resultado = await getGestorUsuario();

    expect(resultado?.usuario.id).toBe(responsavel.id);
    expect(resultado?.departamentos.map((d) => d.id)).toEqual([departamento.id]);
  });
});
