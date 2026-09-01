import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type CategoriaDespesaPessoalInput = {
  nome: string;
};

export async function listarCategoriasDespesaPessoal() {
  return getDb().categoriaDespesaPessoal.findMany({ orderBy: { nome: "asc" } });
}

export async function obterCategoriaDespesaPessoal(id: string) {
  return getDb().categoriaDespesaPessoal.findUnique({ where: { id } });
}

export async function criarCategoriaDespesaPessoal(input: CategoriaDespesaPessoalInput) {
  validarNomeObrigatorio(input.nome, "da categoria de despesa de pessoal");
  return getDb().categoriaDespesaPessoal.create({ data: { nome: input.nome.trim() } });
}

export async function atualizarCategoriaDespesaPessoal(
  id: string,
  input: CategoriaDespesaPessoalInput
) {
  validarNomeObrigatorio(input.nome, "da categoria de despesa de pessoal");
  return getDb().categoriaDespesaPessoal.update({
    where: { id },
    data: { nome: input.nome.trim() },
  });
}

export async function excluirCategoriaDespesaPessoal(id: string) {
  await comMensagemDeUsoRestrito(
    () => getDb().categoriaDespesaPessoal.delete({ where: { id } }),
    "Não é possível excluir: essa categoria está em uso em alguma solicitação."
  );
}
