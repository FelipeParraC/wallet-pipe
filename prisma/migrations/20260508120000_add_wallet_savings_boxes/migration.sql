-- Add wallet savings boxes as child wallets.
ALTER TABLE "Wallet" ADD COLUMN "parentWalletId" TEXT;
ALTER TABLE "Wallet" ADD COLUMN "isSavingsBox" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Wallet_userId_parentWalletId_idx" ON "Wallet"("userId", "parentWalletId");

ALTER TABLE "Wallet"
ADD CONSTRAINT "Wallet_parentWalletId_fkey"
FOREIGN KEY ("parentWalletId") REFERENCES "Wallet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
