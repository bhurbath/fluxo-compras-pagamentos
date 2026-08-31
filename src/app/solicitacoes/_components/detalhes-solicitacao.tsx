import { formatarReais } from "@/lib/format";
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
  notaFiscalUrlAssinada,
  comprovantePagamentoUrlAssinada,
  cotacaoUrlAssinada,
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
  // URLs temporárias (Supabase Storage é privado) para baixar os anexos,
  // geradas pelo Server Component pai a partir dos caminhos guardados em
  // solicitacao.notaFiscalUrl/comprovantePagamentoUrl/cotacaoUrl (que não são
  // URLs utilizáveis diretamente) — ver src/lib/storage.ts. null quando não
  // há anexo ou a URL não pôde ser gerada.
  notaFiscalUrlAssinada?: string | null;
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
        <div>
          <dt className="muted">Fornecedor</dt>
          <dd>{solicitacao.fornecedor}</dd>
        </div>
        <div>
          <dt className="muted">Forma de pagamento</dt>
          <dd>
            {FORMA_PAGAMENTO_LEGIVEL[solicitacao.formaPagamento] ??
              solicitacao.formaPagamento}
          </dd>
        </div>
        <div>
          <dt className="muted">Centro de custo</dt>
          <dd>{solicitacao.centroCusto.nome}</dd>
        </div>
        <div>
          <dt className="muted">Centro de resultado</dt>
          <dd>{solicitacao.centroResultado.nome}</dd>
        </div>
        <div>
          <dt className="muted">Conta contábil</dt>
          <dd>{solicitacao.contaContabil.nome}</dd>
        </div>
        <div>
          <dt className="muted">Empresa</dt>
          <dd>{solicitacao.empresa.nome}</dd>
        </div>
        {solicitacao.linkCompra && (
          <div>
            <dt className="muted">Link da compra</dt>
            <dd>
              <a
                href={solicitacao.linkCompra}
                target="_blank"
                rel="noopener noreferrer"
                className="link"
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
        {solicitacao.notaFiscalUrl && (
          <div>
            <dt className="muted">Nota fiscal/comprovante</dt>
            <dd>
              {notaFiscalUrlAssinada ? (
                <a
                  href={notaFiscalUrlAssinada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  Baixar anexo
                </a>
              ) : (
                "Link indisponível no momento — atualize a página."
              )}
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
