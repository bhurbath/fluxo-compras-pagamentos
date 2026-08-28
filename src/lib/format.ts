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
