CREATE TABLE "CreditCardStatementClosing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "statementMonth" TIMESTAMP(3) NOT NULL,
    "closingAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreditCardStatementClosing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditCardStatementClosing_walletId_statementMonth_key" ON "CreditCardStatementClosing"("walletId", "statementMonth");
CREATE INDEX "CreditCardStatementClosing_userId_walletId_statementMonth_idx" ON "CreditCardStatementClosing"("userId", "walletId", "statementMonth");

ALTER TABLE "CreditCardStatementClosing" ADD CONSTRAINT "CreditCardStatementClosing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditCardStatementClosing" ADD CONSTRAINT "CreditCardStatementClosing_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
