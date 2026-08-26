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
      <label className="flex flex-col gap-1">
        Nome
        <input
          name="nome"
          defaultValue={defaultValues?.nome}
          required
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Responsável (nível 1)
        <select
          name="responsavelId"
          defaultValue={defaultValues?.responsavelId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {funcionarios.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        Diretor (nível 2)
        <select
          name="diretorId"
          defaultValue={defaultValues?.diretorId ?? ""}
          required
          className="rounded border px-2 py-1"
        >
          <option value="">Selecione</option>
          {funcionarios.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
        {submitLabel}
      </button>
    </form>
  );
}
