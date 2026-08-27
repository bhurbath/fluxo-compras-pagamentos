import { CamposSolicitacao } from "./campos-solicitacao";
import type { listarListasSolicitacao } from "@/lib/solicitacao-listas";
import type { obterSolicitacao } from "@/lib/workflow";

export function PainelEdicaoReenvio({
  solicitacao,
  listas,
  action,
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
  listas: Awaited<ReturnType<typeof listarListasSolicitacao>>;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">Editar e reenviar</h2>
      <form action={action.bind(null, solicitacao.id)} className="flex flex-col gap-3">
        <CamposSolicitacao
          defaultValues={{
            descricao: solicitacao.descricao,
            valor: solicitacao.valor.toString(),
            departamentoId: solicitacao.departamentoId,
            tipoCompraId: solicitacao.tipoCompraId,
            fornecedor: solicitacao.fornecedor,
            formaPagamento: solicitacao.formaPagamento,
            centroCustoId: solicitacao.centroCustoId,
            centroResultadoId: solicitacao.centroResultadoId,
            contaContabilId: solicitacao.contaContabilId,
            empresaId: solicitacao.empresaId,
            linkCompra: solicitacao.linkCompra,
            informacoesComplementares: solicitacao.informacoesComplementares,
          }}
          {...listas}
        />
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Salvar e reenviar
        </button>
      </form>
    </div>
  );
}
