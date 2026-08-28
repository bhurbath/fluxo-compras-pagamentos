import Link from "next/link";
import { AcessoRestrito } from "../admin/_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos } from "@/lib/departamentos";
import { STATUS_LEGIVEL } from "../solicitacoes/_components/status-legivel";

export default async function ExportarPage() {
  // Mesmo padrão das páginas de /admin: o layout não filha esta rota (fica
  // fora de /admin de propósito — não é uma tela de cadastro), então a
  // checagem é só aqui.
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const departamentos = await listarDepartamentos();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">Exportar solicitações</h1>
        <p className="text-sm text-gray-600">
          Gera um CSV com todas as solicitações que atendem aos filtros abaixo.
        </p>

        {/* GET simples: os filtros viram query string e o navegador baixa
            o CSV como resposta — não precisa de Server Action. */}
        <form
          action="/api/solicitacoes/exportar"
          method="GET"
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1">
            De
            <input type="date" name="de" className="rounded border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            Até
            <input type="date" name="ate" className="rounded border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            Departamento
            <select
              name="departamentoId"
              defaultValue=""
              className="rounded border px-2 py-1"
            >
              <option value="">Todos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Status
            <select name="status" defaultValue="" className="rounded border px-2 py-1">
              <option value="">Todos</option>
              {Object.entries(STATUS_LEGIVEL).map(([valor, legivel]) => (
                <option key={valor} value={valor}>
                  {legivel}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
            Exportar CSV
          </button>
        </form>

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
