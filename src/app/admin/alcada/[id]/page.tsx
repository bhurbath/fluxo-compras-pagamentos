import { notFound } from "next/navigation";
import { atualizarFaixaAlcadaAction } from "@/app/admin/actions";
import { FaixaForm } from "../_components/faixa-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { obterFaixaAlcada } from "@/lib/alcada";

export default async function EditarFaixaAlcadaPage({
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
  const faixa = await obterFaixaAlcada(id);

  if (!faixa) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Editar faixa de alçada</h1>
      <ErroMensagem erro={erro} />
      <FaixaForm
        defaultValues={{
          valorMin: faixa.valorMin.toString(),
          valorMax: faixa.valorMax?.toString() ?? "",
          exigeNivel2: faixa.exigeNivel2,
        }}
        action={atualizarFaixaAlcadaAction.bind(null, id)}
        submitLabel="Salvar"
      />
    </div>
  );
}
