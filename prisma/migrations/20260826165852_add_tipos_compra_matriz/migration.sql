-- CreateTable
CREATE TABLE "tipos_compra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriz_comprador" (
    "id" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "tipoCompraId" TEXT NOT NULL,
    "compradorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriz_comprador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_compra_nome_key" ON "tipos_compra"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "matriz_comprador_departamentoId_tipoCompraId_key" ON "matriz_comprador"("departamentoId", "tipoCompraId");

-- AddForeignKey
ALTER TABLE "matriz_comprador" ADD CONSTRAINT "matriz_comprador_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriz_comprador" ADD CONSTRAINT "matriz_comprador_tipoCompraId_fkey" FOREIGN KEY ("tipoCompraId") REFERENCES "tipos_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriz_comprador" ADD CONSTRAINT "matriz_comprador_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed initial tipos de compra (ticket 04) — a starting list, not a closed
-- one; more can be added later via the admin screen without code changes.
INSERT INTO "tipos_compra" ("id", "nome", "atualizadoEm") VALUES
  (gen_random_uuid()::text, 'Compras no Mercado Livre', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Compras no cartão de crédito', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Serviços e produtos por departamento', CURRENT_TIMESTAMP);
