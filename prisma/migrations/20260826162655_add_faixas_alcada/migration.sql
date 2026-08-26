-- CreateTable
CREATE TABLE "faixas_alcada" (
    "id" TEXT NOT NULL,
    "valorMin" DECIMAL(12,2) NOT NULL,
    "valorMax" DECIMAL(12,2),
    "exigeNivel2" BOOLEAN NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faixas_alcada_pkey" PRIMARY KEY ("id")
);
