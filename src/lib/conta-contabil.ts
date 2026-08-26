import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type ContaContabilInput = {
  nome: string;
};

export async function listarContasContabeis() {
  return getDb().contaContabil.findMany({ orderBy: { nome: "asc" } });
}

export async function obterContaContabil(id: string) {
  return getDb().contaContabil.findUnique({ where: { id } });
}

export async function criarContaContabil(input: ContaContabilInput) {
  validarNomeObrigatorio(input.nome, "da conta contábil");
  return getDb().contaContabil.create({ data: { nome: input.nome.trim() } });
}

export async function atualizarContaContabil(id: string, input: ContaContabilInput) {
  validarNomeObrigatorio(input.nome, "da conta contábil");
  return getDb().contaContabil.update({
    where: { id },
    data: { nome: input.nome.trim() },
  });
}

export async function excluirContaContabil(id: string) {
  await comMensagemDeUsoRestrito(
    () => getDb().contaContabil.delete({ where: { id } }),
    "Não é possível excluir: essa conta contábil está em uso em alguma solicitação."
  );
}
