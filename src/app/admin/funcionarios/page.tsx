import { atribuirDepartamentoAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getFinanceiroUsuario } from "@/lib/admin/guard";
import { listarDepartamentos, listarFuncionarios } from "@/lib/departamentos";

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getFinanceiroUsuario())) {
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
                  <td>{funcionario.flagFinanceiro ? "Sim" : "—"}</td>
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
