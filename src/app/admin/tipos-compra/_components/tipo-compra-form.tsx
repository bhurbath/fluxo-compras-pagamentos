export function TipoCompraForm({
  defaultValues,
  action,
  submitLabel,
}: {
  defaultValues?: {
    nome: string;
    compradorEhSolicitante: boolean;
    despesaPessoal: boolean;
    exigePrevisaoChegada: boolean;
  };
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
      <label className="field-inline">
        <input
          name="despesaPessoal"
          type="checkbox"
          defaultChecked={defaultValues?.despesaPessoal}
        />
        É despesa de pessoal (salários, encargos, benefícios, taxas — formulário reduzido,
        sem aprovação nem etapa de compra, direto para pagamento)
      </label>
      <label className="field-inline">
        <input
          name="exigePrevisaoChegada"
          type="checkbox"
          defaultChecked={defaultValues?.exigePrevisaoChegada}
        />
        Exige previsão de chegada ao confirmar a compra (ex.: Mercado Livre, cartão de
        crédito) — e o envio da nota fiscal depois avisa só o Financeiro, não o solicitante
      </label>
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
