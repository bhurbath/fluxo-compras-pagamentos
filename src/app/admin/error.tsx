"use client";

// Safety net for genuinely unexpected errors (bugs), not for expected
// validation/business-rule failures — those are surfaced via redirectComErro
// (see src/lib/admin/redirect-with-error.ts) so they aren't redacted by
// Next.js's default production error handling.
export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Ocorreu um erro inesperado.</p>
      <button onClick={() => reset()} className="rounded border px-4 py-2">
        Tentar de novo
      </button>
    </div>
  );
}
