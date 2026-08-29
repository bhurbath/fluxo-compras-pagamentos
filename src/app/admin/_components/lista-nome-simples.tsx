import Link from "next/link";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { ExcluirButton } from "./excluir-button";

export function ListaNomeSimples({
  titulo,
  itens,
  basePath,
  novoLabel,
  excluirAction,
  confirmMessage,
  vazioMensagem,
  erro,
}: {
  titulo: string;
  itens: { id: string; nome: string }[];
  basePath: string;
  novoLabel: string;
  excluirAction: (id: string) => (formData: FormData) => Promise<void>;
  confirmMessage: string;
  vazioMensagem: string;
  erro?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{titulo}</h1>
        <Link href={`${basePath}/novo`} className="btn-primary">
          {novoLabel}
        </Link>
      </div>

      <ErroMensagem erro={erro} />

      {itens.length === 0 ? (
        <p className="muted">{vazioMensagem}</p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td className="flex gap-4 justify-end">
                    <Link href={`${basePath}/${item.id}`} className="link">
                      Editar
                    </Link>
                    <ExcluirButton
                      action={excluirAction(item.id)}
                      confirmMessage={confirmMessage}
                    />
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
