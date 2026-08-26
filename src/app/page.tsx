import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Fluxo de Compras e Pagamentos</h1>
      {session?.user ? (
        <>
          <p>
            Logado como <strong>{session.user.name}</strong> ({session.user.email})
          </p>
          <Link
            href="/solicitacoes/nova"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Nova solicitação de compra
          </Link>
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
