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
