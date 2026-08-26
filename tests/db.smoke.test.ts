import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { resetDb, testDb } from "./helpers/db";

describe("infraestrutura de banco de dados", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("persiste e lê um usuário no Postgres real", async () => {
    const criado = await testDb.usuario.create({
      data: {
        nome: "Maria Solicitante",
        email: "maria@empresa.com.br",
        idEntra: "entra-id-123",
      },
    });

    const encontrado = await testDb.usuario.findUnique({
      where: { id: criado.id },
    });

    expect(encontrado?.email).toBe("maria@empresa.com.br");
    expect(encontrado?.flagFinanceiro).toBe(false);
  });

  it("faz upsert por idEntra sem duplicar o usuário, como no callback de login", async () => {
    await testDb.usuario.upsert({
      where: { idEntra: "entra-id-456" },
      update: { nome: "Nome Atualizado", email: "joao@empresa.com.br" },
      create: {
        idEntra: "entra-id-456",
        nome: "João Comprador",
        email: "joao@empresa.com.br",
      },
    });

    await testDb.usuario.upsert({
      where: { idEntra: "entra-id-456" },
      update: { nome: "Nome Atualizado", email: "joao@empresa.com.br" },
      create: {
        idEntra: "entra-id-456",
        nome: "João Comprador",
        email: "joao@empresa.com.br",
      },
    });

    const usuarios = await testDb.usuario.findMany({
      where: { idEntra: "entra-id-456" },
    });

    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].nome).toBe("Nome Atualizado");
  });
});
