import { formatarReais } from "@/lib/format";
import type { obterSolicitacao } from "@/lib/workflow";
import { METODO_PAGAMENTO_LEGIVEL } from "./metodo-pagamento-legivel";

const STATUS_LEGIVEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado — aguardando aprovação do responsável",
  AGUARDANDO_NIVEL2: "Aguardando aprovação do diretor",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  COMPRA_CONFIRMADA: "Compra confirmada",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_RECUSADO: "Pagamento recusado",
  PAGO: "Pago",
};

const FORMA_PAGAMENTO_LEGIVEL: Record<string, string> = {
  ADIANTAMENTO: "Adiantamento",
  A_VISTA: "À vista",
  PARCELADO: "Parcelado",
};

export function DetalhesSolicitacao({
  solicitacao,
  notaFiscalUrlAssinada,
  comprovantePagamentoUrlAssinada,
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
  // URLs temporárias (Supabase Storage é privado) para baixar os anexos,
  // geradas pelo Server Component pai a partir dos caminhos guardados em
  // solicitacao.notaFiscalUrl/comprovantePagamentoUrl (que não são URLs
  // utilizáveis diretamente) — ver src/lib/storage.ts. null quando não há
  // anexo ou a URL não pôde ser gerada.
  notaFiscalUrlAssinada?: string | null;
  comprovantePagamentoUrlAssinada?: string | null;
}) {
  return (
    <dl className="flex flex-col gap-2">
      <div>
        <dt className="text-sm text-gray-600">Status</dt>
        <dd>{STATUS_LEGIVEL[solicitacao.status] ?? solicitacao.status}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Descrição</dt>
        <dd>{solicitacao.descricao}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Valor</dt>
        <dd>{formatarReais(solicitacao.valor)}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Departamento</dt>
        <dd>{solicitacao.departamento.nome}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Tipo de compra</dt>
        <dd>{solicitacao.tipoCompra.nome}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Fornecedor</dt>
        <dd>{solicitacao.fornecedor}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Forma de pagamento</dt>
        <dd>
          {FORMA_PAGAMENTO_LEGIVEL[solicitacao.formaPagamento] ??
            solicitacao.formaPagamento}
        </dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Centro de custo</dt>
        <dd>{solicitacao.centroCusto.nome}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Centro de resultado</dt>
        <dd>{solicitacao.centroResultado.nome}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Conta contábil</dt>
        <dd>{solicitacao.contaContabil.nome}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-600">Empresa</dt>
        <dd>{solicitacao.empresa.nome}</dd>
      </div>
      {solicitacao.linkCompra && (
        <div>
          <dt className="text-sm text-gray-600">Link da compra</dt>
          <dd>
            <a
              href={solicitacao.linkCompra}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {solicitacao.linkCompra}
            </a>
          </dd>
        </div>
      )}
      {solicitacao.informacoesComplementares && (
        <div>
          <dt className="text-sm text-gray-600">Informações complementares</dt>
          <dd>{solicitacao.informacoesComplementares}</dd>
        </div>
      )}
      {solicitacao.motivoRejeicao && (
        <div>
          <dt className="text-sm text-gray-600">Motivo da rejeição</dt>
          <dd>{solicitacao.motivoRejeicao}</dd>
        </div>
      )}
      {solicitacao.motivoRecusaPagamento && (
        <div>
          <dt className="text-sm text-gray-600">Motivo da recusa do pagamento</dt>
          <dd>{solicitacao.motivoRecusaPagamento}</dd>
        </div>
      )}
      {solicitacao.comprador && (
        <div>
          <dt className="text-sm text-gray-600">Comprador</dt>
          <dd>{solicitacao.comprador.nome}</dd>
        </div>
      )}
      {solicitacao.notaFiscalUrl && (
        <div>
          <dt className="text-sm text-gray-600">Nota fiscal/comprovante</dt>
          <dd>
            {notaFiscalUrlAssinada ? (
              <a
                href={notaFiscalUrlAssinada}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
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
          <dt className="text-sm text-gray-600">CNPJ/CPF do fornecedor</dt>
          <dd>{solicitacao.fornecedorDocumento}</dd>
        </div>
      )}
      {solicitacao.metodoPagamento && (
        <div>
          <dt className="text-sm text-gray-600">Método de pagamento</dt>
          <dd>
            {METODO_PAGAMENTO_LEGIVEL[solicitacao.metodoPagamento] ??
              solicitacao.metodoPagamento}
          </dd>
        </div>
      )}
      {solicitacao.dadosPagamento && (
        <div>
          <dt className="text-sm text-gray-600">Dados de pagamento</dt>
          <dd>{solicitacao.dadosPagamento}</dd>
        </div>
      )}
      {solicitacao.comprovantePagamentoUrl && (
        <div>
          <dt className="text-sm text-gray-600">Comprovante de pagamento</dt>
          <dd>
            {comprovantePagamentoUrlAssinada ? (
              <a
                href={comprovantePagamentoUrlAssinada}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
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
  );
}
