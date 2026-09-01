export function PainelConfirmarCompra({
  solicitacaoId,
  action,
  // Mercado Livre, cartão de crédito etc. (ver TipoCompra.exigePrevisaoChegada)
  // — exige informar a previsão de chegada da mercadoria, que vai junto no
  // e-mail de confirmação ao solicitante (ver confirmarCompra em workflow.ts).
  exigePrevisaoChegada = false,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
  exigePrevisaoChegada?: boolean;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Confirmar compra</h2>
      <p className="muted">
        Confirme quando a compra tiver sido realizada. O solicitante será notificado.
      </p>
      <form
        action={action.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        {exigePrevisaoChegada && (
          <label className="field">
            Previsão de chegada
            <input
              name="previsaoChegada"
              type="date"
              required
              className="input-field"
            />
          </label>
        )}
        <button type="submit" className="btn-primary">
          Confirmar compra
        </button>
      </form>
    </div>
  );
}
