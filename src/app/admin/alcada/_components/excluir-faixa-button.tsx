"use client";

import { useTransition } from "react";

// A misclick here permanently deletes an alçada band with no undo, and this
// is the first destructive action in the admin panel, so it needs its own
// confirmation (no shared confirm-dialog component exists yet to reuse) —
// plus a disabled/pending state so a double-click can't fire the delete
// twice.
export function ExcluirFaixaButton({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="underline text-red-600 disabled:opacity-50"
      onClick={() => {
        if (!confirm("Excluir esta faixa de alçada? Essa ação não pode ser desfeita.")) {
          return;
        }
        startTransition(() => {
          action(new FormData());
        });
      }}
    >
      {pending ? "Excluindo…" : "Excluir"}
    </button>
  );
}
