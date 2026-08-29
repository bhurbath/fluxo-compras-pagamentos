import type { Usuario } from "@prisma/client";

export function DepartamentoForm({
  funcionarios,
  defaultValues,
  action,
  submitLabel,
}: {
  funcionarios: Usuario[];
  defaultValues?: { nome: string; responsavelId: string; diretorId: string };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3 max-w-sm">
      <label className="field">
        Nome
        <input
          name="nome"
          defaultValue={defaultValues?.nome}
          required
          className="input-field"
        />
      </label>
      <label className="field">
        Responsável (nível 1)
        <select
          name="responsavelId"
          defaultValue={defaultValues?.responsavelId ?? ""}
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
      <label className="field">
        Diretor (nível 2)
        <select
          name="diretorId"
          defaultValue={defaultValues?.diretorId ?? ""}
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
