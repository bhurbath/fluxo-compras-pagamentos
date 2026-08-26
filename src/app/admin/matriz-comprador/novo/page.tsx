import { criarEntradaMatrizAction } from "@/app/admin/actions";
import { MatrizForm } from "../_components/matriz-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos, listarFuncionarios } from "@/lib/departamentos";
import { listarTiposCompra } from "@/lib/tipos-compra";

export default async function NovaEntradaMatrizPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const [departamentos, tiposCompra, funcionarios] = await Promise.all([
    listarDepartamentos(),
    listarTiposCompra(),
    listarFuncionarios(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nova entrada na matriz</h1>
      <ErroMensagem erro={erro} />
      <MatrizForm
        departamentos={departamentos}
        tiposCompra={tiposCompra}
        funcionarios={funcionarios}
        action={criarEntradaMatrizAction}
        submitLabel="Criar entrada"
      />
    </div>
  );
}
