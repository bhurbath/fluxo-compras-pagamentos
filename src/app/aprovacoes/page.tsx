import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import {
  listarPendentesDesignacaoComprador,
  listarPendentesNivel1,
  listarPendentesNivel2,
  listarPendentesPagamento,
} from "@/lib/workflow";
import { formatarReais } from "@/lib/format";

type Pendente = Awaited<ReturnType<typeof listarPendentesNivel1>>[number];

function TabelaPendentes({
  titulo,
  itens,
  vazioMensagem,
}: {
  titulo: string;
  itens: Pendente[];
  vazioMensagem: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold">{titulo}</h2>
      {itens.length === 0 ? (
        <p>{vazioMensagem}</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Solicitante</th>
              <th className="p-2">Descrição</th>
              <th className="p-2">Valor</th>
              <th className="p-2">Departamento</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.solicitante.nome}</td>
                <td className="p-2">{s.descricao}</td>
                <td className="p-2">{formatarReais(s.valor)}</td>
                <td className="p-2">{s.departamento.nome}</td>
                <td className="p-2">
                  <Link href={`/solicitacoes/${s.id}`} className="underline">
                    Revisar
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

export default async function AprovacoesPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const [pendentesNivel1, pendentesNivel2] = await Promise.all([
    listarPendentesNivel1(usuario.id),
    listarPendentesNivel2(usuario.id),
  ]);
  const [pendentesDesignacaoComprador, pendentesPagamento] = usuario.flagFinanceiro
    ? await Promise.all([listarPendentesDesignacaoComprador(), listarPendentesPagamento()])
    : [null, null];

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-xl font-semibold">Aprovações pendentes</h1>

        <TabelaPendentes
          titulo="Nível 1 (responsável do departamento)"
          itens={pendentesNivel1}
          vazioMensagem="Nenhuma solicitação aguardando sua aprovação de nível 1."
        />

        <TabelaPendentes
          titulo="Nível 2 (diretor)"
          itens={pendentesNivel2}
          vazioMensagem="Nenhuma solicitação aguardando sua aprovação de nível 2."
        />

        {pendentesDesignacaoComprador && (
          <TabelaPendentes
            titulo="Designação de comprador (Financeiro)"
            itens={pendentesDesignacaoComprador}
            vazioMensagem="Nenhuma solicitação aguardando designação de comprador."
          />
        )}

        {pendentesPagamento && (
          <TabelaPendentes
            titulo="Aprovação de pagamento (Financeiro)"
            itens={pendentesPagamento}
            vazioMensagem="Nenhuma solicitação aguardando aprovação de pagamento."
          />
        )}

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
