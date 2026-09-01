import { criarTipoCompraAction } from "@/app/admin/actions";
import { TipoCompraForm } from "../_components/tipo-compra-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarEmpresas } from "@/lib/empresa";

export default async function NovoTipoCompraPage({
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
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Novo tipo de compra</h1>
      <ErroMensagem erro={erro} />
      <TipoCompraForm empresas={empresas} action={criarTipoCompraAction} submitLabel="Criar tipo" />
    </div>
  );
}
