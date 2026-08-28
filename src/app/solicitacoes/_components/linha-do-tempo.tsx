import { formatarDataHora } from "@/lib/format";
import type { obterSolicitacao } from "@/lib/workflow";

// Um rótulo por evento gravado em registrarHistorico (src/lib/workflow.ts) —
// sem fallback silencioso: se um evento novo for adicionado ao workflow sem
// entrar aqui, ele aparece com o nome bruto em vez de sumir da linha do tempo.
const EVENTO_LEGIVEL: Record<string, string> = {
  rascunho_criado: "Rascunho criado",
  enviado: "Enviado para aprovação",
  reenviado: "Reenviado para aprovação",
  aguardando_nivel2: "Aprovado (nível 1) — aguardando aprovação do diretor",
  aprovado: "Aprovado",
  editado_apos_rejeicao: "Editado após rejeição",
  rejeitado: "Rejeitado",
  comprador_designado: "Comprador designado",
  aguardando_designacao_manual: "Aguardando designação manual de comprador",
  compra_confirmada: "Compra confirmada",
  enviado_para_pagamento: "Enviado para pagamento",
  reenviado_para_pagamento: "Reenviado para pagamento",
  pagamento_recusado: "Pagamento recusado",
  pago: "Pagamento registrado",
};

type Historico = NonNullable<
  Awaited<ReturnType<typeof obterSolicitacao>>
>["historico"];

export function LinhaDoTempo({ historico }: { historico: Historico }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">Histórico</h2>
      <ol className="flex flex-col gap-3 border-l pl-4">
        {historico.map((h) => (
          <li key={h.id}>
            <p className="text-sm">
              <strong>{EVENTO_LEGIVEL[h.evento] ?? h.evento}</strong>
              {" — "}
              {h.ator?.nome ?? "Sistema"}
            </p>
            <p className="text-xs text-gray-600">{formatarDataHora(h.criadoEm)}</p>
            {h.detalhe && <p className="text-xs text-gray-600">{h.detalhe}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
