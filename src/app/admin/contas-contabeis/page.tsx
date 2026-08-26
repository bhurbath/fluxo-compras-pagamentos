import { excluirContaContabilAction } from "@/app/admin/actions";
import { ListaNomeSimples } from "@/app/admin/_components/lista-nome-simples";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarContasContabeis } from "@/lib/conta-contabil";

export default async function ContasContabeisPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const contas = await listarContasContabeis();

  return (
    <ListaNomeSimples
      titulo="Contas contábeis"
      itens={contas}
      basePath="/admin/contas-contabeis"
      novoLabel="Nova conta contábil"
      excluirAction={(id) => excluirContaContabilAction.bind(null, id)}
      confirmMessage="Excluir esta conta contábil? Não será possível excluir se ela estiver em uso em alguma solicitação."
      vazioMensagem="Nenhuma conta contábil cadastrada ainda."
      erro={erro}
    />
  );
}
