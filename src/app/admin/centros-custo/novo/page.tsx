import { criarCentroCustoAction } from "@/app/admin/actions";
import { NomeSimplesForm } from "@/app/admin/_components/nome-simples-form";
import { AcessoRestrito } from "../../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";

export default async function NovoCentroCustoPage({
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
      <h1 className="text-xl font-semibold">Novo centro de custo</h1>
      <ErroMensagem erro={erro} />
      <NomeSimplesForm
        label="Nome"
        action={criarCentroCustoAction}
        submitLabel="Criar centro de custo"
      />
    </div>
  );
}
