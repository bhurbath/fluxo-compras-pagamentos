import { getDb } from "@/lib/db";
import { Prisma } from "@prisma/client";

const COM_NOMES = {
  departamento: true,
  tipoCompra: true,
  comprador: true,
} as const;

export type MatrizCompradorInput = {
  departamentoId: string;
  tipoCompraId: string;
  compradorId: string;
};

// toFriendlyError's generic P2002 message ("nome duplicado") is written for
// single-field @unique columns like Departamento.nome — it's misleading here
// since this constraint is a (departamentoId, tipoCompraId) pair, and the
// form has no "nome" field at all. Caught and re-thrown here, at the one
// place that actually knows what the constraint means, rather than trying
// to make the shared generic handler guess.
async function comMensagemDeDuplicidade<T>(operacao: () => Promise<T>): Promise<T> {
  try {
    return await operacao();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(
        "Já existe um comprador definido para esse departamento e tipo de compra. " +
          "Edite a entrada existente em vez de criar uma nova."
      );
    }
    throw error;
  }
}

export async function listarMatrizComprador() {
  return getDb().matrizComprador.findMany({
    include: COM_NOMES,
    orderBy: [{ departamento: { nome: "asc" } }, { tipoCompra: { nome: "asc" } }],
  });
}

export async function obterEntradaMatriz(id: string) {
  return getDb().matrizComprador.findUnique({
    where: { id },
    include: COM_NOMES,
  });
}

export async function criarEntradaMatriz(input: MatrizCompradorInput) {
  return comMensagemDeDuplicidade(() =>
    getDb().matrizComprador.create({ data: input })
  );
}

export async function atualizarEntradaMatriz(
  id: string,
  input: MatrizCompradorInput
) {
  return comMensagemDeDuplicidade(() =>
    getDb().matrizComprador.update({ where: { id }, data: input })
  );
}

export async function excluirEntradaMatriz(id: string) {
  await getDb().matrizComprador.delete({ where: { id } });
}
