-- CreateEnum
CREATE TYPE "ModifierType" AS ENUM ('DISCOUNT', 'MARKUP');

-- AlterTable
ALTER TABLE "SaleChannel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "modifierType" "ModifierType",
ADD COLUMN     "priceModifier" DECIMAL(10,2);
