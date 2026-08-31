-- Add invoice number and party/vendor name to AccountTransaction (AMS)
ALTER TABLE "AccountTransaction" ADD COLUMN IF NOT EXISTS "partyName" TEXT;
ALTER TABLE "AccountTransaction" ADD COLUMN IF NOT EXISTS "invoiceNo" TEXT;
