-- CreateTable
CREATE TABLE "CyclePeriodOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CyclePeriodOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CyclePeriodOverride_userId_startsAt_endsAt_idx" ON "CyclePeriodOverride"("userId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "CyclePeriodOverride" ADD CONSTRAINT "CyclePeriodOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
