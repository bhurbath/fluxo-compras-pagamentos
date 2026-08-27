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
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">Designar comprador</h2>
      <p className="text-sm text-gray-600">
        Nenhum comprador cadastrado na matriz para esse departamento e tipo de compra.
        Escolha manualmente quem vai realizar a compra.
      </p>
      <form action={action.bind(null, solicitacaoId)} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          Comprador
          <select
            name="compradorId"
            defaultValue=""
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
          Designar
        </button>
      </form>
    </div>
  );
}
