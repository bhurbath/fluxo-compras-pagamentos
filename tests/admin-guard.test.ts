import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb, testDb } from "./helpers/db";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const {
  getFinanceiroUsuario,
  requireFinanceiro,
  withFinanceiro,
} = await import("@/lib/admin/guard");

describe("admin guard", () => {
  beforeEach(async () => {
    await resetDb();
    mockAuth.mockReset();
  });

  it("nega acesso quando não há sessão", async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getFinanceiroUsuario()).toBeNull();
  });

  it("nega acesso para usuário autenticado sem a flag Financeiro", async () => {
    const usuario = await testDb.usuario.create({
      data: { nome: "Sem Acesso", email: "sem-acesso@empresa.com.br", idEntra: "sem-acesso" },
    });
    mockAuth.mockResolvedValue({ user: { id: usuario.id } });

    expect(await getFinanceiroUsuario()).toBeNull();
  });

  it("concede acesso para usuário com a flag Financeiro", async () => {
    const usuario = await testDb.usuario.create({
      data: {
        nome: "Financeiro",
        email: "financeiro@empresa.com.br",
        idEntra: "financeiro",
        flagFinanceiro: true,
      },
    });
    mockAuth.mockResolvedValue({ user: { id: usuario.id } });

    const resultado = await getFinanceiroUsuario();
    expect(resultado?.id).toBe(usuario.id);
  });

  it("requireFinanceiro lança erro quando o acesso é negado", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireFinanceiro()).rejects.toThrow();
  });

  it("withFinanceiro não executa o handler quando o acesso é negado", async () => {
    mockAuth.mockResolvedValue(null);
    const handler = vi.fn();
    const acaoProtegida = withFinanceiro(handler);

    await expect(acaoProtegida()).rejects.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it("withFinanceiro executa o handler com o usuário quando autorizado", async () => {
    const usuario = await testDb.usuario.create({
      data: {
        nome: "Financeiro",
        email: "financeiro2@empresa.com.br",
        idEntra: "financeiro2",
        flagFinanceiro: true,
      },
    });
    mockAuth.mockResolvedValue({ user: { id: usuario.id } });
    const handler = vi.fn().mockResolvedValue(undefined);
    const acaoProtegida = withFinanceiro(handler);

    await acaoProtegida("argumento-extra");

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ id: usuario.id }),
      "argumento-extra"
    );
  });
});
