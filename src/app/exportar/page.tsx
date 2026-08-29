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
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "26rem" }}>
        <div className="panel flex flex-col gap-4">
          <h1 className="page-title">Exportar solicitações</h1>
          <p className="muted">
            Gera um CSV com todas as solicitações que atendem aos filtros abaixo.
          </p>

          {/* GET simples: os filtros viram query string e o navegador baixa
              o CSV como resposta — não precisa de Server Action. */}
          <form
            action="/api/solicitacoes/exportar"
            method="GET"
            className="flex flex-col gap-3"
          >
            <label className="field">
              De
              <input type="date" name="de" className="input-field" />
            </label>
            <label className="field">
              Até
              <input type="date" name="ate" className="input-field" />
            </label>
            <label className="field">
              Departamento
              <select name="departamentoId" defaultValue="" className="input-field">
                <option value="">Todos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Status
              <select name="status" defaultValue="" className="input-field">
                <option value="">Todos</option>
                {Object.entries(STATUS_LEGIVEL).map(([valor, legivel]) => (
                  <option key={valor} value={valor}>
                    {legivel}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-primary" style={{ marginTop: "0.25rem" }}>
              Exportar CSV
            </button>
          </form>
        </div>

        <Link href="/" className="link">
          Voltar
        </Link>
      </div>
    </main>
  );
}
