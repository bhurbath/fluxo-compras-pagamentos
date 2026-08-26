import { atribuirDepartamentoAction } from "@/app/admin/actions";
import { AcessoRestrito } from "../_components/acesso-restrito";
import { ErroMensagem } from "../_components/erro-mensagem";
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
      <h1 className="text-xl font-semibold">Funcionários</h1>
      <ErroMensagem erro={erro} />

      {funcionarios.length === 0 ? (
        <p>Nenhum funcionário cadastrado ainda (aparecem aqui após o primeiro login).</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Nome</th>
              <th className="p-2">E-mail</th>
              <th className="p-2">Financeiro</th>
              <th className="p-2">Departamento</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((funcionario) => (
              <tr key={funcionario.id} className="border-b">
                <td className="p-2">{funcionario.nome}</td>
                <td className="p-2">{funcionario.email}</td>
                <td className="p-2">{funcionario.flagFinanceiro ? "Sim" : "—"}</td>
                <td className="p-2">
                  <form
                    action={atribuirDepartamentoAction}
                    className="flex items-center gap-2"
                  >
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
                      className="rounded border px-2 py-1"
                    >
                      <option value="">— nenhum —</option>
                      {departamentos.map((departamento) => (
                        <option key={departamento.id} value={departamento.id}>
                          {departamento.nome}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded border px-2 py-1">
                      Salvar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
