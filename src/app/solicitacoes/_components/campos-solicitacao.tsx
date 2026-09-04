import { MetodoPagamento } from "@prisma/client";
import { METODO_PAGAMENTO_LEGIVEL } from "./metodo-pagamento-legivel";

type Lista = { id: string; nome: string };
type TipoCompraLista = {
  id: string;
  nome: string;
  despesaPessoal: boolean;
  dispensaFornecedorForma: boolean;
  empresaFixaId: string | null;
  rdv: boolean;
};

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
//
// Alternância "tipo de compra é despesa de pessoal" — puro CSS, sem JS,
// mesmo padrão de "sem compra" (ver .sem-compra-toggle em globals.css): cada
// <option> de tipoCompraId carrega data-despesa-pessoal, e o seletor
// `:has()` no CSS troca os campos "padrão" pelos de despesa de pessoal
// conforme a opção selecionada no momento.
export function CamposSolicitacao({
  defaultValues,
  tiposCompra,
  centrosCusto,
  centrosResultado,
  contasContabeis,
  empresas,
  categoriasDespesaPessoal,
}: {
  defaultValues?: {
    descricao?: string;
    valor?: string;
    tipoCompraId?: string;
    fornecedor?: string | null;
    formaPagamento?: string | null;
    centroCustoId?: string | null;
    centroResultadoId?: string | null;
    contaContabilId?: string | null;
    empresaId?: string | null;
    linkCompra?: string | null;
    informacoesComplementares?: string | null;
    temCotacao?: boolean;
    semCompra?: boolean;
    metodoPagamento?: string | null;
    dadosPagamento?: string | null;
    fornecedorDocumento?: string | null;
    temAnexo?: boolean;
    categoriaDespesaPessoalId?: string | null;
    numeroPedido?: string | null;
    dataVencimento?: string | null;
    valorCartaoOnfly?: string | null;
    dataRdv?: string | null;
    numeroRdv?: string | null;
    possuiAdiantamento?: boolean | null;
  };
  tiposCompra: TipoCompraLista[];
  centrosCusto: Lista[];
  centrosResultado: Lista[];
  contasContabeis: Lista[];
  empresas: Lista[];
  categoriasDespesaPessoal: Lista[];
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
            <option
              key={t.id}
              value={t.id}
              data-despesa-pessoal={t.despesaPessoal ? "true" : undefined}
              data-dispensa-fornecedor-forma={t.dispensaFornecedorForma ? "true" : undefined}
              data-empresa-fixa={t.empresaFixaId ? "true" : undefined}
              data-rdv={t.rdv ? "true" : undefined}
            >
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field campo-fornecedor">
        Fornecedor
        <input
          name="fornecedor"
          type="text"
          defaultValue={defaultValues?.fornecedor ?? ""}
          className="input-field"
        />
      </label>
      <label className="field campo-empresa">
        Empresa
        <select
          name="empresaId"
          defaultValue={defaultValues?.empresaId ?? ""}
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
        Informações complementares (opcional)
        <textarea
          name="informacoesComplementares"
          defaultValue={defaultValues?.informacoesComplementares ?? ""}
          className="input-field"
        />
      </label>

      <div className="campos-padrao">
        <label className="field campo-forma-pagamento">
          Forma de pagamento
          <select
            name="formaPagamento"
            defaultValue={defaultValues?.formaPagamento ?? ""}
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
          Link da compra (opcional)
          <input
            name="linkCompra"
            type="text"
            defaultValue={defaultValues?.linkCompra ?? ""}
            autoComplete="off"
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
      </div>

      <div className="despesa-pessoal-fields">
        <label className="field">
          Categoria da despesa
          <select
            name="categoriaDespesaPessoalId"
            defaultValue={defaultValues?.categoriaDespesaPessoalId ?? ""}
            className="input-field"
          >
            <option value="">Selecione</option>
            {categoriasDespesaPessoal.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Nº do pedido (opcional)
          <input
            name="numeroPedido"
            type="text"
            defaultValue={defaultValues?.numeroPedido ?? ""}
            className="input-field"
          />
        </label>
        <label className="field">
          Data de vencimento
          <input
            name="dataVencimento"
            type="date"
            defaultValue={defaultValues?.dataVencimento ?? ""}
            className="input-field"
          />
        </label>
        <label className="field">
          Dados de pagamento (opcional — chave PIX, dados bancários, etc.)
          <textarea
            name="dadosPagamentoDespesa"
            defaultValue={defaultValues?.dadosPagamento ?? ""}
            className="input-field"
          />
        </label>
        <label className="field">
          Anexos (nota fiscal, guia, boleto — PDF, JPG ou PNG — pode selecionar mais de um
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
      </div>

      <div className="rdv-fields">
        <label className="field">
          Valor pago no cartão ONFLY (R$)
          <input
            name="valorCartaoOnfly"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.valorCartaoOnfly ?? ""}
            className="input-field"
          />
        </label>
        <label className="field">
          Data da RDV
          <input
            name="dataRdv"
            type="date"
            defaultValue={defaultValues?.dataRdv ?? ""}
            className="input-field"
          />
        </label>
        <label className="field">
          Nº da RDV
          <input
            name="numeroRdv"
            type="text"
            defaultValue={defaultValues?.numeroRdv ?? ""}
            className="input-field"
          />
        </label>
        <label className="field-inline">
          <input
            name="possuiAdiantamento"
            type="checkbox"
            defaultChecked={defaultValues?.possuiAdiantamento ?? false}
          />
          Esta RDV possui adiantamento
        </label>
        <label className="field">
          Anexo(s) da RDV (PDF, JPG ou PNG — pode selecionar mais de um arquivo)
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
      </div>
    </>
  );
}
