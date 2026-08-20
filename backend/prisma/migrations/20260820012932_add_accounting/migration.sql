-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "accounting_entries" (
    "id" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_entries_pkey" PRIMARY KEY ("id")
);
