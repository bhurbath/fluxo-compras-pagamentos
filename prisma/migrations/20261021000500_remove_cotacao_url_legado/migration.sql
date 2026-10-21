-- Última etapa da troca de cotacaoUrl (uma cotação) por cotacaoUrls (lista).
-- Antes de apagar, copia o que o sistema antigo ainda gravou na coluna
-- velha entre a migração anterior e o deploy do código novo.
UPDATE "solicitacoes"
SET "cotacaoUrls" = ARRAY["cotacaoUrl"]
WHERE "cotacaoUrl" IS NOT NULL AND cardinality("cotacaoUrls") = 0;

-- AlterTable
ALTER TABLE "solicitacoes" DROP COLUMN "cotacaoUrl";
