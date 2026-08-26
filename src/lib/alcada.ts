import { getDb } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type FaixaAlcadaInput = {
  valorMin: string;
  valorMax: string | null;
  exigeNivel2: boolean;
};

// Matches the schema's Decimal(12, 2) column — checked here so a too-large
// value gets a clear message instead of a raw Prisma P2020 at insert time.
const VALOR_MAXIMO = new Prisma.Decimal("9999999999.99");

function paraDecimal(valor: string, campo: string): Prisma.Decimal {
  try {
    // Parsing with the exact same Decimal implementation Prisma persists
    // with (not Number()) means validation can never accept a string that
    // then fails — or silently means something different — once it reaches
    // the database.
    return new Prisma.Decimal(valor);
  } catch {
    throw new Error(`${campo} precisa ser um número válido.`);
  }
}

function seSobrepoe(
  aMin: Prisma.Decimal,
  aMax: Prisma.Decimal | null,
  bMin: Prisma.Decimal,
  bMax: Prisma.Decimal | null
): boolean {
  const aTerminaAntesDeB = aMax !== null && aMax.lessThan(bMin);
  const bTerminaAntesDeA = bMax !== null && bMax.lessThan(aMin);
  return !aTerminaAntesDeB && !bTerminaAntesDeA;
}

async function validarFaixa(input: FaixaAlcadaInput, idExcluir?: string) {
  const min = paraDecimal(input.valorMin, "O valor mínimo");
  const max = input.valorMax === null ? null : paraDecimal(input.valorMax, "O valor máximo");

  if (min.lessThan(0)) {
    throw new Error("O valor mínimo não pode ser negativo.");
  }
  if (max !== null && max.lessThanOrEqualTo(min)) {
    throw new Error("O valor máximo precisa ser maior que o valor mínimo.");
  }
  if (min.greaterThan(VALOR_MAXIMO) || (max !== null && max.greaterThan(VALOR_MAXIMO))) {
    throw new Error(`O valor não pode passar de ${VALOR_MAXIMO.toString()}.`);
  }

  const outras = await getDb().faixaAlcada.findMany(
    idExcluir ? { where: { id: { not: idExcluir } } } : undefined
  );
  const conflito = outras.find((faixa) =>
    seSobrepoe(min, max, faixa.valorMin, faixa.valorMax)
  );
  if (conflito) {
    const ateOndeVai = conflito.valorMax ? conflito.valorMax.toString() : "sem limite";
    throw new Error(
      `Essa faixa se sobrepõe à faixa existente de ${conflito.valorMin.toString()} até ${ateOndeVai}.`
    );
  }
}

export async function listarFaixasAlcada() {
  return getDb().faixaAlcada.findMany({ orderBy: { valorMin: "asc" } });
}

export async function obterFaixaAlcada(id: string) {
  return getDb().faixaAlcada.findUnique({ where: { id } });
}

export async function criarFaixaAlcada(input: FaixaAlcadaInput) {
  await validarFaixa(input);
  return getDb().faixaAlcada.create({ data: input });
}

export async function atualizarFaixaAlcada(
  id: string,
  input: FaixaAlcadaInput
) {
  await validarFaixa(input, id);
  return getDb().faixaAlcada.update({ where: { id }, data: input });
}

export async function excluirFaixaAlcada(id: string) {
  await getDb().faixaAlcada.delete({ where: { id } });
}
