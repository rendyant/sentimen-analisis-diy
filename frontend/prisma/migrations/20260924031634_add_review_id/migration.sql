/*
  Warnings:

  - A unique constraint covering the columns `[reviewId]` on the table `Ulasan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ulasan" ADD COLUMN "reviewId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ulasan_reviewId_key" ON "Ulasan"("reviewId");
