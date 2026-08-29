export function PainelDesignacaoComprador({
  solicitacaoId,
  funcionarios,
  action,
}: {
  solicitacaoId: string;
  funcionarios: { id: string; nome: string }[];
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Designar comprador</h2>
      <p className="muted">
        Nenhum comprador cadastrado na matriz para esse departamento e tipo de compra.
        Escolha manualmente quem vai realizar a compra.
      </p>
      <form action={action.bind(null, solicitacaoId)} className="flex flex-col gap-2">
        <label className="field">
          Comprador
          <select
            name="compradorId"
            defaultValue=""
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
          Designar
        </button>
      </form>
    </div>
  );
}
