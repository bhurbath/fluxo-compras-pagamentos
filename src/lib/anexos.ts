// Anexos de um campo depois de uma edição (rascunho ou solicitação rejeitada).
// Sem arquivos novos, mantém os atuais — um <input type="file"> nunca vem
// pré-preenchido, então sem isso o solicitante teria de reanexar tudo a cada
// correção. Com arquivos novos, eles são acrescentados aos atuais; só
// "substituir" (a caixa "Substituir os anexos já enviados") troca o conjunto
// inteiro, o único jeito de se livrar de um anexo enviado por engano.
export function combinarAnexos(atuais: string[], novos: string[], substituir: boolean): string[] {
  if (novos.length === 0) {
    return atuais;
  }
  return substituir ? novos : [...atuais, ...novos];
}
