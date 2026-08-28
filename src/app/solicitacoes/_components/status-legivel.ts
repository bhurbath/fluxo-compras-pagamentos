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
