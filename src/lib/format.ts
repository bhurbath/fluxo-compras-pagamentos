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
