import Link from "next/link";
import { excluirFaixaAlcadaAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { ExcluirButton } from "../_components/excluir-button";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarFaixasAlcada } from "@/lib/alcada";
import { formatarReais } from "@/lib/format";

export default async function AlcadaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const faixas = await listarFaixasAlcada();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Faixas de alçada</h1>
        <Link
          href="/admin/alcada/novo"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Nova faixa
        </Link>
      </div>

      <ErroMensagem erro={erro} />

      {faixas.length === 0 ? (
        <p>Nenhuma faixa de alçada cadastrada ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Valor mínimo</th>
              <th className="p-2">Valor máximo</th>
              <th className="p-2">Exige nível 2</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {faixas.map((faixa) => (
              <tr key={faixa.id} className="border-b">
                <td className="p-2">{formatarReais(faixa.valorMin)}</td>
                <td className="p-2">
                  {faixa.valorMax ? formatarReais(faixa.valorMax) : "sem limite"}
                </td>
                <td className="p-2">{faixa.exigeNivel2 ? "Sim" : "Não"}</td>
                <td className="p-2 flex gap-3">
                  <Link href={`/admin/alcada/${faixa.id}`} className="underline">
                    Editar
                  </Link>
                  <ExcluirButton
                    action={excluirFaixaAlcadaAction.bind(null, faixa.id)}
                    confirmMessage="Excluir esta faixa de alçada? Essa ação não pode ser desfeita."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
