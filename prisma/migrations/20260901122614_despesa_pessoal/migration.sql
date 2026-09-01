-- DropForeignKey
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_centroCustoId_fkey";

-- DropForeignKey
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_centroResultadoId_fkey";

-- DropForeignKey
ALTER TABLE "solicitacoes" DROP CONSTRAINT "solicitacoes_contaContabilId_fkey";

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "categoriaDespesaPessoalId" TEXT,
ADD COLUMN     "dataVencimento" TIMESTAMP(3),
ADD COLUMN     "numeroPedido" TEXT,
ALTER COLUMN "centroCustoId" DROP NOT NULL,
ALTER COLUMN "centroResultadoId" DROP NOT NULL,
ALTER COLUMN "contaContabilId" DROP NOT NULL,
ALTER COLUMN "formaPagamento" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tipos_compra" ADD COLUMN     "despesaPessoal" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "categorias_despesa_pessoal" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_despesa_pessoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_despesa_pessoal_nome_key" ON "categorias_despesa_pessoal"("nome");

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_centroResultadoId_fkey" FOREIGN KEY ("centroResultadoId") REFERENCES "centros_resultado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_categoriaDespesaPessoalId_fkey" FOREIGN KEY ("categoriaDespesaPessoalId") REFERENCES "categorias_despesa_pessoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
