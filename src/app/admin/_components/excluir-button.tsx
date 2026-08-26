"use client";

import { useTransition } from "react";

// Shared confirm-and-pending delete button for every destructive action in
// the admin panel — first written for faixas de alçada (ticket 03), now
// generalized so tipos de compra and matriz de comprador (ticket 04) don't
// each reimplement the same confirm()/disabled-state logic.
export function ExcluirButton({
  action,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="underline text-red-600 disabled:opacity-50"
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(() => {
          action(new FormData());
        });
      }}
    >
      {pending ? "Excluindo…" : "Excluir"}
    </button>
  );
}
