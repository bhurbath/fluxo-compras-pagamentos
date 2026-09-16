// Considera só fins de semana (sábado/domingo) — sem calendário de feriados
// por enquanto. Usado para a regra de vencimento mínimo de "Compras pelo
// solicitante" (ver TipoCompra.compradorEhSolicitante em workflow.ts): a
// data de vencimento precisa ser pelo menos N dias úteis após a data de
// criação da solicitação. Normaliza `data` para meia-noite UTC antes de
// somar — mesma convenção de dataVencimento e afins (guardados como meia-
// noite UTC do dia escolhido, sem horário real associado — ver
// formatarDataCalendario em src/lib/format.ts). Sem isso, comparar o
// resultado com uma dessas datas horas depois no mesmo dia dá um falso
// negativo.
export function adicionarDiasUteis(data: Date, dias: number): Date {
  const resultado = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  let restantes = dias;
  while (restantes > 0) {
    resultado.setUTCDate(resultado.getUTCDate() + 1);
    const diaDaSemana = resultado.getUTCDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      restantes -= 1;
    }
  }
  return resultado;
}
