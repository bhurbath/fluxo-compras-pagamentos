// Compartilhado entre o formulário de envio para pagamento (as opções do
// select) e a visualização somente-leitura da solicitação (o rótulo
// exibido) — um único lugar para as duas pontas não saírem de sincronia.
export const METODO_PAGAMENTO_LEGIVEL: Record<string, string> = {
  PIX: "PIX",
  TED: "TED",
  BOLETO: "Boleto",
  CARTAO_CREDITO: "Cartão de crédito",
  DINHEIRO: "Dinheiro",
};
