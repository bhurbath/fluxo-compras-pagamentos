import { CamposSolicitacao } from "./campos-solicitacao";
import { construirDefaultValuesSolicitacao } from "./default-values-solicitacao";
import type { listarListasSolicitacao } from "@/lib/solicitacao-listas";
import type { obterSolicitacao } from "@/lib/workflow";

export function PainelEdicaoReenvio({
  solicitacao,
  listas,
  action,
  dataVencimentoMinima,
  valoresPreservados,
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
  listas: Awaited<ReturnType<typeof listarListasSolicitacao>>;
  action: (id: string, formData: FormData) => Promise<void>;
  // Ver comentário em CamposSolicitacao — só orienta o navegador, não
  // substitui a checagem em validarCriarSolicitacao.
  dataVencimentoMinima?: string;
  // Ver comentário em CamposSolicitacao — quando presente (edição/reenvio
  // anterior falhou), tem prioridade sobre os defaultValues derivados do
  // banco logo abaixo.
  valoresPreservados?: Record<string, string>;
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
          defaultValues={construirDefaultValuesSolicitacao(solicitacao)}
          valoresPreservados={valoresPreservados}
          {...listas}
          dataVencimentoMinima={dataVencimentoMinima}
        />
        <button type="submit" className="btn-primary">
          Salvar e reenviar
        </button>
      </form>
    </div>
  );
}
