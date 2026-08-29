import Link from "next/link";
import { formatarReais } from "@/lib/format";
import { StatusPill } from "../solicitacoes/_components/status-pill";

// Compartilhado por /aprovacoes ("Pendentes de mim") e /solicitacoes ("Minhas
// solicitações") — mesma tabela, só a coluna Solicitante e o texto do link
// variam por caso de uso (a própria lista de solicitações não precisa
// mostrar o solicitante, que é sempre quem está vendo a página).
type LinhaSolicitacao = {
  id: string;
  descricao: string;
  valor: number | string | { toString(): string };
  status: string;
  departamento: { nome: string };
  solicitante?: { nome: string };
};

export function TabelaSolicitacoes({
  titulo,
  itens,
  vazioMensagem,
  mostrarSolicitante = true,
  linkTexto = "Revisar",
}: {
  // Omitido quando a página já tem um <h1> que diz a mesma coisa (ex:
  // "Minhas solicitações" com uma única tabela) — evita um <h2> redundante.
  titulo?: string;
  itens: LinhaSolicitacao[];
  vazioMensagem: string;
  mostrarSolicitante?: boolean;
  linkTexto?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {titulo && <h2 className="section-title">{titulo}</h2>}
      {itens.length === 0 ? (
        <p className="muted">{vazioMensagem}</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
          <table className="table-base">
            <thead>
              <tr>
                {mostrarSolicitante && <th>Solicitante</th>}
                <th>Descrição</th>
                <th>Valor</th>
                <th>Departamento</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((s) => (
                <tr key={s.id}>
                  {mostrarSolicitante && <td>{s.solicitante?.nome}</td>}
                  <td>{s.descricao}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatarReais(s.valor)}
                  </td>
                  <td>{s.departamento.nome}</td>
                  <td>
                    <StatusPill status={s.status} />
                  </td>
                  <td className="text-right">
                    <Link href={`/solicitacoes/${s.id}`} className="link">
                      {linkTexto}
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
