-- CreateEnum
CREATE TYPE "SagaStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'UNKNOWN');

-- CreateTable
CREATE TABLE "saga" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "SagaStatus" NOT NULL DEFAULT 'ONGOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saga_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "book" ADD COLUMN     "sagaId" TEXT,
ADD COLUMN     "sagaOrder" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "saga_slug_key" ON "saga"("slug");

-- CreateIndex
CREATE INDEX "saga_name_idx" ON "saga"("name");

-- CreateIndex
CREATE INDEX "saga_slug_idx" ON "saga"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_saga_order" ON "book"("sagaId", "sagaOrder");

-- CreateIndex
CREATE INDEX "book_sagaId_sagaOrder_idx" ON "book"("sagaId", "sagaOrder");

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "book_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "saga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add CHECK constraint for saga consistency
ALTER TABLE "book"
ADD CONSTRAINT "book_saga_order_consistency"
CHECK (
  (saga_id IS NULL AND saga_order IS NULL) OR
  (saga_id IS NOT NULL AND saga_order IS NOT NULL)
);