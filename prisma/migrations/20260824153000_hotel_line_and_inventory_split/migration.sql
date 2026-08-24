-- Hotel booking line fields
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "occupancy" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'NPR';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "extraBed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "groupId" TEXT;

-- Rate cards per currency (table may not exist on older databases)
DO $$
BEGIN
  IF to_regclass('"BusinessRateCard"') IS NOT NULL THEN
    ALTER TABLE "BusinessRateCard" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NPR';

    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'BusinessRateCard_businessId_roomType_mealPlan_key'
    ) THEN
      ALTER TABLE "BusinessRateCard" DROP CONSTRAINT "BusinessRateCard_businessId_roomType_mealPlan_key";
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'BusinessRateCard_businessId_roomType_mealPlan_currency_key'
    ) THEN
      ALTER TABLE "BusinessRateCard" ADD CONSTRAINT "BusinessRateCard_businessId_roomType_mealPlan_currency_key" UNIQUE ("businessId", "roomType", "mealPlan", "currency");
    END IF;
  END IF;
END $$;

-- Store vs bar stock (table may not exist on older databases)
DO $$
BEGIN
  IF to_regclass('"InventoryItem"') IS NOT NULL THEN
    ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "storeStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
    ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "barStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
    UPDATE "InventoryItem" SET "storeStock" = "currentStock" WHERE "storeStock" = 0 AND "barStock" = 0 AND "currentStock" > 0;
  END IF;
END $$;
