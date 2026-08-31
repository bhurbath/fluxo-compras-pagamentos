import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type TipoCompraInput = {
  nome: string;
  // Ver comentário no schema (model TipoCompra) — quando true, a designação
  // de comprador pula a matriz e a designação manual, indo direto para o
  // solicitante (ver designarComprador em workflow.ts).
  compradorEhSolicitante?: boolean;
};

export async function listarTiposCompra() {
  return getDb().tipoCompra.findMany({ orderBy: { nome: "asc" } });
}

export async function obterTipoCompra(id: string) {
  return getDb().tipoCompra.findUnique({ where: { id } });
}

export async function criarTipoCompra(input: TipoCompraInput) {
  validarNomeObrigatorio(input.nome, "do tipo de compra");
  return getDb().tipoCompra.create({
    data: {
      nome: input.nome.trim(),
      compradorEhSolicitante: input.compradorEhSolicitante ?? false,
    },
  });
}

export async function atualizarTipoCompra(id: string, input: TipoCompraInput) {
  validarNomeObrigatorio(input.nome, "do tipo de compra");
  return getDb().tipoCompra.update({
    where: { id },
    data: {
      nome: input.nome.trim(),
      compradorEhSolicitante: input.compradorEhSolicitante ?? false,
    },
  });
}

export async function excluirTipoCompra(id: string) {
  await comMensagemDeUsoRestrito(
    () => getDb().tipoCompra.delete({ where: { id } }),
    "Não é possível excluir: esse tipo de compra está em uso na matriz de comprador. " +
      "Remova ou altere as entradas que o usam primeiro."
  );
}
