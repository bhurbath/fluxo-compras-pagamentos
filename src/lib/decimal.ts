import { Prisma } from "@prisma/client";

export function paraDecimal(valor: string, campo: string): Prisma.Decimal {
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
