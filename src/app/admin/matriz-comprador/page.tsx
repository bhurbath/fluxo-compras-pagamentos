import Link from "next/link";
import { excluirEntradaMatrizAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "../_components/erro-mensagem";
import { ExcluirButton } from "../_components/excluir-button";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarMatrizComprador } from "@/lib/matriz-comprador";

export default async function MatrizCompradorPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const entradas = await listarMatrizComprador();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Matriz de comprador</h1>
        <Link
          href="/admin/matriz-comprador/novo"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Nova entrada
        </Link>
      </div>

      <p className="text-sm text-gray-600">
        Define quem compra para cada combinação de departamento e tipo de compra. Nem toda
        combinação precisa de uma entrada — sem uma, a designação cai para o Financeiro decidir
        manualmente.
      </p>

      <ErroMensagem erro={erro} />

      {entradas.length === 0 ? (
        <p>Nenhuma entrada cadastrada ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Departamento</th>
              <th className="p-2">Tipo de compra</th>
              <th className="p-2">Comprador</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((entrada) => (
              <tr key={entrada.id} className="border-b">
                <td className="p-2">{entrada.departamento.nome}</td>
                <td className="p-2">{entrada.tipoCompra.nome}</td>
                <td className="p-2">{entrada.comprador.nome}</td>
                <td className="p-2 flex gap-3">
                  <Link href={`/admin/matriz-comprador/${entrada.id}`} className="underline">
                    Editar
                  </Link>
                  <ExcluirButton
                    action={excluirEntradaMatrizAction.bind(null, entrada.id)}
                    confirmMessage="Excluir esta entrada da matriz? Solicitações dessa combinação passarão a cair para o Financeiro designar manualmente."
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
