ALTER TABLE "Transaction"
  ALTER COLUMN "amount" TYPE DECIMAL(14, 2) USING ROUND("amount"::numeric, 2),
  ALTER COLUMN "fareValue" TYPE DECIMAL(14, 2) USING CASE
    WHEN "fareValue" IS NULL THEN NULL
    ELSE ROUND("fareValue"::numeric, 2)
  END,
  ALTER COLUMN "date" TYPE TIMESTAMP(3) USING to_timestamp("date" / 1000.0);

ALTER TABLE "Wallet"
  ALTER COLUMN "balance" TYPE DECIMAL(14, 2) USING ROUND("balance"::numeric, 2),
  ALTER COLUMN "fareValue" TYPE DECIMAL(14, 2) USING CASE
    WHEN "fareValue" IS NULL THEN NULL
    ELSE ROUND("fareValue"::numeric, 2)
  END;
