import Link from "next/link";
import { redirect } from "next/navigation";
import type { StatusSolicitacao } from "@prisma/client";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { parseDataFiltro } from "@/lib/format";
import { listarMinhasSolicitacoes } from "@/lib/workflow";
import { TabelaSolicitacoes } from "../_components/tabela-solicitacoes";
import { STATUS_LEGIVEL } from "./_components/status-legivel";

export default async function MinhasSolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; de?: string; ate?: string; busca?: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const params = await searchParams;

  const statusParam = params.status || undefined;
  const statusInvalido = Boolean(statusParam && !(statusParam in STATUS_LEGIVEL));

  const de = parseDataFiltro(params.de ?? null, "inicio");
  const ate = parseDataFiltro(params.ate ?? null, "fim");
  const dataInvalida = de === null || ate === null;

  const busca = params.busca?.trim() || undefined;
  const temFiltro = Boolean(statusParam || params.de || params.ate || busca);

  const solicitacoes =
    statusInvalido || dataInvalida
      ? []
      : await listarMinhasSolicitacoes(usuario.id, {
          status: statusParam as StatusSolicitacao | undefined,
          de: de ?? undefined,
          ate: ate ?? undefined,
          busca,
        });

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "62rem" }}>
        <div className="flex items-center justify-between">
          <h1 className="page-title">Minhas solicitações</h1>
          <Link href="/solicitacoes/nova" className="btn-primary">
            Nova solicitação de compra
          </Link>
        </div>

        <form
          method="GET"
          className="panel"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", alignItems: "flex-end" }}
        >
          <label className="field" style={{ minWidth: "9rem" }}>
            De
            <input type="date" name="de" defaultValue={params.de ?? ""} className="input-field" />
          </label>
          <label className="field" style={{ minWidth: "9rem" }}>
            Até
            <input type="date" name="ate" defaultValue={params.ate ?? ""} className="input-field" />
          </label>
          <label className="field" style={{ minWidth: "12rem" }}>
            Status
            <select name="status" defaultValue={statusParam ?? ""} className="input-field">
              <option value="">Todos</option>
              {Object.entries(STATUS_LEGIVEL).map(([valor, legivel]) => (
                <option key={valor} value={valor}>
                  {legivel}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ minWidth: "12rem", flexGrow: 1 }}>
            Descrição
            <input
              type="search"
              name="busca"
              defaultValue={params.busca ?? ""}
              placeholder="Buscar na descrição"
              className="input-field"
            />
          </label>
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          {temFiltro && (
            <Link href="/solicitacoes" className="link">
              Limpar filtros
            </Link>
          )}
        </form>

        {(statusInvalido || dataInvalida) && (
          <p className="error-text">
            {statusInvalido ? "Status inválido. " : ""}
            {dataInvalida ? "Data inválida." : ""}
          </p>
        )}

        {!statusInvalido && !dataInvalida && (
          <TabelaSolicitacoes
            itens={solicitacoes}
            vazioMensagem={
              temFiltro
                ? "Nenhuma solicitação corresponde a esses filtros."
                : "Você ainda não criou nenhuma solicitação."
            }
            mostrarSolicitante={false}
            mostrarDatas
            linkTexto="Ver"
          />
        )}

        <Link href="/" className="link">
          Voltar
        </Link>
      </div>
    </main>
  );
}
