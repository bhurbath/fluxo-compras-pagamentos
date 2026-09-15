-- Troca comprovantePagamentoUrl (String?) por comprovantePagamentoUrls
-- (String[]) para permitir mais de um comprovante por solicitação. Preserva
-- os valores já existentes em vez de simplesmente derrubar a coluna antiga.

-- AddColumn
ALTER TABLE "solicitacoes" ADD COLUMN "comprovantePagamentoUrls" TEXT[] NOT NULL DEFAULT '{}';

-- Migrate data
UPDATE "solicitacoes"
SET "comprovantePagamentoUrls" = ARRAY["comprovantePagamentoUrl"]
WHERE "comprovantePagamentoUrl" IS NOT NULL;

-- DropColumn
ALTER TABLE "solicitacoes" DROP COLUMN "comprovantePagamentoUrl";
