/*
  Warnings:

  - Added the required column `centroCustoId` to the `solicitacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `centroResultadoId` to the `solicitacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contaContabilId` to the `solicitacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `solicitacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `formaPagamento` to the `solicitacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fornecedor` to the `solicitacoes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('ADIANTAMENTO', 'A_VISTA', 'PARCELADO');

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "centroCustoId" TEXT NOT NULL,
ADD COLUMN     "centroResultadoId" TEXT NOT NULL,
ADD COLUMN     "contaContabilId" TEXT NOT NULL,
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "formaPagamento" "FormaPagamento" NOT NULL,
ADD COLUMN     "fornecedor" TEXT NOT NULL,
ADD COLUMN     "informacoesComplementares" TEXT,
ADD COLUMN     "linkCompra" TEXT;

-- CreateTable
CREATE TABLE "centros_custo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_resultado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_resultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_contabeis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_contabeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_nome_key" ON "centros_custo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "centros_resultado_nome_key" ON "centros_resultado"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "contas_contabeis_nome_key" ON "contas_contabeis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nome_key" ON "empresas"("nome");

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centros_custo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_centroResultadoId_fkey" FOREIGN KEY ("centroResultadoId") REFERENCES "centros_resultado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
