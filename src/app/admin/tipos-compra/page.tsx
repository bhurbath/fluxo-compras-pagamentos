import Link from "next/link";
import { excluirTipoCompraAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
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
        <h1 className="page-title">Tipos de compra</h1>
        <Link href="/admin/tipos-compra/novo" className="btn-primary">
          Novo tipo
        </Link>
      </div>

      <ErroMensagem erro={erro} />

      {tipos.length === 0 ? (
        <p className="muted">Nenhum tipo de compra cadastrado ainda.</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Comprador é o solicitante</th>
                <th>Despesa de pessoal</th>
                <th>Exige previsão de chegada</th>
                <th>Dispensa fornecedor/forma</th>
                <th>Empresa fixa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td>{tipo.nome}</td>
                  <td>{tipo.compradorEhSolicitante ? "Sim" : "Não"}</td>
                  <td>{tipo.despesaPessoal ? "Sim" : "Não"}</td>
                  <td>{tipo.exigePrevisaoChegada ? "Sim" : "Não"}</td>
                  <td>{tipo.dispensaFornecedorForma ? "Sim" : "Não"}</td>
                  <td>{tipo.empresaFixa?.nome ?? "—"}</td>
                  <td className="flex gap-4 justify-end">
                    <Link href={`/admin/tipos-compra/${tipo.id}`} className="link">
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
        </div>
      )}
    </div>
  );
}
