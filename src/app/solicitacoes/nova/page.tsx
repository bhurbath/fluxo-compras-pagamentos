import { redirect } from "next/navigation";
import { criarEEnviarAction, criarRascunhoAction } from "../actions";
import { CamposSolicitacao } from "../_components/campos-solicitacao";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { listarListasSolicitacao } from "@/lib/solicitacao-listas";

export default async function NovaSolicitacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const { erro } = await searchParams;
  const listas = await listarListasSolicitacao();

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "30rem" }}>
        <div className="panel flex flex-col gap-4">
          <h1 className="page-title">Nova solicitação de compra</h1>

          <ErroMensagem erro={erro} />

          <form className="flex flex-col gap-3">
            <CamposSolicitacao
              defaultValues={{ departamentoId: usuario.departamentoId ?? "" }}
              {...listas}
            />
            <div className="flex gap-3" style={{ marginTop: "0.25rem" }}>
              <button
                type="submit"
                formAction={criarRascunhoAction}
                className="btn-secondary"
              >
                Salvar rascunho
              </button>
              <button
                type="submit"
                formAction={criarEEnviarAction}
                className="btn-primary"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
