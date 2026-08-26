import { notFound } from "next/navigation";
import { atualizarDepartamentoAction } from "@/app/admin/actions";
import { DepartamentoForm } from "../_components/departamento-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarFuncionarios, obterDepartamento } from "@/lib/departamentos";

export default async function EditarDepartamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { id } = await params;
  const [departamento, funcionarios] = await Promise.all([
    obterDepartamento(id),
    listarFuncionarios(),
  ]);

  if (!departamento) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar departamento</h1>
      <DepartamentoForm
        funcionarios={funcionarios}
        defaultValues={departamento}
        action={atualizarDepartamentoAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
