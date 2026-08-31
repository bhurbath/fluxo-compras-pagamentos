import Link from "next/link";
import type { StatusSolicitacao } from "@prisma/client";
import { AcessoRestrito } from "../admin/_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos } from "@/lib/departamentos";
import { listarSolicitacoesParaExportar } from "@/lib/workflow";
import { formatarReais, formatarDataHora, parseDataFiltro } from "@/lib/format";
import { STATUS_LEGIVEL } from "../solicitacoes/_components/status-legivel";
import { StatusPill } from "../solicitacoes/_components/status-pill";

export default async function ConsultarPage({
  searchParams,
}: {
  searchParams: Promise<{ departamentoId?: string; status?: string; de?: string; ate?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
    return <AcessoRestrito />;
  }

  const params = await searchParams;
  const departamentoId = params.departamentoId || undefined;

  const statusParam = params.status || undefined;
  const statusInvalido = Boolean(statusParam && !(statusParam in STATUS_LEGIVEL));

  const de = parseDataFiltro(params.de ?? null, "inicio");
  const ate = parseDataFiltro(params.ate ?? null, "fim");
  const dataInvalida = de === null || ate === null;

  const [departamentos, solicitacoes] = await Promise.all([
    listarDepartamentos(),
    statusInvalido || dataInvalida
      ? Promise.resolve([])
      : listarSolicitacoesParaExportar({
          departamentoId,
          status: statusInvalido ? undefined : (statusParam as StatusSolicitacao | undefined),
          de: de ?? undefined,
          ate: ate ?? undefined,
        }),
  ]);

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "64rem" }}>
        <h1 className="page-title">Consultar solicitações</h1>
        <p className="muted">Todas as solicitações do sistema, com o status atual de cada uma.</p>

        <form method="GET" className="panel" style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", alignItems: "flex-end" }}>
          <label className="field" style={{ minWidth: "9rem" }}>
            De
            <input type="date" name="de" defaultValue={params.de ?? ""} className="input-field" />
          </label>
          <label className="field" style={{ minWidth: "9rem" }}>
            Até
            <input type="date" name="ate" defaultValue={params.ate ?? ""} className="input-field" />
          </label>
          <label className="field" style={{ minWidth: "12rem" }}>
            Departamento
            <select name="departamentoId" defaultValue={departamentoId ?? ""} className="input-field">
              <option value="">Todos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
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
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
        </form>

        {(statusInvalido || dataInvalida) && (
          <p className="error-text">
            {statusInvalido ? "Status inválido. " : ""}
            {dataInvalida ? "Data inválida." : ""}
          </p>
        )}

        {!statusInvalido && !dataInvalida && (
          <>
            <p className="muted">
              {solicitacoes.length}{" "}
              {solicitacoes.length === 1 ? "solicitação encontrada" : "solicitações encontradas"}
            </p>
            {solicitacoes.length === 0 ? (
              <p className="muted">Nenhuma solicitação corresponde a esses filtros.</p>
            ) : (
              <div className="panel" style={{ padding: "0.5rem 1.25rem", overflowX: "auto" }}>
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Solicitante</th>
                      <th>Departamento</th>
                      <th>Tipo de compra</th>
                      <th>Valor</th>
                      <th>Comprador</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.map((s) => (
                      <tr key={s.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{formatarDataHora(s.criadoEm)}</td>
                        <td>{s.descricao}</td>
                        <td>{s.solicitante.nome}</td>
                        <td>{s.departamento.nome}</td>
                        <td>{s.tipoCompra.nome}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {formatarReais(s.valor)}
                        </td>
                        <td>{s.comprador?.nome ?? "—"}</td>
                        <td>
                          <StatusPill status={s.status} />
                        </td>
                        <td className="text-right">
                          <Link href={`/solicitacoes/${s.id}`} className="link">
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <Link href="/" className="link">
          &larr; Voltar
        </Link>
      </div>
    </main>
  );
}
