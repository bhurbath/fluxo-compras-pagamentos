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
        <h1 className="text-xl font-semibold">{titulo}</h1>
        <Link
          href={`${basePath}/novo`}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {novoLabel}
        </Link>
      </div>

      <ErroMensagem erro={erro} />

      {itens.length === 0 ? (
        <p>{vazioMensagem}</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nome</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{item.nome}</td>
                <td className="p-2 flex gap-3">
                  <Link href={`${basePath}/${item.id}`} className="underline">
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
      )}
    </div>
  );
}
