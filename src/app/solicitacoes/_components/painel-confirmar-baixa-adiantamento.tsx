// Quarta e última etapa, exclusiva do adiantamento em "Compras pelo
// solicitante" (ver confirmarBaixaAdiantamento em workflow.ts) — o
// Financeiro já pode ver a documentação de baixa anexada pelo comprador
// (ver detalhes-solicitacao.tsx) e só falta confirmar, concluindo o fluxo.
export function PainelConfirmarBaixaAdiantamento({
  solicitacaoId,
  action,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Confirmar baixa do adiantamento (Financeiro)</h2>
      <form action={action.bind(null, solicitacaoId)}>
        <button type="submit" className="btn-primary">
          Confirmar baixa
        </button>
      </form>
    </div>
  );
}
