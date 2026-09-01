import { notFound } from "next/navigation";
import { atualizarCategoriaDespesaPessoalAction } from "@/app/admin/actions";
import { NomeSimplesForm } from "@/app/admin/_components/nome-simples-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { obterCategoriaDespesaPessoal } from "@/lib/categoria-despesa-pessoal";

export default async function EditarCategoriaDespesaPessoalPage({
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
  const categoria = await obterCategoriaDespesaPessoal(id);

  if (!categoria) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Editar categoria de despesa de pessoal</h1>
      <ErroMensagem erro={erro} />
      <NomeSimplesForm
        label="Nome"
        defaultValues={{ nome: categoria.nome }}
        action={atualizarCategoriaDespesaPessoalAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
