import { notFound } from "next/navigation";
import { atualizarEntradaMatrizAction } from "@/app/admin/actions";
import { MatrizForm } from "../_components/matriz-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "../../_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos, listarFuncionarios } from "@/lib/departamentos";
import { listarTiposCompra } from "@/lib/tipos-compra";
import { obterEntradaMatriz } from "@/lib/matriz-comprador";

export default async function EditarEntradaMatrizPage({
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
  const [entrada, departamentos, tiposCompra, funcionarios] = await Promise.all([
    obterEntradaMatriz(id),
    listarDepartamentos(),
    listarTiposCompra(),
    listarFuncionarios(),
  ]);

  if (!entrada) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar entrada da matriz</h1>
      <ErroMensagem erro={erro} />
      <MatrizForm
        departamentos={departamentos}
        tiposCompra={tiposCompra}
        funcionarios={funcionarios}
        defaultValues={entrada}
        action={atualizarEntradaMatrizAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
