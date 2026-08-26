import { criarFaixaAlcadaAction } from "@/app/admin/actions";
import { FaixaForm } from "../_components/faixa-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";

export default async function NovaFaixaAlcadaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nova faixa de alçada</h1>
      <ErroMensagem erro={erro} />
      <FaixaForm action={criarFaixaAlcadaAction} submitLabel="Criar faixa" />
    </div>
  );
}
