import { Prisma } from "@prisma/client";

/**
 * Shared helpers for the several "just a name" lookup entities (tipos de
 * compra, centro de custo, centro de resultado, conta contábil, empresa) —
 * each still owns its own typed CRUD functions calling Prisma directly (no
 * generic delegate abstraction, which fights Prisma's generated types more
 * than it saves), but the validation and "still referenced elsewhere" error
 * handling is identical across all of them.
 */
export function validarNomeObrigatorio(nome: string, campo: string): void {
  if (!nome.trim()) {
    throw new Error(`O nome ${campo} é obrigatório.`);
  }
}

export async function comMensagemDeUsoRestrito<T>(
  operacao: () => Promise<T>,
  mensagem: string
): Promise<T> {
  try {
    return await operacao();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(mensagem);
    }
    throw error;
  }
}
