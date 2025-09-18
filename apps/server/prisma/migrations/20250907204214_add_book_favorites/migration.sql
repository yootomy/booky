-- CreateTable
CREATE TABLE "book_favorite" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_favorite_bookId_userId_key" ON "book_favorite"("bookId", "userId");

-- CreateIndex
CREATE INDEX "book_favorite_userId_idx" ON "book_favorite"("userId");

-- CreateIndex
CREATE INDEX "book_favorite_bookId_idx" ON "book_favorite"("bookId");

-- AddForeignKey
ALTER TABLE "book_favorite" ADD CONSTRAINT "book_favorite_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_favorite" ADD CONSTRAINT "book_favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;