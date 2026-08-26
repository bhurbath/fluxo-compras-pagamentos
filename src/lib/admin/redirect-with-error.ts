import { redirect } from "next/navigation";

/**
 * Redirects back to `path` with the error message attached as a query
 * param, instead of throwing. Next.js redacts thrown Server Action error
 * messages by default in production — a friendly, hand-written message
 * (e.g. "já existe um departamento com esse nome") would never actually
 * reach the user, replaced by a generic "Application error" screen. Encoding
 * it in the redirect URL sidesteps that redaction entirely, since it never
 * goes through the thrown-error channel.
 */
export function redirectComErro(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Erro inesperado.";
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}
