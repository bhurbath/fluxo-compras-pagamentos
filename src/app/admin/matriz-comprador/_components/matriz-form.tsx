import type { Departamento, TipoCompra, Usuario } from "@prisma/client";

export function MatrizForm({
  departamentos,
  tiposCompra,
  funcionarios,
  defaultValues,
  action,
  submitLabel,
}: {
  departamentos: Departamento[];
  tiposCompra: TipoCompra[];
  funcionarios: Usuario[];
  defaultValues?: {
    departamentoId: string;
    tipoCompraId: string;
    compradorId: string;
  };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3 max-w-sm">
      <label className="field">
        Departamento
        <select
          name="departamentoId"
          defaultValue={defaultValues?.departamentoId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Tipo de compra
        <select
          name="tipoCompraId"
          defaultValue={defaultValues?.tipoCompraId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {tiposCompra.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Comprador
        <select
          name="compradorId"
          defaultValue={defaultValues?.compradorId ?? ""}
          required
          className="input-field"
        >
          <option value="">Selecione</option>
          {funcionarios.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
