import { BotaoEnviar } from "@/app/_components/botao-enviar";
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
  titulo = "Editar e reenviar",
  aviso,
}: {
  // Reaproveitado para editar uma solicitação ainda aguardando aprovação
  // (ver editarAntesDaAprovacao) — mesmo formulário, título e aviso próprios.
  titulo?: string;
  aviso?: string;
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
      <h2 className="section-title">{titulo}</h2>
      {aviso && <p className="muted">{aviso}</p>}
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
        <BotaoEnviar labelPendente="Reenviando…">Salvar e reenviar</BotaoEnviar>
      </form>
    </div>
  );
}
