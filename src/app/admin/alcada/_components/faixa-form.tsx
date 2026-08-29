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
      <label className="field">
        Valor mínimo (R$)
        <input
          name="valorMin"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.valorMin}
          required
          className="input-field"
        />
      </label>
      <label className="field">
        Valor máximo (R$) — deixe em branco para &quot;sem limite&quot;
        <input
          name="valorMax"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.valorMax}
          className="input-field"
        />
      </label>
      <label className="field-inline">
        <input
          name="exigeNivel2"
          type="checkbox"
          defaultChecked={defaultValues?.exigeNivel2}
        />
        Exige aprovação de nível 2 (diretor)
      </label>
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
