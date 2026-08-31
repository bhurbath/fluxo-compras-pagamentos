import { alternarFinanceiroAction, atribuirDepartamentoAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos, listarFuncionarios } from "@/lib/departamentos";

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuarioAtual = await getFinanceiroUsuario();
  if (!usuarioAtual) {
    return <AcessoRestrito />;
  }

  const { erro } = await searchParams;
  const [funcionarios, departamentos] = await Promise.all([
    listarFuncionarios(),
    listarDepartamentos(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Funcionários</h1>
      <ErroMensagem erro={erro} />

      {funcionarios.length === 0 ? (
        <p className="muted">
          Nenhum funcionário cadastrado ainda (aparecem aqui após o primeiro login).
        </p>
      ) : (
        <div className="panel" style={{ padding: "0.5rem 1.25rem" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Financeiro</th>
                <th>Departamento</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((funcionario) => (
                <tr key={funcionario.id}>
                  <td>{funcionario.nome}</td>
                  <td>{funcionario.email}</td>
                  <td>
                    {funcionario.id === usuarioAtual.id ? (
                      // Ninguém remove a própria flag pela UI (ver
                      // alternarFlagFinanceiro em lib/departamentos.ts) — sem
                      // isso dá pra se trancar fora do /admin sem ter mais
                      // como se auto-corrigir sem o script de novo.
                      <span className="muted-xs">Sim (você)</span>
                    ) : (
                      <form action={alternarFinanceiroAction} className="field-inline">
                        <input type="hidden" name="usuarioId" value={funcionario.id} />
                        <input
                          type="hidden"
                          name="valor"
                          value={(!funcionario.flagFinanceiro).toString()}
                        />
                        <button
                          type="submit"
                          className={funcionario.flagFinanceiro ? "link-danger" : "link"}
                          style={{ fontSize: "0.875rem" }}
                        >
                          {funcionario.flagFinanceiro ? "Remover Financeiro" : "Tornar Financeiro"}
                        </button>
                      </form>
                    )}
                  </td>
                  <td>
                    <form action={atribuirDepartamentoAction} className="field-inline">
                      <input type="hidden" name="usuarioId" value={funcionario.id} />
                      <select
                        // Keyed on the current value so a Server Action
                        // refresh remounts (not just re-renders) this select —
                        // `defaultValue` on an uncontrolled input only applies
                        // at mount, so without a key change the dropdown would
                        // keep showing the pre-save value after "Salvar".
                        key={funcionario.departamentoId ?? "none"}
                        name="departamentoId"
                        defaultValue={funcionario.departamentoId ?? ""}
                        className="input-field"
                      >
                        <option value="">— nenhum —</option>
                        {departamentos.map((departamento) => (
                          <option key={departamento.id} value={departamento.id}>
                            {departamento.nome}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="btn-secondary btn-sm">
                        Salvar
                      </button>
                    </form>
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
