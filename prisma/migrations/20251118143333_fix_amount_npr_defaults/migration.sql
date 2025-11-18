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
    "exchangeRate" REAL NOT NULL DEFAULT 1,
    "amountNPR" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "taxPercentage" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AccountTransaction" ("amount", "amountNPR", "category", "createdAt", "createdBy", "currency", "date", "description", "exchangeRate", "id", "notes", "paymentMethod", "referenceId", "referenceType", "taxAmount", "taxPercentage", "type", "updatedAt") SELECT "amount", "amountNPR", "category", "createdAt", "createdBy", "currency", "date", "description", coalesce("exchangeRate", 1) AS "exchangeRate", "id", "notes", "paymentMethod", "referenceId", "referenceType", coalesce("taxAmount", 0) AS "taxAmount", coalesce("taxPercentage", 0) AS "taxPercentage", "type", "updatedAt" FROM "AccountTransaction";
DROP TABLE "AccountTransaction";
ALTER TABLE "new_AccountTransaction" RENAME TO "AccountTransaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
