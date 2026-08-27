import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { listarPendentesNivel1 } from "@/lib/workflow";
import { formatarReais } from "@/lib/format";

export default async function AprovacoesPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const pendentes = await listarPendentesNivel1(usuario.id);

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-xl font-semibold">Aprovações pendentes</h1>

        {pendentes.length === 0 ? (
          <p>Nenhuma solicitação aguardando sua aprovação.</p>
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
              {pendentes.map((s) => (
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

        <Link href="/" className="underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}
