import Link from "next/link";
import { AcessoRestrito } from "./_components/acesso-restrito";
import { getFinanceiroUsuario } from "@/lib/admin/guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This only gates the nav chrome around {children} — it does NOT stop a
  // page component further down the tree from fetching data (Next.js layouts
  // don't prevent child segments from rendering/fetching). Every admin page
  // must independently call getFinanceiroUsuario() before touching data; see
  // src/app/admin/departamentos/page.tsx for the pattern.
  const usuario = await getFinanceiroUsuario();

  if (!usuario) {
    return <AcessoRestrito />;
  }

  return (
    <div className="min-h-screen">
      <nav className="flex gap-4 border-b p-4">
        <Link href="/admin/departamentos" className="underline">
          Departamentos
        </Link>
        <Link href="/admin/funcionarios" className="underline">
          Funcionários
        </Link>
        <Link href="/" className="ml-auto underline">
          Voltar ao app
        </Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
