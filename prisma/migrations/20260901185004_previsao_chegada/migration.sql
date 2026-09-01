-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "previsaoChegada" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tipos_compra" ADD COLUMN     "exigePrevisaoChegada" BOOLEAN NOT NULL DEFAULT false;
