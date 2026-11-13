import { BotaoEnviar } from "@/app/_components/botao-enviar";

// Primeira etapa da confirmação de pagamento (ver registrarPagamento em
// workflow.ts) — nunca pede comprovante aqui, nem para os tipos de compra
// que exigem um: isso fica pra PainelConfirmarComprovante, a segunda etapa,
// que só aparece depois que essa primeira for concluída.
export function PainelRegistrarPagamento({
  solicitacaoId,
  registrarAction,
  recusarAction,
}: {
  solicitacaoId: string;
  registrarAction: (id: string, formData: FormData) => Promise<void>;
  recusarAction: (id: string, formData: FormData) => Promise<void>;
}) {
  return (
    <div className="card-block">
      <h2 className="section-title">Aprovação de pagamento (Financeiro)</h2>
      <form
        action={registrarAction.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        <label className="field">
          Data prevista do pagamento
          <input
            type="date"
            name="dataPrevistaPagamento"
            required
            className="input-field"
          />
        </label>
        <BotaoEnviar labelPendente="Registrando…">Registrar pagamento</BotaoEnviar>
      </form>
      <form
        action={recusarAction.bind(null, solicitacaoId)}
        className="flex flex-col gap-2"
      >
        <label className="field">
          Motivo da recusa
          <textarea
            name="motivo"
            required
            className="input-field"
          />
        </label>
        <BotaoEnviar labelPendente="Recusando…" className="btn-secondary">Recusar</BotaoEnviar>
      </form>
    </div>
  );
}
