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
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">{titulo}</h2>
      <form action={aprovarAction.bind(null, solicitacaoId)}>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Aprovar
        </button>
      </form>
      <form
        action={rejeitarAction.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        <label className="flex flex-col gap-1">
          Motivo da rejeição
          <textarea
            name="motivo"
            required
            className="rounded border px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded border px-4 py-2">
          Rejeitar
        </button>
      </form>
    </div>
  );
}
