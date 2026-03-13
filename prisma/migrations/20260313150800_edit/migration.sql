/*
  Warnings:

  - You are about to alter the column `basePrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `costPrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "basePrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(10,2);
