import { Prisma } from "@prisma/client";

/**
 * Translates a raw Prisma error into a message safe to show a user. Without
 * this, unique/foreign-key constraint violations reach Server Actions as
 * raw PrismaClientKnownRequestErrors, which either crash with an opaque
 * stack trace (dev) or get fully redacted by Next.js (production) — neither
 * tells the user what actually went wrong.
 */
export function toFriendlyError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return new Error("Já existe um registro com esse valor único (ex: nome duplicado).");
      case "P2003":
        return new Error(
          "Um dos itens selecionados não existe mais. Atualize a página e tente de novo."
        );
      case "P2025":
        return new Error(
          "Registro não encontrado. Ele pode ter sido removido — atualize a página."
        );
    }
  }
  return error instanceof Error ? error : new Error("Erro inesperado.");
}
