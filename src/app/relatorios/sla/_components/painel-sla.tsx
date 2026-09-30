import Link from "next/link";
import { STATUS_LEGIVEL } from "@/app/solicitacoes/_components/status-legivel";
import {
  CATEGORIA_LEGIVEL,
  DONO_LEGIVEL,
  type EstatisticasSla,
  type ItemFilaParada,
  type RelatorioSla,
} from "@/lib/sla";

// "3d 4h" acima de 24h (mais fácil de ler um número de dias do que "76h"),
// "12,3h" abaixo disso. Sempre uma casa decimal na parte de horas — o
// suficiente pra distinguir "2h" de "2,9h" sem virar ruído de precisão
// falsa (o cálculo já é só uma soma de timestamps, não precisa de mais
// casas que isso).
function formatarHoras(horas: number): string {
  if (horas <= 0) return "—";
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    const resto = horas - dias * 24;
    return `${dias}d ${resto.toFixed(0)}h`;
  }
  return `${horas.toFixed(1)}h`;
}

function CardEstatistica({ titulo, stats, nota }: { titulo: string; stats: EstatisticasSla; nota?: string }) {
  return (
    <div className="card-block" style={{ flex: "1 1 14rem" }}>
      <h2 className="section-title">{titulo}</h2>
      {stats.contagem === 0 ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <dl className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <dt className="muted">Média</dt>
            <dd style={{ fontWeight: 600 }}>{formatarHoras(stats.mediaHoras)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="muted">Mediana</dt>
            <dd>{formatarHoras(stats.medianaHoras)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="muted">P90</dt>
            <dd>{formatarHoras(stats.p90Horas)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="muted">Pior caso</dt>
            <dd>{formatarHoras(stats.maxHoras)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="muted">Amostras</dt>
            <dd>{stats.contagem}</dd>
          </div>
        </dl>
      )}
      {nota && <p className="muted-xs">{nota}</p>}
    </div>
  );
}

export function PainelSla({
  params,
  dataInvalida,
  relatorio,
  tendenciaMensal,
  filaParada,
}: {
  params: { de?: string; ate?: string };
  dataInvalida: boolean;
  relatorio: RelatorioSla;
  tendenciaMensal: { mes: string; financeiroMediaHoras: number; contagem: number }[];
  filaParada: ItemFilaParada[];
}) {
  const categoriasComDados = (Object.keys(CATEGORIA_LEGIVEL) as (keyof typeof CATEGORIA_LEGIVEL)[])
    .map((categoria) => ({ categoria, stats: relatorio.porCategoria[categoria] }))
    .filter((c) => c.stats.contagem > 0);

  const maxTendencia = Math.max(1, ...tendenciaMensal.map((m) => m.financeiroMediaHoras));

  return (
    <>
      <form
        method="GET"
        className="panel"
        style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", alignItems: "flex-end" }}
      >
        <label className="field" style={{ minWidth: "9rem" }}>
          Pago de
          <input type="date" name="de" defaultValue={params.de ?? ""} className="input-field" />
        </label>
        <label className="field" style={{ minWidth: "9rem" }}>
          Pago até
          <input type="date" name="ate" defaultValue={params.ate ?? ""} className="input-field" />
        </label>
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
      </form>

      {dataInvalida && <p className="error-text">Data inválida.</p>}

      <div className="flex flex-wrap gap-3" style={{ marginTop: "1rem" }}>
        <CardEstatistica
          titulo="SLA do Financeiro"
          stats={relatorio.financeiro}
          nota="Registrar pagamento + anexar comprovante + confirmar baixa de adiantamento — só as etapas em que a próxima ação é da analista."
        />
        <CardEstatistica
          titulo='"Aprovado" → "Pago" (literal)'
          stats={relatorio.aprovadoAPago}
          nota="Inclui o tempo do comprador executar a compra — não isola só o Financeiro. Use o card ao lado pra isso."
        />
        <CardEstatistica titulo="SLA do comprador" stats={relatorio.comprador} />
        <CardEstatistica titulo="Aprovação (responsável/diretor)" stats={relatorio.aprovacaoGestor} />
        <CardEstatistica
          titulo="Correções (rejeição/recusa)"
          stats={relatorio.correcoes}
          nota="Tempo parado esperando o solicitante/comprador corrigir e reenviar — não é SLA de ninguém, mas mostra quanto tempo o processo perde nisso."
        />
      </div>

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>
        Detalhe por etapa
      </h2>
      {categoriasComDados.length === 0 ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem", overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Média</th>
                <th>Mediana</th>
                <th>P90</th>
                <th>Pior caso</th>
                <th>Amostras</th>
              </tr>
            </thead>
            <tbody>
              {categoriasComDados.map(({ categoria, stats }) => (
                <tr key={categoria}>
                  <td>{CATEGORIA_LEGIVEL[categoria]}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatarHoras(stats.mediaHoras)}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatarHoras(stats.medianaHoras)}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatarHoras(stats.p90Horas)}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatarHoras(stats.maxHoras)}</td>
                  <td>{stats.contagem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>
        SLA do Financeiro por tipo de compra
      </h2>
      {relatorio.porTipoCompra.length === 0 ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem", overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Tipo de compra</th>
                <th>Média</th>
                <th>Mediana</th>
                <th>Amostras</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.porTipoCompra.map((linha) => (
                <tr key={linha.tipoCompra}>
                  <td>{linha.tipoCompra}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatarHoras(linha.financeiro.mediaHoras)}
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatarHoras(linha.financeiro.medianaHoras)}
                  </td>
                  <td>{linha.financeiro.contagem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>
        Tendência mensal (SLA do Financeiro, histórico completo)
      </h2>
      {tendenciaMensal.length === 0 ? (
        <p className="muted">Sem dados suficientes ainda.</p>
      ) : (
        <div className="panel flex flex-col gap-2">
          {tendenciaMensal.map((m) => (
            <div key={m.mes} className="flex items-center gap-3">
              <span className="muted" style={{ width: "4.5rem", flex: "none" }}>
                {m.mes}
              </span>
              <div
                style={{
                  flex: 1,
                  background: "var(--line-soft)",
                  borderRadius: 6,
                  height: "1.1rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(m.financeiroMediaHoras / maxTendencia) * 100}%`,
                    background: "var(--accent)",
                    height: "100%",
                    borderRadius: 6,
                  }}
                />
              </div>
              <span style={{ width: "5rem", flex: "none", fontVariantNumeric: "tabular-nums" }}>
                {formatarHoras(m.financeiroMediaHoras)}
              </span>
              <span className="muted-xs" style={{ width: "5rem", flex: "none" }}>
                {m.contagem} {m.contagem === 1 ? "solicitação" : "solicitações"}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: "1.5rem" }}>
        Fila parada agora
      </h2>
      <p className="muted">
        Solicitações em aberto agora, da mais parada para a mais recente — independente do
        filtro de período acima.
      </p>
      {filaParada.length === 0 ? (
        <p className="muted">Nada em aberto no momento.</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem", overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Status</th>
                <th>Com quem está</th>
                <th>Parada há</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filaParada.map((item) => (
                <tr key={item.id}>
                  <td>{item.descricao}</td>
                  <td>{STATUS_LEGIVEL[item.status] ?? item.status}</td>
                  <td>{DONO_LEGIVEL[item.dono]}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {formatarHoras(item.horasParada)}
                  </td>
                  <td className="text-right">
                    <Link href={`/solicitacoes/${item.id}`} className="link">
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
  );
}
