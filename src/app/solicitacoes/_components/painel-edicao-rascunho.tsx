import { CamposSolicitacao } from "./campos-solicitacao";
import { construirDefaultValuesSolicitacao } from "./default-values-solicitacao";
import { ExcluirButton } from "@/app/admin/_components/excluir-button";
import type { listarListasSolicitacao } from "@/lib/solicitacao-listas";
import type { obterSolicitacao } from "@/lib/workflow";

// Sem isso, "Salvar rascunho" era um beco sem saída — a tela de detalhe só
// oferecia edição para uma solicitação REJEITADA (ver PainelEdicaoReenvio),
// nunca para RASCUNHO. Dois botões, como em /solicitacoes/nova: "Salvar
// rascunho" grava e continua em rascunho, "Enviar" grava e já manda para a
// primeira aprovação necessária. "Excluir" some com o rascunho de vez (ver
// excluirRascunho em workflow.ts) — sem isso, um rascunho criado por engano
// ficava para sempre em "Minhas solicitações".
export function PainelEdicaoRascunho({
  solicitacao,
  listas,
  salvarAction,
  enviarAction,
  excluirAction,
  dataVencimentoMinima,
  valoresPreservados,
}: {
  solicitacao: NonNullable<Awaited<ReturnType<typeof obterSolicitacao>>>;
  listas: Awaited<ReturnType<typeof listarListasSolicitacao>>;
  salvarAction: (id: string, formData: FormData) => Promise<void>;
  enviarAction: (id: string, formData: FormData) => Promise<void>;
  excluirAction: (id: string, formData: FormData) => Promise<void>;
  // Ver comentário em CamposSolicitacao — só orienta o navegador, não
  // substitui a checagem em validarCriarSolicitacao.
  dataVencimentoMinima?: string;
  // Ver comentário em CamposSolicitacao — quando presente (tentativa
  // anterior de salvar/enviar falhou), tem prioridade sobre os
  // defaultValues derivados do banco logo abaixo.
  valoresPreservados?: Record<string, string>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Editar rascunho</h2>
      <form
        action={salvarAction.bind(null, solicitacao.id)}
        className="flex flex-col gap-3"
        encType="multipart/form-data"
      >
        <CamposSolicitacao
          defaultValues={construirDefaultValuesSolicitacao(solicitacao)}
          valoresPreservados={valoresPreservados}
          {...listas}
          dataVencimentoMinima={dataVencimentoMinima}
        />
        <div className="flex gap-3 items-center" style={{ marginTop: "0.25rem" }}>
          <button
            type="submit"
            formAction={salvarAction.bind(null, solicitacao.id)}
            className="btn-secondary"
          >
            Salvar rascunho
          </button>
          <button
            type="submit"
            formAction={enviarAction.bind(null, solicitacao.id)}
            className="btn-primary"
          >
            Enviar
          </button>
          <div style={{ marginLeft: "auto" }}>
            <ExcluirButton
              action={excluirAction.bind(null, solicitacao.id)}
              confirmMessage="Excluir este rascunho? Essa ação não pode ser desfeita."
            />
          </div>
        </div>
      </form>
    </div>
  );
}
