import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type CentroCustoInput = {
  nome: string;
};

export async function listarCentrosCusto() {
  return getDb().centroCusto.findMany({ orderBy: { nome: "asc" } });
}

export async function obterCentroCusto(id: string) {
  return getDb().centroCusto.findUnique({ where: { id } });
}

export async function criarCentroCusto(input: CentroCustoInput) {
  validarNomeObrigatorio(input.nome, "do centro de custo");
  return getDb().centroCusto.create({ data: { nome: input.nome.trim() } });
}

export async function atualizarCentroCusto(id: string, input: CentroCustoInput) {
  validarNomeObrigatorio(input.nome, "do centro de custo");
  return getDb().centroCusto.update({
    where: { id },
    data: { nome: input.nome.trim() },
  });
}

export async function excluirCentroCusto(id: string) {
  await comMensagemDeUsoRestrito(
    () => getDb().centroCusto.delete({ where: { id } }),
    "Não é possível excluir: esse centro de custo está em uso em alguma solicitação."
  );
}
