import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { Usuario } from "@prisma/client";

/** Returns the current user's Usuario row if authenticated, or null. */
export async function getUsuarioAutenticado(): Promise<Usuario | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return getDb().usuario.findUnique({ where: { id: session.user.id } });
}

/**
 * Wraps a Server Action so it only runs for an authenticated user — the
 * general-purpose sibling of admin/guard.ts's withFinanceiro(), for actions
 * any logged-in employee can take (not just Financeiro).
 */
export function comUsuarioAutenticado<Args extends unknown[]>(
  handler: (usuario: Usuario, ...args: Args) => Promise<void>
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    const usuario = await getUsuarioAutenticado();
    if (!usuario) {
      throw new Error("É necessário estar autenticado.");
    }
    await handler(usuario, ...args);
  };
}
