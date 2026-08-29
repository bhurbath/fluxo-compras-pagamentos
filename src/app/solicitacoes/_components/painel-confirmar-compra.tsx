export function PainelConfirmarCompra({
  solicitacaoId,
  action,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Confirmar compra</h2>
      <p className="muted">
        Confirme quando a compra tiver sido realizada. O solicitante será notificado.
      </p>
      <form action={action.bind(null, solicitacaoId)}>
        <button type="submit" className="btn-primary">
          Confirmar compra
        </button>
      </form>
    </div>
  );
}
