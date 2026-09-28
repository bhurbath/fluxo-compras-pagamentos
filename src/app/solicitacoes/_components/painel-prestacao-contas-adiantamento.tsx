// Terceira etapa, exclusiva do adiantamento em "Compras pelo solicitante"
// (ver submeterPrestacaoContasAdiantamento em workflow.ts) — só aparece para
// o comprador designado (= o próprio solicitante) depois que o Financeiro já
// anexou o comprovante do adiantamento. Aceita mais de um arquivo (ex.: nota
// fiscal + recibo).
export function PainelPrestacaoContasAdiantamento({
  solicitacaoId,
  action,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Anexar documentação de baixa do adiantamento</h2>
      <form
        action={action.bind(null, solicitacaoId)}
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <label className="field">
          Documentação de baixa (notas fiscais, recibos etc. — PDF, JPG ou PNG, pode
          selecionar mais de um arquivo)
          <input
            type="file"
            name="documentacaoBaixa"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            required
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-primary">
          Enviar documentação
        </button>
      </form>
    </div>
  );
}
