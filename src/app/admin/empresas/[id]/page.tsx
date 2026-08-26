import { notFound } from "next/navigation";
import { atualizarEmpresaAction } from "@/app/admin/actions";
import { NomeSimplesForm } from "@/app/admin/_components/nome-simples-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { obterEmpresa } from "@/lib/empresa";

export default async function EditarEmpresaPage({
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
  const empresa = await obterEmpresa(id);

  if (!empresa) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar empresa</h1>
      <ErroMensagem erro={erro} />
      <NomeSimplesForm
        label="Nome"
        defaultValues={{ nome: empresa.nome }}
        action={atualizarEmpresaAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
