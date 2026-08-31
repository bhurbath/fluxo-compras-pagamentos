export function TipoCompraForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: { nome: string; compradorEhSolicitante: boolean };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3" style={{ maxWidth: "24rem" }}>
      <label className="field">
        Nome
        <input
          name="nome"
          defaultValue={defaultValues?.nome}
          required
          className="input-field"
        />
      </label>
      <label className="field-inline">
        <input
          name="compradorEhSolicitante"
          type="checkbox"
          defaultChecked={defaultValues?.compradorEhSolicitante}
        />
        O comprador é o próprio solicitante (pula a matriz de comprador e a designação
        manual — quem pediu é quem executa a contratação)
      </label>
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
