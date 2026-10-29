import { redirect } from "next/navigation";
import { criarEEnviarAction, criarRascunhoAction } from "../actions";
import { CamposSolicitacao } from "../_components/campos-solicitacao";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { listarListasSolicitacao } from "@/lib/solicitacao-listas";
import { adicionarDiasUteis } from "@/lib/dias-uteis";
import { DIAS_UTEIS_VENCIMENTO_COMPRADOR_SOLICITANTE, obterSolicitacao } from "@/lib/workflow";
import { lerFormularioPreservado } from "@/lib/redirect-with-error";
import { construirDefaultValuesCopia } from "../_components/default-values-solicitacao";

export default async function NovaSolicitacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; copiarDe?: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const { erro, copiarDe } = await searchParams;
  const [listas, valoresPreservados, original] = await Promise.all([
    listarListasSolicitacao(),
    lerFormularioPreservado(),
    copiarDe ? obterSolicitacao(copiarDe) : null,
  ]);
  // Só o próprio solicitante copia — de qualquer outra pessoa (ou de um id
  // que não existe), o formulário abre em branco como sempre.
  const copia = original && original.solicitanteId === usuario.id ? original : null;
  // "Compras pelo solicitante" (ver TipoCompra.compradorEhSolicitante) —
  // usado só como `min` do <input type="date"> em CamposSolicitacao
  // (orientação do navegador); validarCriarSolicitacao no servidor é quem
  // garante a regra de verdade.
  const dataVencimentoMinima = adicionarDiasUteis(
    new Date(),
    DIAS_UTEIS_VENCIMENTO_COMPRADOR_SOLICITANTE
  )
    .toISOString()
    .slice(0, 10);

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "30rem" }}>
        <div className="panel flex flex-col gap-4">
          <h1 className="page-title">Nova solicitação de compra</h1>

          <ErroMensagem erro={erro} />

          {copia && (
            <p className="muted">
              Copiada de &ldquo;{copia.descricao}&rdquo;. Os anexos, as datas e o nº do pedido não
              são copiados — confira o valor e preencha o que mudou.
            </p>
          )}

          <form className="flex flex-col gap-3" encType="multipart/form-data">
            <CamposSolicitacao
              {...listas}
              defaultValues={copia ? construirDefaultValuesCopia(copia) : undefined}
              valoresPreservados={valoresPreservados}
              dataVencimentoMinima={dataVencimentoMinima}
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
