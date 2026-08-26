import { excluirTipoCompraAction } from "@/app/admin/actions";
import { ListaNomeSimples } from "@/app/admin/_components/lista-nome-simples";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarTiposCompra } from "@/lib/tipos-compra";

export default async function TiposCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const tipos = await listarTiposCompra();

  return (
    <ListaNomeSimples
      titulo="Tipos de compra"
      itens={tipos}
      basePath="/admin/tipos-compra"
      novoLabel="Novo tipo"
      excluirAction={(id) => excluirTipoCompraAction.bind(null, id)}
      confirmMessage="Excluir este tipo de compra? Não será possível excluir se ele estiver em uso na matriz de comprador."
      vazioMensagem="Nenhum tipo de compra cadastrado ainda."
      erro={erro}
    />
  );
}
