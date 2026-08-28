import Link from "next/link";
import { formatarReais } from "@/lib/format";
import { STATUS_LEGIVEL } from "../solicitacoes/_components/status-legivel";

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
    <div className="flex flex-col gap-2">
      {titulo && <h2 className="font-semibold">{titulo}</h2>}
      {itens.length === 0 ? (
        <p>{vazioMensagem}</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              {mostrarSolicitante && <th className="p-2">Solicitante</th>}
              <th className="p-2">Descrição</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Departamento</th>
              <th className="p-2">Situação</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((s) => (
              <tr key={s.id} className="border-b">
                {mostrarSolicitante && (
                  <td className="p-2">{s.solicitante?.nome}</td>
                )}
                <td className="p-2">{s.descricao}</td>
                <td className="p-2">{formatarReais(s.valor)}</td>
                <td className="p-2">{s.departamento.nome}</td>
                <td className="p-2">{STATUS_LEGIVEL[s.status] ?? s.status}</td>
                <td className="p-2">
                  <Link href={`/solicitacoes/${s.id}`} className="underline">
                    {linkTexto}
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
