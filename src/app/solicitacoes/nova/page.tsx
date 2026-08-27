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
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">Nova solicitação de compra</h1>

        <ErroMensagem erro={erro} />

        <form className="flex flex-col gap-3">
          <CamposSolicitacao
            defaultValues={{ departamentoId: usuario.departamentoId ?? "" }}
            {...listas}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              formAction={criarRascunhoAction}
              className="rounded border px-4 py-2"
            >
              Salvar rascunho
            </button>
            <button
              type="submit"
              formAction={criarEEnviarAction}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
