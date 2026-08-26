import { notFound } from "next/navigation";
import { atualizarTipoCompraAction } from "@/app/admin/actions";
import { TipoCompraForm } from "../_components/tipo-compra-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "../../_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { obterTipoCompra } from "@/lib/tipos-compra";

export default async function EditarTipoCompraPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { id } = await params;
  const { erro } = await searchParams;
  const tipo = await obterTipoCompra(id);

  if (!tipo) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar tipo de compra</h1>
      <ErroMensagem erro={erro} />
      <TipoCompraForm
        defaultValues={{ nome: tipo.nome }}
        action={atualizarTipoCompraAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
