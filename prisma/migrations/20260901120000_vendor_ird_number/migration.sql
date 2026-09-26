-- Rename Vendor.panNumber to Vendor.irdNumber for consistency with Business.irdNumber
ALTER TABLE "Vendor" RENAME COLUMN "panNumber" TO "irdNumber";
