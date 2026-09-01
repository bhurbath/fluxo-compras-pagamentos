export function PainelConfirmarCompra({
  solicitacaoId,
  action,
  // Mercado Livre, cartão de crédito etc. (ver TipoCompra.exigePrevisaoChegada)
  // — exige informar a previsão de chegada da mercadoria, que vai junto no
  // e-mail de confirmação ao solicitante (ver confirmarCompra em workflow.ts).
  // Também é o único caso em que o próprio comprador pode recusar a compra
  // (item indisponível, preço mudou, etc.) — ver rejeitar em workflow.ts.
  exigePrevisaoChegada = false,
  rejeitarAction,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
  exigePrevisaoChegada?: boolean;
  rejeitarAction: (id: string, formData: FormData) => Promise<void>;
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

      {exigePrevisaoChegada && (
        <form
          action={rejeitarAction.bind(null, solicitacaoId)}
          className="flex flex-col gap-2"
        >
          <label className="field">
            Motivo da recusa (ex.: item indisponível, preço mudou)
            <textarea
              name="motivo"
              required
              className="input-field"
            />
          </label>
          <button type="submit" className="btn-secondary">
            Não foi possível comprar
          </button>
        </form>
      )}
    </div>
  );
}
