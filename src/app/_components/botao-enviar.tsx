"use client";

import { useFormStatus } from "react-dom";

const CAMPO_BOTAO = "_botao";

// Botão de submit que se desabilita e troca o texto enquanto a Server Action
// do <form> em volta está rodando. As ações do fluxo (aprovar, rejeitar…)
// mandam e-mail/sobem anexos antes de redirecionar, então levam alguns
// segundos — sem esse retorno visual o usuário achava que não tinha
// funcionado e clicava de novo.
//
// Em formulários com mais de um botão (ex.: "Salvar rascunho" + "Enviar",
// cada um com seu formAction), todos se desabilitam, mas só o clicado mostra
// labelPendente: o botão vai no FormData como `_botao=<id>` e é comparado com
// o `data` do useFormStatus. As actions ignoram esse campo.
export function BotaoEnviar({
  children,
  labelPendente,
  className = "btn-primary",
  formAction,
  id,
}: {
  children: React.ReactNode;
  labelPendente: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  // Só necessário quando há mais de um BotaoEnviar no mesmo <form>.
  id?: string;
}) {
  const { pending, data } = useFormStatus();
  const foiEsteBotao = pending && (!id || data?.get(CAMPO_BOTAO) === id);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={foiEsteBotao}
      className={className}
      formAction={formAction}
      name={id ? CAMPO_BOTAO : undefined}
      value={id}
    >
      {foiEsteBotao ? labelPendente : children}
    </button>
  );
}
