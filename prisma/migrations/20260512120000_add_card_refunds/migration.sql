-- Add explicit credit-card refund transactions and link them to the original purchase.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'TARJETA_DEVOLUCION';

ALTER TABLE "Transaction" ADD COLUMN "refundedTransactionId" TEXT;

CREATE INDEX "Transaction_refundedTransactionId_idx" ON "Transaction"("refundedTransactionId");

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_refundedTransactionId_fkey"
  FOREIGN KEY ("refundedTransactionId")
  REFERENCES "Transaction"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
