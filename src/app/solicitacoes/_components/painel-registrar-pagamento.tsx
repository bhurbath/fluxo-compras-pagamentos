export function PainelRegistrarPagamento({
  solicitacaoId,
  registrarAction,
  recusarAction,
}: {
  solicitacaoId: string;
  registrarAction: (id: string, formData: FormData) => Promise<void>;
  recusarAction: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Aprovação de pagamento (Financeiro)</h2>
      <form
        action={registrarAction.bind(null, solicitacaoId)}
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <label className="field">
          Comprovante de pagamento (PDF, JPG ou PNG)
          <input
            type="file"
            name="comprovante"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-primary">
          Registrar pagamento
        </button>
      </form>
      <form
        action={recusarAction.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        <label className="field">
          Motivo da recusa
          <textarea
            name="motivo"
            required
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-secondary">
          Recusar
        </button>
      </form>
    </div>
  );
}
