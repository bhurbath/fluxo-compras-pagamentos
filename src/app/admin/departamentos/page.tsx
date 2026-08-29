import Link from "next/link";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos } from "@/lib/departamentos";

export default async function DepartamentosPage() {
  // Re-checked here, not just in the layout: a layout swapping out
  // {children} does not stop this page from fetching/rendering its own
  // data, so the guard has to run before listarDepartamentos() too.
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const departamentos = await listarDepartamentos();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Departamentos</h1>
        <Link
          href="/admin/departamentos/novo"
          className="btn-primary"
        >
          Novo departamento
        </Link>
      </div>

      {departamentos.length === 0 ? (
        <p className="muted">Nenhum departamento cadastrado ainda.</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Responsável</th>
                <th>Diretor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departamentos.map((departamento) => (
                <tr key={departamento.id}>
                  <td>{departamento.nome}</td>
                  <td>{departamento.responsavel.nome}</td>
                  <td>{departamento.diretor.nome}</td>
                  <td className="text-right">
                    <Link href={`/admin/departamentos/${departamento.id}`} className="link">
                      Editar
                    </Link>
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
