"use client";

// Shared body for every route segment's error.tsx boundary — Next.js
// requires error.tsx itself to exist per segment that needs one, but the
// content doesn't need to be reimplemented at each.
export function ErroInesperado({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p>Ocorreu um erro inesperado.</p>
      <button onClick={() => reset()} className="rounded border px-4 py-2">
        Tentar de novo
      </button>
    </div>
  );
}
