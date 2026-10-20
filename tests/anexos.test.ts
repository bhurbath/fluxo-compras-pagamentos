import { describe, expect, it } from "vitest";
import { combinarAnexos } from "@/lib/anexos";

describe("combinarAnexos", () => {
  it("mantém os anexos atuais quando não vem nenhum arquivo novo", () => {
    expect(combinarAnexos(["a.pdf", "b.pdf"], [], false)).toEqual(["a.pdf", "b.pdf"]);
  });

  it("mantém os atuais mesmo marcando substituir, se não vem nenhum arquivo novo", () => {
    expect(combinarAnexos(["a.pdf"], [], true)).toEqual(["a.pdf"]);
  });

  it("acrescenta os novos aos atuais, na ordem", () => {
    expect(combinarAnexos(["a.pdf"], ["b.pdf", "c.pdf"], false)).toEqual([
      "a.pdf",
      "b.pdf",
      "c.pdf",
    ]);
  });

  it("troca o conjunto inteiro quando marcado substituir", () => {
    expect(combinarAnexos(["a.pdf", "b.pdf"], ["c.pdf"], true)).toEqual(["c.pdf"]);
  });

  it("não altera a lista de anexos atuais recebida", () => {
    const atuais = ["a.pdf"];
    combinarAnexos(atuais, ["b.pdf"], false);
    expect(atuais).toEqual(["a.pdf"]);
  });
});
