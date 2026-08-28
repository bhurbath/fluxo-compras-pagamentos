import Link from "next/link";
import { signIn, signOut } from "@/lib/auth";
import { getUsuarioAutenticado } from "@/lib/require-usuario";

export default async function Home() {
  const usuario = await getUsuarioAutenticado();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Fluxo de Compras e Pagamentos</h1>
      {usuario ? (
        <>
          <p>
            Logado como <strong>{usuario.nome}</strong> ({usuario.email})
          </p>
          <Link
            href="/solicitacoes/nova"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Nova solicitação de compra
          </Link>
          <Link href="/solicitacoes" className="underline">
            Minhas solicitações
          </Link>
          <Link href="/aprovacoes" className="underline">
            Pendentes de mim
          </Link>
          {usuario.flagFinanceiro && (
            <>
              <Link href="/exportar" className="underline">
                Exportar solicitações
              </Link>
              <Link href="/admin/departamentos" className="underline">
                Cadastros (departamentos, alçada, tipos de compra, ...)
              </Link>
            </>
          )}
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button type="submit" className="rounded bg-gray-200 px-4 py-2">
              Sair
            </button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id");
          }}
        >
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Entrar com Microsoft
          </button>
        </form>
      )}
    </main>
  );
}
