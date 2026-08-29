import { formatarDataHora } from "@/lib/format";
import type { obterSolicitacao } from "@/lib/workflow";
import { EVENTO_LEGIVEL } from "./evento-legivel";

type Historico = NonNullable<
  Awaited<ReturnType<typeof obterSolicitacao>>
>["historico"];

export function LinhaDoTempo({ historico }: { historico: Historico }) {
  return (
    <div
      className="flex flex-col gap-3"
      style={{ marginTop: "0.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--line-soft)" }}
    >
      <h2 className="section-title">Histórico</h2>
      <ol
        className="flex flex-col gap-3"
        style={{ borderLeft: "2px solid var(--line)", paddingLeft: "1rem" }}
      >
        {historico.map((h) => (
          <li key={h.id}>
            <p style={{ fontSize: "0.875rem" }}>
              <strong>{EVENTO_LEGIVEL[h.evento] ?? h.evento}</strong>
              {" — "}
              {h.ator?.nome ?? "Sistema"}
            </p>
            <p className="muted-xs">{formatarDataHora(h.criadoEm)}</p>
            {h.detalhe && <p className="muted-xs">{h.detalhe}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
