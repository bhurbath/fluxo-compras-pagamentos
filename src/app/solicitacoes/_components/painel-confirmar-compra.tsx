export function PainelConfirmarCompra({
  solicitacaoId,
  action,
}: {
  solicitacaoId: string;
  action: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">Confirmar compra</h2>
      <p className="text-sm text-gray-600">
        Confirme quando a compra tiver sido realizada. O solicitante será notificado.
      </p>
      <form action={action.bind(null, solicitacaoId)}>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Confirmar compra
        </button>
      </form>
    </div>
  );
}
