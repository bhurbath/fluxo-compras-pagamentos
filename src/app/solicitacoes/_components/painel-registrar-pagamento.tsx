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
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">Aprovação de pagamento (Financeiro)</h2>
      <form
        action={registrarAction.bind(null, solicitacaoId)}
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <label className="flex flex-col gap-1">
          Comprovante de pagamento (PDF, JPG ou PNG)
          <input
            type="file"
            name="comprovante"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Registrar pagamento
        </button>
      </form>
      <form
        action={recusarAction.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        <label className="flex flex-col gap-1">
          Motivo da recusa
          <textarea
            name="motivo"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded border px-4 py-2">
          Recusar
        </button>
      </form>
    </div>
  );
}
