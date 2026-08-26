import Link from "next/link";
import { excluirTipoCompraAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "../_components/erro-mensagem";
import { ExcluirButton } from "../_components/excluir-button";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarTiposCompra } from "@/lib/tipos-compra";

export default async function TiposCompraPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const tipos = await listarTiposCompra();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tipos de compra</h1>
        <Link
          href="/admin/tipos-compra/novo"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Novo tipo
        </Link>
      </div>

      <ErroMensagem erro={erro} />

      {tipos.length === 0 ? (
        <p>Nenhum tipo de compra cadastrado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nome</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="border-b">
                <td className="p-2">{tipo.nome}</td>
                <td className="p-2 flex gap-3">
                  <Link href={`/admin/tipos-compra/${tipo.id}`} className="underline">
                    Editar
                  </Link>
                  <ExcluirButton
                    action={excluirTipoCompraAction.bind(null, tipo.id)}
                    confirmMessage="Excluir este tipo de compra? Não será possível excluir se ele estiver em uso na matriz de comprador."
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
