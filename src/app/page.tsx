import Link from "next/link";
import { signIn, signOut } from "@/lib/auth";
import { getUsuarioAutenticado } from "@/lib/require-usuario";

export default async function Home() {
  const usuario = await getUsuarioAutenticado();

  return (
    <main className="shell">
      <div className="shell-inner" style={{ maxWidth: "34rem" }}>
        <div className="panel">
          <div className="flex items-center gap-3" style={{ marginBottom: "1.75rem" }}>
            <svg
              width="34"
              height="34"
              viewBox="0 0 40 40"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <circle cx="13" cy="15" r="9" fill="none" stroke="var(--accent)" strokeWidth="3.2" />
              <circle cx="27" cy="9" r="4.5" fill="none" stroke="var(--accent)" strokeWidth="2.6" />
              <circle
                cx="27"
                cy="24"
                r="10.5"
                fill="none"
                stroke="var(--ink-faint)"
                strokeWidth="3.2"
              />
            </svg>
            <div>
              <p className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.1rem" }}>
                Fluxo de Compras e Pagamentos
              </p>
              <p className="muted-xs" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Smell It · aromarketing
              </p>
            </div>
          </div>

          {usuario ? (
            <>
              <h1 className="page-title">Olá, {usuario.nome.split(" ")[0]}</h1>
              <p className="subtitle" style={{ marginTop: "0.3rem", marginBottom: "1.75rem" }}>
                Logado como <strong style={{ color: "var(--ink)" }}>{usuario.nome}</strong> (
                {usuario.email})
              </p>

              <Link href="/solicitacoes/nova" className="btn-primary" style={{ width: "100%" }}>
                Nova solicitação de compra
              </Link>

              <nav className="flex flex-col" style={{ marginTop: "1.75rem" }}>
                <p
                  className="muted-xs"
                  style={{
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Acompanhamento
                </p>
                <Link
                  href="/solicitacoes"
                  className="flex items-center justify-between"
                  style={{
                    padding: "0.7rem 0",
                    borderBottom: "1px solid var(--line-soft)",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                  }}
                >
                  Minhas solicitações
                </Link>
                <Link
                  href="/aprovacoes"
                  className="flex items-center justify-between"
                  style={{ padding: "0.7rem 0", fontWeight: 500, fontSize: "0.9rem" }}
                >
                  Pendentes de mim
                </Link>

                {usuario.flagFinanceiro && (
                  <>
                    <p
                      className="muted-xs"
                      style={{
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: "1.5rem",
                        marginBottom: "0.5rem",
                        paddingTop: "1.5rem",
                        borderTop: "1px solid var(--line-soft)",
                        fontWeight: 600,
                      }}
                    >
                      Financeiro
                    </p>
                    <Link
                      href="/consultar"
                      className="flex items-center justify-between"
                      style={{
                        padding: "0.7rem 0",
                        borderBottom: "1px solid var(--line-soft)",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                      }}
                    >
                      Consultar solicitações
                    </Link>
                    <Link
                      href="/exportar"
                      className="flex items-center justify-between"
                      style={{
                        padding: "0.7rem 0",
                        borderBottom: "1px solid var(--line-soft)",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                      }}
                    >
                      Exportar solicitações
                    </Link>
                    <Link
                      href="/admin/departamentos"
                      className="flex items-center justify-between"
                      style={{ padding: "0.7rem 0", fontWeight: 500, fontSize: "0.9rem" }}
                    >
                      Cadastros (departamentos, alçada, tipos de compra, ...)
                    </Link>
                  </>
                )}
              </nav>

              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
                style={{
                  marginTop: "1.75rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--line-soft)",
                }}
              >
                <button type="submit" className="btn-secondary btn-sm">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="page-title">Entrar</h1>
              <p className="subtitle" style={{ marginTop: "0.3rem", marginBottom: "1.75rem" }}>
                Use sua conta <strong style={{ color: "var(--ink)" }}>Microsoft</strong> da Smell
                It / aromarketing para acessar o sistema.
              </p>
              <form
                action={async () => {
                  "use server";
                  await signIn("microsoft-entra-id");
                }}
              >
                <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                  Entrar com Microsoft
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
