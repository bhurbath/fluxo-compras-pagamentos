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
        <h1 className="page-title">Faixas de alçada</h1>
        <Link
          href="/admin/alcada/novo"
          className="btn-primary"
        >
          Nova faixa
        </Link>
      </div>

      <ErroMensagem erro={erro} />

      {faixas.length === 0 ? (
        <p className="muted">Nenhuma faixa de alçada cadastrada ainda.</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Valor mínimo</th>
                <th>Valor máximo</th>
                <th>Exige nível 2</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {faixas.map((faixa) => (
                <tr key={faixa.id}>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatarReais(faixa.valorMin)}
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {faixa.valorMax ? formatarReais(faixa.valorMax) : "sem limite"}
                  </td>
                  <td>{faixa.exigeNivel2 ? "Sim" : "Não"}</td>
                  <td className="flex gap-4 justify-end">
                    <Link href={`/admin/alcada/${faixa.id}`} className="link">
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
        </div>
      )}
    </div>
  );
}
