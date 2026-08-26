import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type EmpresaInput = {
  nome: string;
};

export async function listarEmpresas() {
  return getDb().empresa.findMany({ orderBy: { nome: "asc" } });
}

export async function obterEmpresa(id: string) {
  return getDb().empresa.findUnique({ where: { id } });
}

export async function criarEmpresa(input: EmpresaInput) {
  validarNomeObrigatorio(input.nome, "da empresa");
  return getDb().empresa.create({ data: { nome: input.nome.trim() } });
}

export async function atualizarEmpresa(id: string, input: EmpresaInput) {
  validarNomeObrigatorio(input.nome, "da empresa");
  return getDb().empresa.update({
    where: { id },
    data: { nome: input.nome.trim() },
  });
}

export async function excluirEmpresa(id: string) {
  await comMensagemDeUsoRestrito(
    () => getDb().empresa.delete({ where: { id } }),
    "Não é possível excluir: essa empresa está em uso em alguma solicitação."
  );
}
