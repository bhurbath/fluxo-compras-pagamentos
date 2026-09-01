-- AlterTable
ALTER TABLE "solicitacoes" ALTER COLUMN "fornecedor" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tipos_compra" ADD COLUMN     "dispensaFornecedorForma" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "empresaFixaId" TEXT;

-- AddForeignKey
ALTER TABLE "tipos_compra" ADD CONSTRAINT "tipos_compra_empresaFixaId_fkey" FOREIGN KEY ("empresaFixaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
