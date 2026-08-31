import { criarTipoCompraAction } from "@/app/admin/actions";
import { TipoCompraForm } from "../_components/tipo-compra-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";

export default async function NovoTipoCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Novo tipo de compra</h1>
      <ErroMensagem erro={erro} />
      <TipoCompraForm action={criarTipoCompraAction} submitLabel="Criar tipo" />
    </div>
  );
}
