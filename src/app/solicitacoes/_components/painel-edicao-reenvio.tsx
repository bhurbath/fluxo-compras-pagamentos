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
    <div className="card-block">
      <h2 className="section-title">Editar e reenviar</h2>
      <form
        action={action.bind(null, solicitacao.id)}
        className="flex flex-col gap-3"
        encType="multipart/form-data"
      >
        <CamposSolicitacao
          defaultValues={{
            descricao: solicitacao.descricao,
            valor: solicitacao.valor.toString(),
            tipoCompraId: solicitacao.tipoCompraId,
            fornecedor: solicitacao.fornecedor,
            formaPagamento: solicitacao.formaPagamento,
            centroCustoId: solicitacao.centroCustoId,
            centroResultadoId: solicitacao.centroResultadoId,
            contaContabilId: solicitacao.contaContabilId,
            empresaId: solicitacao.empresaId,
            linkCompra: solicitacao.linkCompra,
            informacoesComplementares: solicitacao.informacoesComplementares,
            temCotacao: Boolean(solicitacao.cotacaoUrl),
            semCompra: solicitacao.semCompra,
            metodoPagamento: solicitacao.metodoPagamento,
            dadosPagamento: solicitacao.dadosPagamento,
            fornecedorDocumento: solicitacao.fornecedorDocumento,
            temAnexo: solicitacao.notaFiscalUrls.length > 0,
          }}
          {...listas}
        />
        <button type="submit" className="btn-primary">
          Salvar e reenviar
        </button>
      </form>
    </div>
  );
}
