import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "./helpers/db";
import {
  atualizarCentroCusto,
  criarCentroCusto,
  excluirCentroCusto,
  listarCentrosCusto,
  obterCentroCusto,
} from "@/lib/centro-custo";
import {
  atualizarCentroResultado,
  criarCentroResultado,
  excluirCentroResultado,
  listarCentrosResultado,
  obterCentroResultado,
} from "@/lib/centro-resultado";
import {
  atualizarContaContabil,
  criarContaContabil,
  excluirContaContabil,
  listarContasContabeis,
  obterContaContabil,
} from "@/lib/conta-contabil";
import {
  atualizarEmpresa,
  criarEmpresa,
  excluirEmpresa,
  listarEmpresas,
  obterEmpresa,
} from "@/lib/empresa";

// These four entities are structurally identical "just a name" lookups
// (same shape as tipos-compra, which keeps its own full test suite) — one
// parameterized suite here covers all four instead of four near-identical
// copies.
const entidades = [
  {
    rotulo: "centro de custo",
    criar: criarCentroCusto,
    listar: listarCentrosCusto,
    obter: obterCentroCusto,
    atualizar: atualizarCentroCusto,
    excluir: excluirCentroCusto,
  },
  {
    rotulo: "centro de resultado",
    criar: criarCentroResultado,
    listar: listarCentrosResultado,
    obter: obterCentroResultado,
    atualizar: atualizarCentroResultado,
    excluir: excluirCentroResultado,
  },
  {
    rotulo: "conta contábil",
    criar: criarContaContabil,
    listar: listarContasContabeis,
    obter: obterContaContabil,
    atualizar: atualizarContaContabil,
    excluir: excluirContaContabil,
  },
  {
    rotulo: "empresa",
    criar: criarEmpresa,
    listar: listarEmpresas,
    obter: obterEmpresa,
    atualizar: atualizarEmpresa,
    excluir: excluirEmpresa,
  },
];

describe.each(entidades)(
  "$rotulo (cadastro simples)",
  ({ criar, listar, obter, atualizar, excluir }) => {
    beforeEach(async () => {
      await resetDb();
    });

    it("cria e lista ordenado por nome", async () => {
      await criar({ nome: "Zebra" });
      await criar({ nome: "Alfa" });

      const itens = await listar();

      expect(itens.map((i) => i.nome)).toEqual(["Alfa", "Zebra"]);
    });

    it("rejeita nome vazio", async () => {
      await expect(criar({ nome: "   " })).rejects.toThrow();
    });

    it("rejeita nome duplicado", async () => {
      await criar({ nome: "Único" });
      await expect(criar({ nome: "Único" })).rejects.toThrow();
    });

    it("atualiza o nome", async () => {
      const item = await criar({ nome: "Antigo" });

      const atualizado = await atualizar(item.id, { nome: "Novo" });

      expect(atualizado.nome).toBe("Novo");
    });

    it("exclui", async () => {
      const item = await criar({ nome: "Descartável" });

      await excluir(item.id);

      expect(await obter(item.id)).toBeNull();
    });
  }
);
