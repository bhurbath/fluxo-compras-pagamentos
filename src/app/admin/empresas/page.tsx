import { excluirEmpresaAction } from "@/app/admin/actions";
import { ListaNomeSimples } from "@/app/admin/_components/lista-nome-simples";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarEmpresas } from "@/lib/empresa";

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const empresas = await listarEmpresas();

  return (
    <ListaNomeSimples
      titulo="Empresas"
      itens={empresas}
      basePath="/admin/empresas"
      novoLabel="Nova empresa"
      excluirAction={(id) => excluirEmpresaAction.bind(null, id)}
      confirmMessage="Excluir esta empresa? Não será possível excluir se ela estiver em uso em alguma solicitação."
      vazioMensagem="Nenhuma empresa cadastrada ainda."
      erro={erro}
    />
  );
}
