-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'TED', 'BOLETO', 'CARTAO_CREDITO', 'DINHEIRO');

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "dadosPagamento" TEXT,
ADD COLUMN     "fornecedorDocumento" TEXT,
ADD COLUMN     "metodoPagamento" "MetodoPagamento";
