import { redirect } from "next/navigation";
import { criarEEnviarAction, criarRascunhoAction } from "../actions";
import { ErroMensagem } from "@/app/_components/erro-mensagem";
import { getUsuarioAutenticado } from "@/lib/require-usuario";
import { listarDepartamentos } from "@/lib/departamentos";
import { listarTiposCompra } from "@/lib/tipos-compra";
import { listarCentrosCusto } from "@/lib/centro-custo";
import { listarCentrosResultado } from "@/lib/centro-resultado";
import { listarContasContabeis } from "@/lib/conta-contabil";
import { listarEmpresas } from "@/lib/empresa";

const FORMAS_PAGAMENTO = [
  { value: "ADIANTAMENTO", label: "Adiantamento" },
  { value: "A_VISTA", label: "À vista" },
  { value: "PARCELADO", label: "Parcelado" },
];

export default async function NovaSolicitacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/");
  }

  const { erro } = await searchParams;
  const [departamentos, tiposCompra, centrosCusto, centrosResultado, contasContabeis, empresas] =
    await Promise.all([
      listarDepartamentos(),
      listarTiposCompra(),
      listarCentrosCusto(),
      listarCentrosResultado(),
      listarContasContabeis(),
      listarEmpresas(),
    ]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">Nova solicitação de compra</h1>

        <ErroMensagem erro={erro} />

        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            Descrição
            <textarea
              name="descricao"
              required
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Valor (R$)
            <input
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Departamento
            <select
              name="departamentoId"
              defaultValue={usuario.departamentoId ?? ""}
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Tipo de compra
            <select
              name="tipoCompraId"
              defaultValue=""
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {tiposCompra.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Fornecedor
            <input
              name="fornecedor"
              type="text"
              required
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Forma de pagamento
            <select
              name="formaPagamento"
              defaultValue=""
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Centro de custo
            <select
              name="centroCustoId"
              defaultValue=""
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {centrosCusto.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Centro de resultado
            <select
              name="centroResultadoId"
              defaultValue=""
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {centrosResultado.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Conta contábil
            <select
              name="contaContabilId"
              defaultValue=""
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {contasContabeis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Empresa
            <select
              name="empresaId"
              defaultValue=""
              required
              className="rounded border px-2 py-1"
            >
              <option value="">Selecione</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Link da compra (opcional)
            <input
              name="linkCompra"
              type="text"
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Informações complementares (opcional)
            <textarea
              name="informacoesComplementares"
              className="rounded border px-2 py-1"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              formAction={criarRascunhoAction}
              className="rounded border px-4 py-2"
            >
              Salvar rascunho
            </button>
            <button
              type="submit"
              formAction={criarEEnviarAction}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
