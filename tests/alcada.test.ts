import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "./helpers/db";
import {
  atualizarFaixaAlcada,
  criarFaixaAlcada,
  excluirFaixaAlcada,
  listarFaixasAlcada,
  obterFaixaAlcada,
} from "@/lib/alcada";

describe("faixas de alçada", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("cria uma faixa de alçada", async () => {
    const faixa = await criarFaixaAlcada({
      valorMin: "0",
      valorMax: "1000",
      exigeNivel2: false,
    });

    expect(faixa.valorMin.toNumber()).toBe(0);
    expect(faixa.valorMax?.toNumber()).toBe(1000);
    expect(faixa.exigeNivel2).toBe(false);
  });

  it("permite uma faixa sem valor máximo (topo aberto)", async () => {
    const faixa = await criarFaixaAlcada({
      valorMin: "5000",
      valorMax: null,
      exigeNivel2: true,
    });

    expect(faixa.valorMax).toBeNull();
  });

  it("rejeita uma faixa onde o valor máximo é menor ou igual ao mínimo", async () => {
    await expect(
      criarFaixaAlcada({ valorMin: "1000", valorMax: "500", exigeNivel2: false })
    ).rejects.toThrow();

    await expect(
      criarFaixaAlcada({ valorMin: "1000", valorMax: "1000", exigeNivel2: false })
    ).rejects.toThrow();
  });

  it("lista as faixas ordenadas por valor mínimo", async () => {
    await criarFaixaAlcada({ valorMin: "5000", valorMax: null, exigeNivel2: true });
    await criarFaixaAlcada({ valorMin: "0", valorMax: "999.99", exigeNivel2: false });
    await criarFaixaAlcada({ valorMin: "1000", valorMax: "4999.99", exigeNivel2: true });

    const faixas = await listarFaixasAlcada();

    expect(faixas.map((f) => f.valorMin.toNumber())).toEqual([0, 1000, 5000]);
  });

  it("rejeita uma faixa que se sobrepõe a uma faixa existente", async () => {
    await criarFaixaAlcada({ valorMin: "0", valorMax: "1000", exigeNivel2: false });

    await expect(
      criarFaixaAlcada({ valorMin: "500", valorMax: "1500", exigeNivel2: true })
    ).rejects.toThrow(/sobrepõe/);
  });

  it("permite atualizar uma faixa sem que ela conflite consigo mesma", async () => {
    const faixa = await criarFaixaAlcada({
      valorMin: "0",
      valorMax: "1000",
      exigeNivel2: false,
    });

    await expect(
      atualizarFaixaAlcada(faixa.id, { valorMin: "0", valorMax: "1500", exigeNivel2: true })
    ).resolves.toBeTruthy();
  });

  it("rejeita um valor que não é um número válido", async () => {
    await expect(
      criarFaixaAlcada({ valorMin: "0x1A", valorMax: null, exigeNivel2: false })
    ).rejects.toThrow();
  });

  it("rejeita um valor maior que o suportado pela coluna", async () => {
    await expect(
      criarFaixaAlcada({ valorMin: "99999999999", valorMax: null, exigeNivel2: false })
    ).rejects.toThrow();
  });

  it("atualiza uma faixa existente", async () => {
    const faixa = await criarFaixaAlcada({
      valorMin: "0",
      valorMax: "1000",
      exigeNivel2: false,
    });

    const atualizada = await atualizarFaixaAlcada(faixa.id, {
      valorMin: "0",
      valorMax: "2000",
      exigeNivel2: true,
    });

    expect(atualizada.valorMax?.toNumber()).toBe(2000);
    expect(atualizada.exigeNivel2).toBe(true);
  });

  it("exclui uma faixa", async () => {
    const faixa = await criarFaixaAlcada({
      valorMin: "0",
      valorMax: "1000",
      exigeNivel2: false,
    });

    await excluirFaixaAlcada(faixa.id);

    expect(await obterFaixaAlcada(faixa.id)).toBeNull();
  });
});
