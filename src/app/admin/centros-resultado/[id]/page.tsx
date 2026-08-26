import { notFound } from "next/navigation";
import { atualizarCentroResultadoAction } from "@/app/admin/actions";
import { NomeSimplesForm } from "@/app/admin/_components/nome-simples-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { obterCentroResultado } from "@/lib/centro-resultado";

export default async function EditarCentroResultadoPage({
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
  const centro = await obterCentroResultado(id);

  if (!centro) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar centro de resultado</h1>
      <ErroMensagem erro={erro} />
      <NomeSimplesForm
        label="Nome"
        defaultValues={{ nome: centro.nome }}
        action={atualizarCentroResultadoAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
