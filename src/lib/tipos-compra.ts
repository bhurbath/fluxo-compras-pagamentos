import { getDb } from "@/lib/db";
import { comMensagemDeUsoRestrito, validarNomeObrigatorio } from "@/lib/nome-simples";

export type TipoCompraInput = {
  nome: string;
  // Ver comentário no schema (model TipoCompra) — quando true, a designação
  // de comprador pula a matriz e a designação manual, indo direto para o
  // solicitante (ver designarComprador em workflow.ts).
  compradorEhSolicitante?: boolean;
  // Ver comentário no schema (model TipoCompra) — muda o formulário de
  // solicitação inteiro e dispensa aprovação/compra (ver workflow.ts).
  despesaPessoal?: boolean;
  // Ver comentário no schema (model TipoCompra) — exige previsão de chegada
  // ao confirmar a compra, e notifica só o Financeiro (não o solicitante)
  // ao anexar a nota fiscal (ver confirmarCompra/processarEnvioPagamento em
  // workflow.ts).
  exigePrevisaoChegada?: boolean;
  // Ver comentário no schema (model TipoCompra) — dispensa fornecedor e
  // forma de pagamento no formulário de solicitação (ver workflow.ts).
  dispensaFornecedorForma?: boolean;
  // Ver comentário no schema (model TipoCompra) — quando definido, toda
  // solicitação desse tipo usa sempre esta empresa, sem o solicitante
  // escolher (ver workflow.ts). null/undefined remove a empresa fixa.
  empresaFixaId?: string | null;
};

export async function listarTiposCompra() {
  return getDb().tipoCompra.findMany({
    include: { empresaFixa: true },
    orderBy: { nome: "asc" },
  });
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
      despesaPessoal: input.despesaPessoal ?? false,
      exigePrevisaoChegada: input.exigePrevisaoChegada ?? false,
      dispensaFornecedorForma: input.dispensaFornecedorForma ?? false,
      empresaFixaId: input.empresaFixaId || null,
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
      despesaPessoal: input.despesaPessoal ?? false,
      exigePrevisaoChegada: input.exigePrevisaoChegada ?? false,
      dispensaFornecedorForma: input.dispensaFornecedorForma ?? false,
      empresaFixaId: input.empresaFixaId || null,
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
