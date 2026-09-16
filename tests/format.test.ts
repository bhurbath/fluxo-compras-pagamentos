import { describe, expect, it } from "vitest";
import { formatarData, formatarDataCalendario, formatarDataHora } from "@/lib/format";

describe("formatarDataCalendario", () => {
  // dataVencimento/dataRdv/dataDespesa/previsaoChegada/dataPrevistaPagamento
  // vêm de um <input type="date"> e são guardados como meia-noite UTC do dia
  // escolhido, sem horário real associado — formatarDataCalendario precisa
  // mostrar esse mesmo dia, não um dia antes por causa da conversão de fuso
  // (America/Sao_Paulo é UTC-3, então meia-noite UTC já é o dia anterior lá).
  it("mostra o mesmo dia gravado, sem voltar um dia por causa do fuso horário", () => {
    const dataVencimento = new Date("2026-09-18T00:00:00.000Z");

    expect(formatarDataCalendario(dataVencimento)).toBe("18/09/2026");
  });

  it("difere de formatarData para uma data de calendário à meia-noite UTC", () => {
    // Documenta a diferença de propósito entre as duas: formatarData
    // converte para America/Sao_Paulo (certo para um instante real, como
    // criadoEm), e por isso mostra um dia a menos para uma data pura como
    // essa — formatarDataCalendario não deve ter essa conversão.
    const data = new Date("2026-09-18T00:00:00.000Z");

    expect(formatarData(data)).toBe("17/09/2026");
    expect(formatarDataCalendario(data)).toBe("18/09/2026");
  });
});

describe("formatarData e formatarDataHora", () => {
  it("convertem um instante real (não meia-noite UTC) para o horário de Brasília", () => {
    const criadoEm = new Date("2026-09-18T14:30:00.000Z");

    expect(formatarData(criadoEm)).toBe("18/09/2026");
    expect(formatarDataHora(criadoEm)).toBe("18/09/2026, 11:30");
  });
});
