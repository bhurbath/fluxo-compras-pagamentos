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
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">{titulo}</h2>
      <p className="text-sm text-gray-600">
        Esses dados são obrigatórios antes de enviar ao Financeiro.
      </p>
      <form
        action={action.bind(null, solicitacaoId)}
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <label className="flex flex-col gap-1">
          Nota fiscal/comprovante (PDF, JPG ou PNG)
          <input
            type="file"
            name="notaFiscal"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          CNPJ/CPF do fornecedor
          <input
            type="text"
            name="fornecedorDocumento"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Método de pagamento
          <select
            name="metodoPagamento"
            defaultValue=""
            required
            className="rounded border px-2 py-1"
          >
            <option value="">Selecione</option>
            {Object.entries(METODO_PAGAMENTO_LEGIVEL).map(([valor, legivel]) => (
              <option key={valor} value={valor}>
                {legivel}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Dados de pagamento (chave PIX, dados bancários, etc.)
          <textarea
            name="dadosPagamento"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Enviar para pagamento
        </button>
      </form>
    </div>
  );
}
