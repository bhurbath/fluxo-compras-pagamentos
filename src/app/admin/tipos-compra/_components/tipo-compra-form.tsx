export function TipoCompraForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: { nome: string };
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
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
        {submitLabel}
      </button>
    </form>
  );
}
