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
  caixaInterno: boolean;
  fundoFixo: boolean;
  compradorEhSolicitante: boolean;
  adiantamentoIndustrial: boolean;
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
// conforme a opção selecionada no momento. Mesmo padrão, mas só pra um
// campo (não o formulário inteiro), pra "Compras pelo solicitante" (ver
// TipoCompra.compradorEhSolicitante): data-comprador-solicitante mostra o
// campo "Data de vencimento" dentro de .campos-padrao — esse tipo continua
// usando o formulário normal (aprovação, comprador, etc.), só ganha esse
// campo a mais.
//
// A ordem visual dos campos para RDV (Tipo de compra, Empresa, Nome do
// colaborador, Nº da RDV, Data da RDV, Valor total, Valor a reembolsar,
// Valor pago no cartão ONFLY, Informações complementares), para Caixa Interno (Tipo de compra, Empresa,
// Descrição, Data da despesa, Valor total, Centro de custo, Centro de
// resultado, Conta contábil, Anexo), para Recarga ONFLY/Fundo Fixo (Tipo de
// compra, Empresa, Data de vencimento, Valor total, Anexo, PIX para
// depósito) e para Adiantamento para Compras Industriais (Tipo de compra,
// Empresa, Fornecedor, CNPJ, Valor, Data de vencimento, Nº do pedido,
// Descrição, Cotação) é bem diferente da ordem "padrão" — em vez de
// duplicar campos com o mesmo name (o que causaria colisão no FormData —
// ver comentário sobre isso em actions.ts), cada campo recebe uma classe
// própria e a troca de posição é feita via `order` (flexbox) só quando o
// tipo correspondente está selecionado, ver globals.css. Por isso todos
// esses campos precisam ser irmãos diretos (sem wrapper div), diferente de
// .campos-padrao/.despesa-pessoal-fields. Centro de custo/resultado/conta
// contábil de Caixa Interno e a data de vencimento/anexo/nº do pedido/CNPJ/
// cotação de Fundo Fixo e Adiantamento para Compras Industriais usam name
// próprio (...CaixaInterno/...FundoFixo/...Adiantamento) — mesmos dados/
// mesma coluna, mas campos HTML distintos dos equivalentes em
// .campos-padrao/.despesa-pessoal-fields (que ficam escondidos inteiros
// nesses tipos), evitando a mesma colisão.
export function CamposSolicitacao({
  defaultValues,
  valoresPreservados,
  tiposCompra,
  centrosCusto,
  centrosResultado,
  contasContabeis,
  empresas,
  categoriasDespesaPessoal,
  dataVencimentoMinima,
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
    valorReembolsar?: string | null;
    valorCartaoOnfly?: string | null;
    dataRdv?: string | null;
    numeroRdv?: string | null;
    nomeColaboradorRdv?: string | null;
    possuiAdiantamento?: boolean | null;
    dataDespesa?: string | null;
  };
  // Snapshot bruto (nome do <input> no HTML → valor) do último envio deste
  // formulário que falhou — ver redirectComErroPreservandoFormulario/
  // lerFormularioPreservado em src/lib/redirect-with-error.ts. Quando
  // presente, tem prioridade total sobre defaultValues em todo campo
  // texto/select/checkbox: é o que a pessoa acabou de digitar, mais
  // relevante do que o que estava salvo no banco (caso de edição) ou do que
  // um formulário em branco (caso de criação). Indexado pelo name literal
  // do HTML, não pelo nome conceitual de defaultValues — por isso funciona
  // sem precisar saber qual variante (RDV/Caixa Interno/Fundo Fixo/
  // Adiantamento/...) estava selecionada quando o envio falhou. Nunca inclui
  // campos de arquivo (impossível restaurar o valor de <input type="file">
  // por restrição do próprio navegador).
  valoresPreservados?: Record<string, string>;
  tiposCompra: TipoCompraLista[];
  centrosCusto: Lista[];
  centrosResultado: Lista[];
  contasContabeis: Lista[];
  empresas: Lista[];
  categoriasDespesaPessoal: Lista[];
  // "yyyy-mm-dd" (mesmo formato de <input type="date">) — data mínima
  // permitida para o campo de vencimento de "Compras pelo solicitante" (ver
  // TipoCompra.compradorEhSolicitante), calculada pela página que renderiza
  // este componente (ver adicionarDiasUteis em src/lib/dias-uteis.ts). Só
  // orienta o navegador (atributo `min`) — quem de fato garante a regra é
  // validarCriarSolicitacao no servidor.
  dataVencimentoMinima?: string;
}) {
  // Ver comentário de valoresPreservados acima — presente, usa só ele
  // (o snapshot mais recente do que foi digitado); ausente, cai no
  // comportamento de sempre (defaultValues, derivado do banco ou vazio).
  function v(nome: string, fallback?: string | null): string {
    return valoresPreservados ? (valoresPreservados[nome] ?? "") : (fallback ?? "");
  }
  function marcado(nome: string, fallback?: boolean | null): boolean {
    return valoresPreservados ? nome in valoresPreservados : Boolean(fallback);
  }

  return (
    <>
      <label className="field campo-descricao">
        Descrição
        <textarea
          name="descricao"
          defaultValue={v("descricao", defaultValues?.descricao)}
          className="input-field"
        />
      </label>
      <label className="field campo-valor">
        <span className="rotulo-valor-padrao">Valor (R$)</span>
        <span className="rotulo-valor-total">Valor Total (R$)</span>
        <input
          name="valor"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={v("valor", defaultValues?.valor)}
          className="input-field"
        />
      </label>
      <label className="field campo-tipo-compra">
        Tipo de compra
        <select
          name="tipoCompraId"
          defaultValue={v("tipoCompraId", defaultValues?.tipoCompraId)}
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
              data-caixa-interno={t.caixaInterno ? "true" : undefined}
              data-fundo-fixo={t.fundoFixo ? "true" : undefined}
              data-comprador-solicitante={t.compradorEhSolicitante ? "true" : undefined}
              data-adiantamento-industrial={t.adiantamentoIndustrial ? "true" : undefined}
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
          defaultValue={v("fornecedor", defaultValues?.fornecedor)}
          className="input-field"
        />
      </label>
      <label className="field campo-empresa">
        Empresa
        <select
          name="empresaId"
          defaultValue={v("empresaId", defaultValues?.empresaId)}
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
      <label className="field campo-nome-colaborador-rdv">
        Nome do colaborador
        <input
          name="nomeColaboradorRdv"
          type="text"
          defaultValue={v("nomeColaboradorRdv", defaultValues?.nomeColaboradorRdv)}
          className="input-field"
        />
      </label>
      <label className="field campo-numero-rdv">
        Nº da RDV
        <input
          name="numeroRdv"
          type="text"
          defaultValue={v("numeroRdv", defaultValues?.numeroRdv)}
          className="input-field"
        />
      </label>
      <label className="field campo-data-rdv">
        Data da RDV
        <input
          name="dataRdv"
          type="date"
          defaultValue={v("dataRdv", defaultValues?.dataRdv)}
          className="input-field"
        />
      </label>
      <label className="field campo-valor-reembolsar">
        Valor a reembolsar (R$)
        <input
          name="valorReembolsar"
          type="number"
          step="0.01"
          min="0"
          defaultValue={v("valorReembolsar", defaultValues?.valorReembolsar)}
          className="input-field"
        />
      </label>
      <label className="field campo-valor-onfly">
        Valor pago no Cartão ONFLY (R$)
        <input
          name="valorCartaoOnfly"
          type="number"
          step="0.01"
          min="0"
          defaultValue={v("valorCartaoOnfly", defaultValues?.valorCartaoOnfly)}
          className="input-field"
        />
      </label>
      <label className="field campo-informacoes-complementares">
        Informações complementares (opcional)
        <textarea
          name="informacoesComplementares"
          defaultValue={v("informacoesComplementares", defaultValues?.informacoesComplementares)}
          className="input-field"
        />
      </label>
      <label className="field-inline campo-possui-adiantamento">
        <input
          name="possuiAdiantamento"
          type="checkbox"
          defaultChecked={marcado("possuiAdiantamento", defaultValues?.possuiAdiantamento)}
        />
        Esta RDV possui adiantamento
      </label>
      <label className="field campo-anexo-rdv">
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

      <label className="field campo-data-despesa">
        Data da despesa
        <input
          name="dataDespesa"
          type="date"
          defaultValue={v("dataDespesa", defaultValues?.dataDespesa)}
          className="input-field"
        />
      </label>
      <label className="field campo-centro-custo-caixa-interno">
        Centro de custo
        <select
          name="centroCustoIdCaixaInterno"
          defaultValue={v("centroCustoIdCaixaInterno", defaultValues?.centroCustoId)}
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
      <label className="field campo-centro-resultado-caixa-interno">
        Centro de resultado
        <select
          name="centroResultadoIdCaixaInterno"
          defaultValue={v("centroResultadoIdCaixaInterno", defaultValues?.centroResultadoId)}
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
      <label className="field campo-conta-contabil-caixa-interno">
        Conta contábil
        <select
          name="contaContabilIdCaixaInterno"
          defaultValue={v("contaContabilIdCaixaInterno", defaultValues?.contaContabilId)}
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
      <label className="field campo-anexo-caixa-interno">
        Anexo(s) (PDF, JPG ou PNG — pode selecionar mais de um arquivo)
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

      <label className="field campo-data-vencimento-fundo-fixo">
        Data de vencimento
        <input
          name="dataVencimentoFundoFixo"
          type="date"
          defaultValue={v("dataVencimentoFundoFixo", defaultValues?.dataVencimento)}
          className="input-field"
        />
      </label>
      <label className="field campo-anexo-fundo-fixo">
        Anexo (opcional — PDF, JPG ou PNG)
        <input type="file" name="notaFiscal" accept=".pdf,.jpg,.jpeg,.png" className="input-field" />
        {defaultValues?.temAnexo && (
          <span className="muted-xs">
            Já existe um anexo nesta solicitação — envie um novo arquivo só se quiser
            substituí-lo.
          </span>
        )}
      </label>
      <label className="field campo-pix-deposito">
        PIX para depósito
        <textarea
          name="pixDeposito"
          defaultValue={v("pixDeposito", defaultValues?.dadosPagamento)}
          className="input-field"
        />
      </label>

      <label className="field campo-cnpj-adiantamento">
        CNPJ
        <input
          name="fornecedorDocumentoAdiantamento"
          type="text"
          defaultValue={v("fornecedorDocumentoAdiantamento", defaultValues?.fornecedorDocumento)}
          className="input-field"
        />
      </label>
      <label className="field campo-data-vencimento-adiantamento">
        Data de vencimento
        <input
          name="dataVencimentoAdiantamento"
          type="date"
          defaultValue={v("dataVencimentoAdiantamento", defaultValues?.dataVencimento)}
          className="input-field"
        />
      </label>
      <label className="field campo-numero-pedido-adiantamento">
        Nº do pedido
        <input
          name="numeroPedidoAdiantamento"
          type="text"
          defaultValue={v("numeroPedidoAdiantamento", defaultValues?.numeroPedido)}
          className="input-field"
        />
      </label>
      <label className="field campo-cotacao-adiantamento">
        Cotação/orçamento (opcional — PDF, JPG ou PNG)
        <input
          type="file"
          name="cotacaoAdiantamento"
          accept=".pdf,.jpg,.jpeg,.png"
          className="input-field"
        />
        {defaultValues?.temCotacao && (
          <span className="muted-xs">
            Já existe uma cotação anexada — envie um novo arquivo só se quiser substituí-la.
          </span>
        )}
      </label>

      <div className="campos-padrao">
        <label className="field campo-forma-pagamento">
          Forma de pagamento
          <select
            name="formaPagamento"
            defaultValue={v("formaPagamento", defaultValues?.formaPagamento)}
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
            defaultValue={v("centroCustoId", defaultValues?.centroCustoId)}
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
            defaultValue={v("centroResultadoId", defaultValues?.centroResultadoId)}
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
            defaultValue={v("contaContabilId", defaultValues?.contaContabilId)}
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
        <label className="field campo-data-vencimento-comprador-solicitante">
          Data de vencimento
          <input
            name="dataVencimentoCompradorSolicitante"
            type="date"
            min={dataVencimentoMinima}
            defaultValue={v("dataVencimentoCompradorSolicitante", defaultValues?.dataVencimento)}
            className="input-field"
          />
          <span className="muted-xs">
            Precisa ser pelo menos 5 dias úteis após a data de hoje.
          </span>
        </label>
        <label className="field">
          Link da compra (opcional)
          <input
            name="linkCompra"
            type="text"
            defaultValue={v("linkCompra", defaultValues?.linkCompra)}
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
            defaultChecked={marcado("semCompra", defaultValues?.semCompra)}
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
              defaultValue={v("fornecedorDocumento", defaultValues?.fornecedorDocumento)}
              className="input-field"
            />
          </label>
          <label className="field">
            Método de pagamento
            <select
              name="metodoPagamento"
              defaultValue={v("metodoPagamento", defaultValues?.metodoPagamento)}
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
              defaultValue={v("dadosPagamento", defaultValues?.dadosPagamento)}
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
            defaultValue={v("categoriaDespesaPessoalId", defaultValues?.categoriaDespesaPessoalId)}
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
            defaultValue={v("numeroPedido", defaultValues?.numeroPedido)}
            className="input-field"
          />
        </label>
        <label className="field">
          Data de vencimento
          <input
            name="dataVencimento"
            type="date"
            defaultValue={v("dataVencimento", defaultValues?.dataVencimento)}
            className="input-field"
          />
        </label>
        <label className="field">
          Dados de pagamento (opcional — chave PIX, dados bancários, etc.)
          <textarea
            name="dadosPagamentoDespesa"
            defaultValue={v("dadosPagamentoDespesa", defaultValues?.dadosPagamento)}
            className="input-field"
          />
        </label>
        <label className="field">
          Anexos (nota fiscal, guia, boleto, planilha — PDF, JPG, PNG, CSV ou Excel — pode
          selecionar mais de um arquivo)
          <input
            type="file"
            name="notaFiscal"
            accept=".pdf,.jpg,.jpeg,.png,.csv,.xls,.xlsx"
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
