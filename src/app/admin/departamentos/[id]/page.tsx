import { notFound } from "next/navigation";
import { atualizarDepartamentoAction } from "@/app/admin/actions";
import { DepartamentoForm } from "../_components/departamento-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarFuncionarios, obterDepartamento } from "@/lib/departamentos";

export default async function EditarDepartamentoPage({
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
      <ErroMensagem erro={erro} />
      <DepartamentoForm
        funcionarios={funcionarios}
        defaultValues={departamento}
        action={atualizarDepartamentoAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
