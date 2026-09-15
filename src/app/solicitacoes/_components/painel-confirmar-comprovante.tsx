// Segunda etapa da confirmação de pagamento (ver confirmarComprovante em
// workflow.ts) — só aparece depois que o Financeiro já registrou o
// pagamento (PainelRegistrarPagamento) e a solicitação ficou aguardando o
// comprovante. Não tem opção de recusar aqui — o pagamento já foi feito,
// só falta anexar o comprovante. Aceita mais de um arquivo (ex.:
// comprovante do banco + extrato).
export function PainelConfirmarComprovante({
  solicitacaoId,
  action,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Anexar comprovante (Financeiro)</h2>
      <form
        action={action.bind(null, solicitacaoId)}
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <label className="field">
          Comprovante de pagamento (PDF, JPG ou PNG — pode selecionar mais de um arquivo)
          <input
            type="file"
            name="comprovante"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            required
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-primary">
          Confirmar comprovante
        </button>
      </form>
    </div>
  );
}
