import { criarDepartamentoAction } from "@/app/admin/actions";
import { DepartamentoForm } from "../_components/departamento-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "../../_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarFuncionarios } from "@/lib/departamentos";

export default async function NovoDepartamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const funcionarios = await listarFuncionarios();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Novo departamento</h1>
      <ErroMensagem erro={erro} />
      <DepartamentoForm
        funcionarios={funcionarios}
        action={criarDepartamentoAction}
        submitLabel="Criar departamento"
      />
    </div>
  );
}
