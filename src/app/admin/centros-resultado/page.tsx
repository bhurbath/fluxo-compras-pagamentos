import { excluirCentroResultadoAction } from "@/app/admin/actions";
import { ListaNomeSimples } from "@/app/admin/_components/lista-nome-simples";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarCentrosResultado } from "@/lib/centro-resultado";

export default async function CentrosResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const centros = await listarCentrosResultado();

  return (
    <ListaNomeSimples
      titulo="Centros de resultado"
      itens={centros}
      basePath="/admin/centros-resultado"
      novoLabel="Novo centro de resultado"
      excluirAction={(id) => excluirCentroResultadoAction.bind(null, id)}
      confirmMessage="Excluir este centro de resultado? Não será possível excluir se ele estiver em uso em alguma solicitação."
      vazioMensagem="Nenhum centro de resultado cadastrado ainda."
      erro={erro}
    />
  );
}
