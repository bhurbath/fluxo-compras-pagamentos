import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { Usuario } from "@prisma/client";

/**
 * Returns the current user's Usuario row if they're authenticated AND have
 * the Financeiro flag, or null otherwise.
 */
export async function getFinanceiroUsuario(): Promise<Usuario | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const usuario = await getDb().usuario.findUnique({
    where: { id: session.user.id },
  });

  return usuario?.flagFinanceiro ? usuario : null;
}

/** Same as getFinanceiroUsuario(), but throws instead of returning null. */
export async function requireFinanceiro(): Promise<Usuario> {
  const usuario = await getFinanceiroUsuario();
  if (!usuario) {
    throw new Error("Acesso restrito ao Financeiro.");
  }
  return usuario;
}

/**
 * Wraps a Server Action so the Financeiro check runs before the handler
 * body, unconditionally — a new admin action built with this wrapper can't
 * forget the guard, unlike calling requireFinanceiro() by hand at the top
 * of every action.
 */
export function withFinanceiro<Args extends unknown[]>(
  handler: (usuario: Usuario, ...args: Args) => Promise<void>
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    const usuario = await requireFinanceiro();
    await handler(usuario, ...args);
  };
}
