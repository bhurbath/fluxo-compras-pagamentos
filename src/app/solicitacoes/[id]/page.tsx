import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { obterSolicitacao } from "@/lib/workflow";
import { formatarReais } from "@/lib/format";

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

export default async function SolicitacaoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const { id } = await params;
  const { erro } = await searchParams;
  const solicitacao = await obterSolicitacao(id);

  // Only the solicitante can view their own request for now — later tickets
  // (approvers, comprador, Financeiro) will broaden this as those roles are
  // built.
  if (!solicitacao || solicitacao.solicitanteId !== usuario.id) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">Solicitação de compra</h1>

        <ErroMensagem erro={erro} />

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
        </dl>

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
