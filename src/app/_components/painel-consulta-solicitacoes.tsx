import Link from "next/link";
import { formatarReais, formatarDataHora } from "@/lib/format";
import { STATUS_LEGIVEL } from "../solicitacoes/_components/status-legivel";
import { StatusPill } from "../solicitacoes/_components/status-pill";

type Lista = { id: string; nome: string };

type SolicitacaoConsulta = {
  id: string;
  criadoEm: Date;
  descricao: string;
  valor: number | string | { toString(): string };
  status: string;
  solicitante: { nome: string };
  departamento: { nome: string };
  tipoCompra: { nome: string };
  comprador: { nome: string } | null;
};

// Compartilhado por /consultar (Financeiro, vê todos os departamentos) e
// /departamento (gestor, vê só os departamentos onde é responsável e/ou
// diretor) — mesmo filtro e mesma tabela, só o que muda entre as duas
// telas é a lista de departamentos e as próprias solicitações já filtradas,
// que cada página resolve à sua maneira (a restrição por departamento do
// gestor é decidida na query da página, não aqui — ver src/app/departamento
// /page.tsx).
export function PainelConsultaSolicitacoes({
  titulo,
  descricao,
  departamentos,
  mostrarFiltroDepartamento = true,
  params,
  statusInvalido,
  dataInvalida,
  solicitacoes,
}: {
  titulo: string;
  descricao: string;
  departamentos: Lista[];
  mostrarFiltroDepartamento?: boolean;
  params: { departamentoId?: string; status?: string; de?: string; ate?: string };
  statusInvalido: boolean;
  dataInvalida: boolean;
  solicitacoes: SolicitacaoConsulta[];
}) {
  return (
    <>
      <h1 className="page-title">{titulo}</h1>
      <p className="muted">{descricao}</p>

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
        {mostrarFiltroDepartamento && (
          <label className="field" style={{ minWidth: "12rem" }}>
            Departamento
            <select
              name="departamentoId"
              defaultValue={params.departamentoId ?? ""}
              className="input-field"
            >
              <option value="">Todos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field" style={{ minWidth: "12rem" }}>
          Status
          <select name="status" defaultValue={params.status ?? ""} className="input-field">
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
    </>
  );
}
