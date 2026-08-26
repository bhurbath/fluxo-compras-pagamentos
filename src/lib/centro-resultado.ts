import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type CentroResultadoInput = {
  nome: string;
};

export async function listarCentrosResultado() {
  return getDb().centroResultado.findMany({ orderBy: { nome: "asc" } });
}

export async function obterCentroResultado(id: string) {
  return getDb().centroResultado.findUnique({ where: { id } });
}

export async function criarCentroResultado(input: CentroResultadoInput) {
  validarNomeObrigatorio(input.nome, "do centro de resultado");
  return getDb().centroResultado.create({ data: { nome: input.nome.trim() } });
}

export async function atualizarCentroResultado(
  id: string,
  input: CentroResultadoInput
) {
  validarNomeObrigatorio(input.nome, "do centro de resultado");
  return getDb().centroResultado.update({
    where: { id },
    data: { nome: input.nome.trim() },
  });
}

export async function excluirCentroResultado(id: string) {
  await comMensagemDeUsoRestrito(
    () => getDb().centroResultado.delete({ where: { id } }),
    "Não é possível excluir: esse centro de resultado está em uso em alguma solicitação."
  );
}
