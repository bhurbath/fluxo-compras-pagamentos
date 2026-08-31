import { METODO_PAGAMENTO_LEGIVEL } from "./metodo-pagamento-legivel";

export function PainelEnviarPagamento({
  solicitacaoId,
  action,
  titulo = "Anexar nota fiscal e enviar para pagamento",
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
  titulo?: string;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">{titulo}</h2>
      <p className="muted">
        Esses dados são obrigatórios antes de enviar ao Financeiro.
      </p>
      <form
        action={action.bind(null, solicitacaoId)}
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <label className="field">
          Nota fiscal/comprovante (PDF, JPG ou PNG — pode selecionar mais de um arquivo,
          ex.: nota e boleto)
          <input
            type="file"
            name="notaFiscal"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            required
            className="input-field"
          />
        </label>
        <label className="field">
          CNPJ/CPF do fornecedor
          <input
            type="text"
            name="fornecedorDocumento"
            required
            className="input-field"
          />
        </label>
        <label className="field">
          Método de pagamento
          <select
            name="metodoPagamento"
            defaultValue=""
            required
            className="input-field"
          >
            <option value="">Selecione</option>
            {Object.entries(METODO_PAGAMENTO_LEGIVEL).map(([valor, legivel]) => (
              <option key={valor} value={valor}>
                {legivel}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Dados de pagamento (chave PIX, dados bancários, etc.)
          <textarea
            name="dadosPagamento"
            required
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-primary">
          Enviar para pagamento
        </button>
      </form>
    </div>
  );
}
