import { formatarReais } from "@/lib/format";
import type { obterSolicitacao } from "@/lib/workflow";

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
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
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
    </dl>
  );
}
