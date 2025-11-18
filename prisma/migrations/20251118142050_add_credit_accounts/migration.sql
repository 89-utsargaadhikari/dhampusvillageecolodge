/*
  Warnings:

  - You are about to drop the column `dateAD` on the `AccountTransaction` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "CreditAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestName" TEXT NOT NULL,
    "guestContact" TEXT NOT NULL,
    "guestEmail" TEXT,
    "creditAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "outstandingBalance" REAL NOT NULL,
    "creditDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "linkedBookingId" INTEGER,
    "notes" TEXT,
    "lastReminderSent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreditPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "creditAccountId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "receivedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditPayment_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "CreditAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "exchangeRate" REAL DEFAULT 1,
    "amountNPR" REAL NOT NULL,
    "paymentMethod" TEXT,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "taxAmount" REAL DEFAULT 0,
    "taxPercentage" REAL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AccountTransaction" ("amount", "amountNPR", "category", "createdAt", "createdBy", "currency", "date", "description", "exchangeRate", "id", "notes", "paymentMethod", "referenceId", "referenceType", "taxAmount", "taxPercentage", "type", "updatedAt") SELECT "amount", "amountNPR", "category", "createdAt", "createdBy", "currency", "date", "description", "exchangeRate", "id", "notes", "paymentMethod", "referenceId", "referenceType", "taxAmount", "taxPercentage", "type", "updatedAt" FROM "AccountTransaction";
DROP TABLE "AccountTransaction";
ALTER TABLE "new_AccountTransaction" RENAME TO "AccountTransaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
