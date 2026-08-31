import { getDb } from "@/lib/db";

const COM_PESSOAS = {
  responsavel: true,
  diretor: true,
} as const;

export type DepartamentoInput = {
  nome: string;
  responsavelId: string;
  diretorId: string;
};

function validarResponsavelDiretor(input: DepartamentoInput) {
  if (input.responsavelId === input.diretorId) {
    throw new Error(
      "O responsável e o diretor do departamento não podem ser a mesma pessoa."
    );
  }
}

export async function listarDepartamentos() {
  return getDb().departamento.findMany({
    include: COM_PESSOAS,
    orderBy: { nome: "asc" },
  });
}

export async function obterDepartamento(id: string) {
  return getDb().departamento.findUnique({
    where: { id },
    include: COM_PESSOAS,
  });
}

export async function criarDepartamento(input: DepartamentoInput) {
  validarResponsavelDiretor(input);
  return getDb().departamento.create({ data: input });
}

export async function atualizarDepartamento(
  id: string,
  input: DepartamentoInput
) {
  validarResponsavelDiretor(input);
  return getDb().departamento.update({ where: { id }, data: input });
}

export async function listarFuncionarios() {
  return getDb().usuario.findMany({ orderBy: { nome: "asc" } });
}

export async function atribuirDepartamento(
  usuarioId: string,
  departamentoId: string | null
) {
  return getDb().usuario.update({
    where: { id: usuarioId },
    data: { departamentoId },
  });
}

// Única forma de conceder a flag Financeiro pela UI — antes só existia via
// scripts/set-financeiro.ts (necessário para conceder a primeira, já que
// nada mais poderia). Impede remover a própria flag: sem isso, alguém
// poderia se trancar fora do /admin sem ter mais como se auto-corrigir pela
// UI, precisando do script de novo.
export async function alternarFlagFinanceiro(
  usuarioId: string,
  valor: boolean,
  atorId: string
) {
  if (usuarioId === atorId && !valor) {
    throw new Error("Não é possível remover a própria flag Financeiro.");
  }
  return getDb().usuario.update({
    where: { id: usuarioId },
    data: { flagFinanceiro: valor },
  });
}
