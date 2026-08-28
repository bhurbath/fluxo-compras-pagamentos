// Compartilhado entre a linha do tempo (UI) e a exportação CSV — um rótulo
// por evento gravado em registrarHistorico (src/lib/workflow.ts). Sem
// fallback silencioso: se um evento novo for adicionado ao workflow sem
// entrar aqui, ele aparece com o nome bruto em vez de sumir.
export const EVENTO_LEGIVEL: Record<string, string> = {
  rascunho_criado: "Rascunho criado",
  enviado: "Enviado para aprovação",
  reenviado: "Reenviado para aprovação",
  aguardando_nivel2: "Aprovado (nível 1) — aguardando aprovação do diretor",
  aprovado: "Aprovado",
  editado_apos_rejeicao: "Editado após rejeição",
  rejeitado: "Rejeitado",
  comprador_designado: "Comprador designado",
  aguardando_designacao_manual: "Aguardando designação manual de comprador",
  compra_confirmada: "Compra confirmada",
  enviado_para_pagamento: "Enviado para pagamento",
  reenviado_para_pagamento: "Reenviado para pagamento",
  pagamento_recusado: "Pagamento recusado",
  pago: "Pagamento registrado",
};
