import { excluirCategoriaDespesaPessoalAction } from "@/app/admin/actions";
import { ListaNomeSimples } from "@/app/admin/_components/lista-nome-simples";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarCategoriasDespesaPessoal } from "@/lib/categoria-despesa-pessoal";

export default async function CategoriasDespesaPessoalPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const categorias = await listarCategoriasDespesaPessoal();

  return (
    <ListaNomeSimples
      titulo="Categorias de despesa de pessoal"
      itens={categorias}
      basePath="/admin/categorias-despesa-pessoal"
      novoLabel="Nova categoria"
      excluirAction={(id) => excluirCategoriaDespesaPessoalAction.bind(null, id)}
      confirmMessage="Excluir esta categoria? Não será possível excluir se ela estiver em uso em alguma solicitação."
      vazioMensagem="Nenhuma categoria cadastrada ainda."
      erro={erro}
    />
  );
}
