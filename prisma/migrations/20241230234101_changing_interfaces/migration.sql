/*
  Warnings:

  - You are about to drop the column `icon` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Wallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "icon",
DROP COLUMN "isActive";
