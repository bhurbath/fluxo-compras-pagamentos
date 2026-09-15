-- AlterEnum
ALTER TYPE "StatusSolicitacao" ADD VALUE 'AGUARDANDO_COMPROVANTE';

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "dataPrevistaPagamento" TIMESTAMP(3);
