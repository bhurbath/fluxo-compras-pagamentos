import { formatarDataHora } from "@/lib/format";
import type { obterSolicitacao } from "@/lib/workflow";
import { EVENTO_LEGIVEL } from "./evento-legivel";

type Historico = NonNullable<
  Awaited<ReturnType<typeof obterSolicitacao>>
>["historico"];

export function LinhaDoTempo({ historico }: { historico: Historico }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">Histórico</h2>
      <ol className="flex flex-col gap-3 border-l pl-4">
        {historico.map((h) => (
          <li key={h.id}>
            <p className="text-sm">
              <strong>{EVENTO_LEGIVEL[h.evento] ?? h.evento}</strong>
              {" — "}
              {h.ator?.nome ?? "Sistema"}
            </p>
            <p className="text-xs text-gray-600">{formatarDataHora(h.criadoEm)}</p>
            {h.detalhe && <p className="text-xs text-gray-600">{h.detalhe}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
