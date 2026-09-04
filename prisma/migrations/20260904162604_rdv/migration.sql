-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "dataRdv" TIMESTAMP(3),
ADD COLUMN     "numeroRdv" TEXT,
ADD COLUMN     "possuiAdiantamento" BOOLEAN,
ADD COLUMN     "valorCartaoOnfly" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "tipos_compra" ADD COLUMN     "rdv" BOOLEAN NOT NULL DEFAULT false;
