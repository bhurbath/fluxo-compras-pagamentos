"use client";

// Shared body for every route segment's error.tsx boundary — Next.js
// requires error.tsx itself to exist per segment that needs one, but the
// content doesn't need to be reimplemented at each.
export function ErroInesperado({ reset }: { reset: () => void }) {
  return (
    <div className="shell" style={{ justifyContent: "center" }}>
      <div className="panel flex flex-col items-center gap-4" style={{ maxWidth: "24rem" }}>
        <p>Ocorreu um erro inesperado.</p>
        <button onClick={() => reset()} className="btn-secondary">
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
