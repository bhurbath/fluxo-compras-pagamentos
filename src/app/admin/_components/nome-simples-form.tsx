export function NomeSimplesForm({
  label,
  defaultValues,
  action,
  submitLabel,
}: {
  label: string;
  defaultValues?: { nome: string };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3" style={{ maxWidth: "24rem" }}>
      <label className="field">
        {label}
        <input
          name="nome"
          defaultValue={defaultValues?.nome}
          required
          className="input-field"
        />
      </label>
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
