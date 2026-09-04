import { formatarData, formatarReais } from "@/lib/format";
import type { obterSolicitacao } from "@/lib/workflow";
import { METODO_PAGAMENTO_LEGIVEL } from "./metodo-pagamento-legivel";
import { StatusPill } from "./status-pill";
import { LinhaDoTempo } from "./linha-do-tempo";

const FORMA_PAGAMENTO_LEGIVEL: Record<string, string> = {
  ADIANTAMENTO: "Adiantamento",
  A_VISTA: "À vista",
  PARCELADO: "Parcelado",
};

export function DetalhesSolicitacao({
  solicitacao,
  notaFiscalUrlsAssinadas,
  comprovantePagamentoUrlAssinada,
  cotacaoUrlAssinada,
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
  // URLs temporárias (Supabase Storage é privado) para baixar os anexos,
  // geradas pelo Server Component pai a partir dos caminhos guardados em
  // solicitacao.notaFiscalUrls/comprovantePagamentoUrl/cotacaoUrl (que não
  // são URLs utilizáveis diretamente) — ver src/lib/storage.ts. Cada entrada
  // de notaFiscalUrlsAssinadas corresponde, na mesma posição, a uma entrada
  // de solicitacao.notaFiscalUrls; null quando não há anexo ou a URL não
  // pôde ser gerada.
  notaFiscalUrlsAssinadas?: (string | null)[];
  comprovantePagamentoUrlAssinada?: string | null;
  cotacaoUrlAssinada?: string | null;
}) {
  return (
    <>
      <dl className="flex flex-col gap-2">
        <div>
          <dt className="muted">Status</dt>
          <dd style={{ marginTop: "0.2rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <StatusPill status={solicitacao.status} />
            {solicitacao.semCompra && (
              <span className="status-pill">Sem etapa de compra</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="muted">Descrição</dt>
          <dd>{solicitacao.descricao}</dd>
        </div>
        <div>
          <dt className="muted">Valor</dt>
          <dd>{formatarReais(solicitacao.valor)}</dd>
        </div>
        <div>
          <dt className="muted">Departamento</dt>
          <dd>{solicitacao.departamento.nome}</dd>
        </div>
        <div>
          <dt className="muted">Tipo de compra</dt>
          <dd>{solicitacao.tipoCompra.nome}</dd>
        </div>
        {solicitacao.fornecedor && (
          <div>
            <dt className="muted">Fornecedor</dt>
            <dd>{solicitacao.fornecedor}</dd>
          </div>
        )}
        {solicitacao.formaPagamento && (
          <div>
            <dt className="muted">Forma de pagamento</dt>
            <dd>
              {FORMA_PAGAMENTO_LEGIVEL[solicitacao.formaPagamento] ??
                solicitacao.formaPagamento}
            </dd>
          </div>
        )}
        {solicitacao.centroCusto && (
          <div>
            <dt className="muted">Centro de custo</dt>
            <dd>{solicitacao.centroCusto.nome}</dd>
          </div>
        )}
        {solicitacao.centroResultado && (
          <div>
            <dt className="muted">Centro de resultado</dt>
            <dd>{solicitacao.centroResultado.nome}</dd>
          </div>
        )}
        {solicitacao.contaContabil && (
          <div>
            <dt className="muted">Conta contábil</dt>
            <dd>{solicitacao.contaContabil.nome}</dd>
          </div>
        )}
        <div>
          <dt className="muted">Empresa</dt>
          <dd>{solicitacao.empresa.nome}</dd>
        </div>
        {solicitacao.categoriaDespesaPessoal && (
          <div>
            <dt className="muted">Categoria da despesa</dt>
            <dd>{solicitacao.categoriaDespesaPessoal.nome}</dd>
          </div>
        )}
        {solicitacao.numeroPedido && (
          <div>
            <dt className="muted">Nº do pedido</dt>
            <dd>{solicitacao.numeroPedido}</dd>
          </div>
        )}
        {solicitacao.dataVencimento && (
          <div>
            <dt className="muted">Data de vencimento</dt>
            <dd>{solicitacao.dataVencimento.toLocaleDateString("pt-BR")}</dd>
          </div>
        )}
        {solicitacao.dataRdv && (
          <div>
            <dt className="muted">Data da RDV</dt>
            <dd>{formatarData(solicitacao.dataRdv)}</dd>
          </div>
        )}
        {solicitacao.numeroRdv && (
          <div>
            <dt className="muted">Nº da RDV</dt>
            <dd>{solicitacao.numeroRdv}</dd>
          </div>
        )}
        {solicitacao.valorCartaoOnfly != null && (
          <div>
            <dt className="muted">Valor pago no cartão ONFLY</dt>
            <dd>{formatarReais(solicitacao.valorCartaoOnfly)}</dd>
          </div>
        )}
        {solicitacao.possuiAdiantamento != null && (
          <div>
            <dt className="muted">Possui adiantamento</dt>
            <dd>{solicitacao.possuiAdiantamento ? "Sim" : "Não"}</dd>
          </div>
        )}
        {solicitacao.linkCompra && (
          <div>
            <dt className="muted">Link da compra</dt>
            <dd>
              <a
                href={solicitacao.linkCompra}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
                style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
              >
                {solicitacao.linkCompra}
              </a>
            </dd>
          </div>
        )}
        {solicitacao.informacoesComplementares && (
          <div>
            <dt className="muted">Informações complementares</dt>
            <dd>{solicitacao.informacoesComplementares}</dd>
          </div>
        )}
        {solicitacao.cotacaoUrl && (
          <div>
            <dt className="muted">Cotação/orçamento</dt>
            <dd>
              {cotacaoUrlAssinada ? (
                <a
                  href={cotacaoUrlAssinada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Baixar cotação
                </a>
              ) : (
                "Link indisponível no momento — atualize a página."
              )}
            </dd>
          </div>
        )}
        {solicitacao.motivoRejeicao && (
          <div>
            <dt className="muted">Motivo da rejeição</dt>
            <dd>{solicitacao.motivoRejeicao}</dd>
          </div>
        )}
        {solicitacao.motivoRecusaPagamento && (
          <div>
            <dt className="muted">Motivo da recusa do pagamento</dt>
            <dd>{solicitacao.motivoRecusaPagamento}</dd>
          </div>
        )}
        {solicitacao.comprador && (
          <div>
            <dt className="muted">Comprador</dt>
            <dd>{solicitacao.comprador.nome}</dd>
          </div>
        )}
        {solicitacao.previsaoChegada && (
          <div>
            <dt className="muted">Previsão de chegada</dt>
            <dd>{formatarData(solicitacao.previsaoChegada)}</dd>
          </div>
        )}
        {solicitacao.notaFiscalUrls.length > 0 && (
          <div>
            <dt className="muted">Nota fiscal/comprovante</dt>
            <dd className="flex flex-col gap-1">
              {solicitacao.notaFiscalUrls.map((_url, indice) => {
                const urlAssinada = notaFiscalUrlsAssinadas?.[indice];
                return (
                  <span key={indice}>
                    {urlAssinada ? (
                      <a
                        href={urlAssinada}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                      >
                        Baixar anexo{solicitacao.notaFiscalUrls.length > 1 ? ` ${indice + 1}` : ""}
                      </a>
                    ) : (
                      "Link indisponível no momento — atualize a página."
                    )}
                  </span>
                );
              })}
            </dd>
          </div>
        )}
        {solicitacao.fornecedorDocumento && (
          <div>
            <dt className="muted">CNPJ/CPF do fornecedor</dt>
            <dd>{solicitacao.fornecedorDocumento}</dd>
          </div>
        )}
        {solicitacao.metodoPagamento && (
          <div>
            <dt className="muted">Método de pagamento</dt>
            <dd>
              {METODO_PAGAMENTO_LEGIVEL[solicitacao.metodoPagamento] ??
                solicitacao.metodoPagamento}
            </dd>
          </div>
        )}
        {solicitacao.dadosPagamento && (
          <div>
            <dt className="muted">Dados de pagamento</dt>
            <dd>{solicitacao.dadosPagamento}</dd>
          </div>
        )}
        {solicitacao.comprovantePagamentoUrl && (
          <div>
            <dt className="muted">Comprovante de pagamento</dt>
            <dd>
              {comprovantePagamentoUrlAssinada ? (
                <a
                  href={comprovantePagamentoUrlAssinada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Baixar comprovante
                </a>
              ) : (
                "Link indisponível no momento — atualize a página."
              )}
            </dd>
          </div>
        )}
      </dl>
      <LinhaDoTempo historico={solicitacao.historico} />
    </>
  );
}
