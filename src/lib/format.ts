export function formatarReais(valor: number | string | { toString(): string }): string {
  return Number(valor.toString()).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
