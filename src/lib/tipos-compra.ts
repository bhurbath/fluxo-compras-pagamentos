import { getDb } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type TipoCompraInput = {
  nome: string;
};

function validarNome(input: TipoCompraInput) {
  if (!input.nome.trim()) {
    throw new Error("O nome do tipo de compra é obrigatório.");
  }
}

export async function listarTiposCompra() {
  return getDb().tipoCompra.findMany({ orderBy: { nome: "asc" } });
}

export async function obterTipoCompra(id: string) {
  return getDb().tipoCompra.findUnique({ where: { id } });
}

export async function criarTipoCompra(input: TipoCompraInput) {
  validarNome(input);
  return getDb().tipoCompra.create({ data: { nome: input.nome.trim() } });
}

export async function atualizarTipoCompra(id: string, input: TipoCompraInput) {
  validarNome(input);
  return getDb().tipoCompra.update({
    where: { id },
    data: { nome: input.nome.trim() },
  });
}

export async function excluirTipoCompra(id: string) {
  try {
    await getDb().tipoCompra.delete({ where: { id } });
  } catch (error) {
    // toFriendlyError's generic P2003 message ("não existe mais") is written
    // for the opposite direction (referencing something missing) and would
    // be contradictory here — the row is right there in the list, it's just
    // still referenced by a matriz de comprador entry (ON DELETE RESTRICT).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "Não é possível excluir: esse tipo de compra está em uso na matriz de comprador. " +
          "Remova ou altere as entradas que o usam primeiro."
      );
    }
    throw error;
  }
}
