// Shared by the nível-1 (responsável) and nível-2 (diretor) approval
// sections on the solicitação detail page — identical shape, only the
// title and which Server Actions get bound differ per level.
export function PainelAprovacao({
  titulo,
  solicitacaoId,
  aprovarAction,
  rejeitarAction,
}: {
  titulo: string;
  solicitacaoId: string;
  aprovarAction: (id: string, formData: FormData) => Promise<void>;
  rejeitarAction: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">{titulo}</h2>
      <form action={aprovarAction.bind(null, solicitacaoId)}>
        <button
          type="submit"
          className="btn-primary"
        >
          Aprovar
        </button>
      </form>
      <form
        action={rejeitarAction.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        <label className="field">
          Motivo da rejeição
          <textarea
            name="motivo"
            required
            className="input-field"
          />
        </label>
        <button type="submit" className="btn-secondary">
          Rejeitar
        </button>
      </form>
    </div>
  );
}
