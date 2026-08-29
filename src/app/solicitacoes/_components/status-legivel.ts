// Compartilhado entre a visualização de detalhe da solicitação e a listagem
// "Minhas solicitações"/"Pendentes de mim" — um único lugar para os rótulos
// de status não saírem de sincronia.
export const STATUS_LEGIVEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado — aguardando aprovação do responsável",
  AGUARDANDO_NIVEL2: "Aguardando aprovação do diretor",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  COMPRA_CONFIRMADA: "Compra confirmada",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_RECUSADO: "Pagamento recusado",
  PAGO: "Pago",
};

// Tom visual do status na UI (ver StatusPill) — mesma ideia do
// STATUS_LEGIVEL acima, só que mapeando para uma cor em vez de um texto.
export const STATUS_TONE: Record<string, "progress" | "success" | "danger" | undefined> = {
  RASCUNHO: undefined,
  ENVIADO: "progress",
  AGUARDANDO_NIVEL2: "progress",
  APROVADO: "progress",
  REJEITADO: "danger",
  COMPRA_CONFIRMADA: "progress",
  AGUARDANDO_PAGAMENTO: "progress",
  PAGAMENTO_RECUSADO: "danger",
  PAGO: "success",
};
