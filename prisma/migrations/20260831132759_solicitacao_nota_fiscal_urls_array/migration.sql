/*
  Warnings:

  - You are about to drop the column `notaFiscalUrl` on the `solicitacoes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "solicitacoes" DROP COLUMN "notaFiscalUrl",
ADD COLUMN     "notaFiscalUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
