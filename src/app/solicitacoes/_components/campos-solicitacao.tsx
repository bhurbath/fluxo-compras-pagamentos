import { MetodoPagamento } from "@prisma/client";
import { METODO_PAGAMENTO_LEGIVEL } from "./metodo-pagamento-legivel";

type Lista = { id: string; nome: string };

const FORMAS_PAGAMENTO = [
  { value: "ADIANTAMENTO", label: "Adiantamento" },
  { value: "A_VISTA", label: "À vista" },
  { value: "PARCELADO", label: "Parcelado" },
];

// Just the <label>/<input>/<select> fields, no <form> wrapper and no submit
// buttons — each page supplies its own <form action={...}> and button row,
// since /solicitacoes/nova needs two submit actions (rascunho/enviar) and
// the edit-after-rejection section on /solicitacoes/[id] needs only one
// (salvar e reenviar). O departamento não é um campo aqui — a solicitação
// sempre herda o do solicitante (ver parseSolicitacaoForm em actions.ts).
export function CamposSolicitacao({
  defaultValues,
  tiposCompra,
  centrosCusto,
  centrosResultado,
  contasContabeis,
  empresas,
}: {
  defaultValues?: {
    descricao?: string;
    valor?: string;
    tipoCompraId?: string;
    fornecedor?: string;
    formaPagamento?: string;
    centroCustoId?: string;
    centroResultadoId?: string;
    contaContabilId?: string;
    empresaId?: string;
    linkCompra?: string | null;
    informacoesComplementares?: string | null;
    temCotacao?: boolean;
    semCompra?: boolean;
    metodoPagamento?: string | null;
    dadosPagamento?: string | null;
    fornecedorDocumento?: string | null;
    temAnexo?: boolean;
  };
  tiposCompra: Lista[];
  centrosCusto: Lista[];
  centrosResultado: Lista[];
  contasContabeis: Lista[];
  empresas: Lista[];
}) {
  return (
    <>
      <label className="field">
        Descrição
        <textarea
          name="descricao"
          required
          defaultValue={defaultValues?.descricao}
          className="input-field"
        />
      </label>
      <label className="field">
        Valor (R$)
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultValues?.valor}
          className="input-field"
        />
      </label>
      <label className="field">
        Tipo de compra
        <select
          name="tipoCompraId"
          defaultValue={defaultValues?.tipoCompraId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {tiposCompra.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Fornecedor
        <input
          name="fornecedor"
          type="text"
          required
          defaultValue={defaultValues?.fornecedor}
          className="input-field"
        />
      </label>
      <label className="field">
        Forma de pagamento
        <select
          name="formaPagamento"
          defaultValue={defaultValues?.formaPagamento ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Centro de custo
        <select
          name="centroCustoId"
          defaultValue={defaultValues?.centroCustoId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {centrosCusto.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Centro de resultado
        <select
          name="centroResultadoId"
          defaultValue={defaultValues?.centroResultadoId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {centrosResultado.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Conta contábil
        <select
          name="contaContabilId"
          defaultValue={defaultValues?.contaContabilId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {contasContabeis.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Empresa
        <select
          name="empresaId"
          defaultValue={defaultValues?.empresaId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Link da compra (opcional)
        <input
          name="linkCompra"
          type="text"
          defaultValue={defaultValues?.linkCompra ?? ""}
          className="input-field"
        />
      </label>
      <label className="field">
        Informações complementares (opcional)
        <textarea
          name="informacoesComplementares"
          defaultValue={defaultValues?.informacoesComplementares ?? ""}
          className="input-field"
        />
      </label>
      <label className="field">
        Cotação/orçamento (opcional — PDF, JPG ou PNG)
        <input
          type="file"
          name="cotacao"
          accept=".pdf,.jpg,.jpeg,.png"
          className="input-field"
        />
        {defaultValues?.temCotacao && (
          <span className="muted-xs">
            Já existe uma cotação anexada — envie um novo arquivo só se quiser substituí-la.
          </span>
        )}
      </label>

      <label className="field-inline sem-compra-toggle">
        <input
          id="semCompra"
          name="semCompra"
          type="checkbox"
          defaultChecked={defaultValues?.semCompra}
        />
        Esta solicitação não envolve compra — é só pagamento direto (ex.: encargos, taxas,
        guias), com a documentação já anexada.
      </label>

      <div className="sem-compra-fields">
        <label className="field">
          Documentação (nota fiscal, guia — PDF, JPG ou PNG — pode selecionar mais de um
          arquivo)
          <input
            type="file"
            name="notaFiscal"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="input-field"
          />
          {defaultValues?.temAnexo && (
            <span className="muted-xs">
              Já existe(m) anexo(s) nesta solicitação — envie novos arquivos só se quiser
              substituí-los.
            </span>
          )}
        </label>
        <label className="field">
          CNPJ/CPF do fornecedor
          <input
            type="text"
            name="fornecedorDocumento"
            defaultValue={defaultValues?.fornecedorDocumento ?? ""}
            className="input-field"
          />
        </label>
        <label className="field">
          Método de pagamento
          <select
            name="metodoPagamento"
            defaultValue={defaultValues?.metodoPagamento ?? ""}
            className="input-field"
          >
            <option value="">Selecione</option>
            {Object.values(MetodoPagamento).map((valor) => (
              <option key={valor} value={valor}>
                {METODO_PAGAMENTO_LEGIVEL[valor]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Dados de pagamento (chave PIX, dados bancários, etc.)
          <textarea
            name="dadosPagamento"
            defaultValue={defaultValues?.dadosPagamento ?? ""}
            className="input-field"
          />
        </label>
      </div>
    </>
  );
}
