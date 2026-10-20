-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "cotacaoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Copia a cotação única que já existia para a lista nova. A coluna antiga
-- (cotacaoUrl) continua no banco de propósito: o código em produção ainda a
-- lê até o deploy terminar. Uma migração posterior a apaga.
UPDATE "solicitacoes" SET "cotacaoUrls" = ARRAY["cotacaoUrl"] WHERE "cotacaoUrl" IS NOT NULL;
