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
    <div className="min-h-screen" style={{ background: "var(--ground)" }}>
      <nav className="admin-nav">
        <Link href="/admin/departamentos">Departamentos</Link>
        <Link href="/admin/funcionarios">Funcionários</Link>
        <Link href="/admin/alcada">Alçada</Link>
        <Link href="/admin/tipos-compra">Tipos de compra</Link>
        <Link href="/admin/matriz-comprador">Matriz de comprador</Link>
        <Link href="/admin/centros-custo">Centros de custo</Link>
        <Link href="/admin/centros-resultado">Centros de resultado</Link>
        <Link href="/admin/contas-contabeis">Contas contábeis</Link>
        <Link href="/admin/empresas">Empresas</Link>
        <Link href="/" className="link" style={{ marginLeft: "auto" }}>
          Voltar ao app
        </Link>
      </nav>
      <main className="p-6 md:p-10" style={{ maxWidth: "56rem", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
