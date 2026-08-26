import { excluirCentroCustoAction } from "@/app/admin/actions";
import { ListaNomeSimples } from "@/app/admin/_components/lista-nome-simples";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarCentrosCusto } from "@/lib/centro-custo";

export default async function CentrosCustoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const centros = await listarCentrosCusto();

  return (
    <ListaNomeSimples
      titulo="Centros de custo"
      itens={centros}
      basePath="/admin/centros-custo"
      novoLabel="Novo centro de custo"
      excluirAction={(id) => excluirCentroCustoAction.bind(null, id)}
      confirmMessage="Excluir este centro de custo? Não será possível excluir se ele estiver em uso em alguma solicitação."
      vazioMensagem="Nenhum centro de custo cadastrado ainda."
      erro={erro}
    />
  );
}
