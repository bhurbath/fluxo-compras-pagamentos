-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "departamentoId" TEXT;

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "diretorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nome_key" ON "departamentos"("nome");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_diretorId_fkey" FOREIGN KEY ("diretorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
