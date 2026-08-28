// Serialização CSV simples, sem dependência externa — suficiente para uma
// exportação de relatório (aspas duplas ao redor de qualquer campo com o
// delimitador, aspas ou quebra de linha; aspas internas dobradas, no
// espírito da RFC 4180). BOM (U+FEFF) no início: sem ele, o Excel abre um
// CSV UTF-8 com acentos corrompidos (ç, ã, é, ...) — o resto do
// ecossistema já lida bem com BOM.
//
// Delimitador ";" em vez de "," de propósito: o Excel em português (o
// público deste export) usa "," como separador decimal, então já espera
// ";" como separador de campo — com "," ele abre "R$ 1.234,56" como duas
// colunas em vez de uma célula.
const DELIMITADOR = ";";
const CARACTERES_QUE_EXIGEM_ASPAS = new RegExp(`["${DELIMITADOR}\r\n]`);

export function paraCsv(cabecalho: string[], linhas: string[][]): string {
  const escapar = (valor: string): string => {
    if (CARACTERES_QUE_EXIGEM_ASPAS.test(valor)) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  };

  const BOM = String.fromCharCode(0xfeff);
  const todasAsLinhas = [cabecalho, ...linhas];
  return (
    BOM + todasAsLinhas.map((linha) => linha.map(escapar).join(DELIMITADOR)).join("\r\n")
  );
}
