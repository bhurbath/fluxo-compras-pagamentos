import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusSolicitacao } from "@prisma/client";
import { aprovarNivel1Action, rejeitarAction } from "@/app/aprovacoes/actions";
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

  // The solicitante can always view their own request. The department's
  // responsável (nível 1 approver) can view it too, but only once it has
  // actually been submitted — not a draft the solicitante hasn't sent for
  // approval yet. Later tickets (diretor, comprador, Financeiro) will
  // broaden this further as those roles are built.
  const podeVer =
    solicitacao !== null &&
    (solicitacao.solicitanteId === usuario.id ||
      (solicitacao.departamento.responsavelId === usuario.id &&
        solicitacao.status !== StatusSolicitacao.RASCUNHO));
  if (!solicitacao || !podeVer) {
    notFound();
  }

  const podeAprovarNivel1 =
    solicitacao.status === StatusSolicitacao.ENVIADO &&
    solicitacao.departamento.responsavelId === usuario.id;

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
          {solicitacao.motivoRejeicao && (
            <div>
              <dt className="text-sm text-gray-600">Motivo da rejeição</dt>
              <dd>{solicitacao.motivoRejeicao}</dd>
            </div>
          )}
        </dl>

        {podeAprovarNivel1 && (
          <div className="flex flex-col gap-3 rounded border p-4">
            <h2 className="font-semibold">Aprovação de nível 1</h2>
            <form action={aprovarNivel1Action.bind(null, solicitacao.id)}>
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Aprovar
              </button>
            </form>
            <form
              action={rejeitarAction.bind(null, solicitacao.id)}
              className="flex flex-col gap-2"
            >
              <label className="flex flex-col gap-1">
                Motivo da rejeição
                <textarea
                  name="motivo"
                  required
                  className="rounded border px-2 py-1"
                />
              </label>
              <button type="submit" className="rounded border px-4 py-2">
                Rejeitar
              </button>
            </form>
          </div>
        )}

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
