import { describe, expect, it } from "vitest";
import { adicionarDiasUteis } from "@/lib/dias-uteis";

describe("adicionarDiasUteis", () => {
  it("pula fins de semana ao somar dias úteis", () => {
    // 2026-09-14 é uma segunda-feira — 5 dias úteis depois cai na segunda
    // seguinte (ter, qua, qui, sex, seg), pulando o fim de semana no meio.
    const segunda = new Date("2026-09-14T00:00:00.000Z");

    const resultado = adicionarDiasUteis(segunda, 5);

    expect(resultado.toISOString().slice(0, 10)).toBe("2026-09-21");
  });

  it("pula o fim de semana quando a base já é sexta-feira", () => {
    const sexta = new Date("2026-09-18T00:00:00.000Z");

    const resultado = adicionarDiasUteis(sexta, 1);

    expect(resultado.toISOString().slice(0, 10)).toBe("2026-09-21");
  });

  it("normaliza a base para meia-noite UTC antes de somar", () => {
    // Um instante real (com horário), não uma data pura — o resultado deve
    // ser a mesma meia-noite UTC que adicionarDiasUteis(meia-noite, dias)
    // daria, não um dia a mais/a menos por causa do horário embutido.
    const comHorario = new Date("2026-09-14T23:59:00.000Z");
    const meiaNoite = new Date("2026-09-14T00:00:00.000Z");

    expect(adicionarDiasUteis(comHorario, 5).getTime()).toBe(
      adicionarDiasUteis(meiaNoite, 5).getTime()
    );
  });
});
