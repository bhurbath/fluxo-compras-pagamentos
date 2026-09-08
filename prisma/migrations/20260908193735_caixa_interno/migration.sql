-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "dataDespesa" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tipos_compra" ADD COLUMN     "caixaInterno" BOOLEAN NOT NULL DEFAULT false;
