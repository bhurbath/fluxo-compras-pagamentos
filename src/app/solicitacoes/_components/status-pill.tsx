import { STATUS_LEGIVEL, STATUS_TONE } from "./status-legivel";

// Usado tanto na tabela de listagem (TabelaSolicitacoes) quanto no detalhe
// da solicitação (DetalhesSolicitacao) — um único lugar para a cor de cada
// status não sair de sincronia com o texto (STATUS_LEGIVEL).
export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONE[status];
  return (
    <span className={`status-pill${tone ? ` status-pill--${tone}` : ""}`}>
      {STATUS_LEGIVEL[status] ?? status}
    </span>
  );
}
