export function formatarReais(valor: number | string | { toString(): string }): string {
  return Number(valor.toString()).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarDataHora(data: Date): string {
  // timeZone explícito — sem isso, um Server Component renderiza no fuso do
  // processo Node (normalmente UTC em produção), não no horário de Brasília,
  // desalinhando a linha do tempo de quando os eventos de fato aconteceram.
  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

export function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

// Para campos que são só uma data de calendário (dataVencimento, dataRdv,
// dataDespesa, previsaoChegada, dataPrevistaPagamento — todos vindos de um
// <input type="date">, guardados como meia-noite UTC do dia escolhido, sem
// nenhum horário real associado) — nunca use formatarData nesses: converter
// meia-noite UTC para America/Sao_Paulo (UTC-3) sempre volta um dia (ex.:
// 2026-09-18T00:00:00Z vira 17/09 em Brasília), mostrando uma data errada.
// Lê os componentes em UTC para sempre bater com o dia digitado, não com o
// fuso de quem está vendo a tela. Diferente de formatarData(criadoEm), que
// converte de propósito: criadoEm é um instante real, não uma data pura, e
// mostrar em horário de Brasília é o comportamento certo ali.
export function formatarDataCalendario(data: Date): string {
  return data.toLocaleDateString("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC",
  });
}

// yyyy-mm-dd (o formato de <input type="date">) → início ou fim do dia
// local, validado. Retorna undefined para vazio, null para uma data
// inválida (ex: query string adulterada) — o chamador decide o que fazer
// com cada caso. Compartilhado pelo export CSV (/api/solicitacoes/exportar)
// e pela tela de consulta (/consultar) — mesmos filtros de período nos dois.
export function parseDataFiltro(
  valor: string | null,
  limite: "inicio" | "fim"
): Date | null | undefined {
  if (!valor) return undefined;
  const hora = limite === "inicio" ? "T00:00:00.000" : "T23:59:59.999";
  const data = new Date(`${valor}${hora}`);
  return Number.isNaN(data.getTime()) ? null : data;
}
