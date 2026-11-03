"use client";

import { useTransition } from "react";

// Shared confirm-and-pending button for every destructive/terminal action —
// first written for faixas de alçada (ticket 03) só para "Excluir", agora
// também usado fora do admin (ex.: excluir/encerrar uma solicitação) — daí
// label/labelPendente serem configuráveis em vez de fixos, sem quebrar quem
// já chama sem passá-los.
export function ExcluirButton({
  action,
  confirmMessage,
  label = "Excluir",
  labelPendente = "Excluindo…",
  className = "link-danger",
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  label?: string;
  labelPendente?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(() => {
          action(new FormData());
        });
      }}
    >
      {pending ? labelPendente : label}
    </button>
  );
}
