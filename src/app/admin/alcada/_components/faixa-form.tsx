export function FaixaForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: { valorMin: string; valorMax: string; exigeNivel2: boolean };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3 max-w-sm">
      <label className="flex flex-col gap-1">
        Valor mínimo (R$)
        <input
          name="valorMin"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.valorMin}
          required
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        Valor máximo (R$) — deixe em branco para &quot;sem limite&quot;
        <input
          name="valorMax"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.valorMax}
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          name="exigeNivel2"
          type="checkbox"
          defaultChecked={defaultValues?.exigeNivel2}
        />
        Exige aprovação de nível 2 (diretor)
      </label>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
        {submitLabel}
      </button>
    </form>
  );
}
