import { notFound } from "next/navigation";
import { atualizarContaContabilAction } from "@/app/admin/actions";
import { NomeSimplesForm } from "@/app/admin/_components/nome-simples-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { obterContaContabil } from "@/lib/conta-contabil";

export default async function EditarContaContabilPage({
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
  const conta = await obterContaContabil(id);

  if (!conta) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Editar conta contábil</h1>
      <ErroMensagem erro={erro} />
      <NomeSimplesForm
        label="Nome"
        defaultValues={{ nome: conta.nome }}
        action={atualizarContaContabilAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
