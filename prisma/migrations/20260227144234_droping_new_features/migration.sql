/*
  Warnings:

  - You are about to drop the column `purchasePaymentMethodId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `CashFlow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchasePayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchasePaymentMethod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CashFlow" DROP CONSTRAINT "CashFlow_orderId_fkey";

-- DropForeignKey
ALTER TABLE "CashFlow" DROP CONSTRAINT "CashFlow_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_purchasePaymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_statusId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_productVariantId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "PurchasePayment" DROP CONSTRAINT "PurchasePayment_methodId_fkey";

-- DropForeignKey
ALTER TABLE "PurchasePayment" DROP CONSTRAINT "PurchasePayment_purchaseId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "purchasePaymentMethodId";

-- DropTable
DROP TABLE "CashFlow";

-- DropTable
DROP TABLE "Purchase";

-- DropTable
DROP TABLE "PurchaseItem";

-- DropTable
DROP TABLE "PurchasePayment";

-- DropTable
DROP TABLE "PurchasePaymentMethod";

-- DropTable
DROP TABLE "PurchaseStatus";

-- DropEnum
DROP TYPE "CashFlowType";
