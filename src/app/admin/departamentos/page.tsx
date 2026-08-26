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
        <h1 className="text-xl font-semibold">Departamentos</h1>
        <Link
          href="/admin/departamentos/novo"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Novo departamento
        </Link>
      </div>

      {departamentos.length === 0 ? (
        <p>Nenhum departamento cadastrado ainda.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nome</th>
              <th className="p-2">Responsável</th>
              <th className="p-2">Diretor</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {departamentos.map((departamento) => (
              <tr key={departamento.id} className="border-b">
                <td className="p-2">{departamento.nome}</td>
                <td className="p-2">{departamento.responsavel.nome}</td>
                <td className="p-2">{departamento.diretor.nome}</td>
                <td className="p-2">
                  <Link
                    href={`/admin/departamentos/${departamento.id}`}
                    className="underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
