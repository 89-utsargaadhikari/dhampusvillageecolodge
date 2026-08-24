-- Catch-up: Prisma schema columns/tables missing on the live Postgres database

-- Booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "businessId" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "numberOfGuests" INTEGER DEFAULT 1;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bookingType" TEXT DEFAULT 'EP';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "occupancy" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'NPR';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "extraBed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "groupId" TEXT;

UPDATE "Booking" SET "bookingId" = 'BK-' || "id"::text WHERE "bookingId" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Booking_bookingId_key'
  ) THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_bookingId_key" UNIQUE ("bookingId");
  END IF;
END $$;

-- Site settings (old DBs used "logo")
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "logoImage" TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'SiteSettings' AND column_name = 'logo'
  ) THEN
    UPDATE "SiteSettings" SET "logoImage" = "logo" WHERE "logoImage" IS NULL AND "logo" IS NOT NULL;
  END IF;
END $$;

-- Hero media
CREATE TABLE IF NOT EXISTS "HeroMedia" (
  "id" SERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HeroMedia_pkey" PRIMARY KEY ("id")
);

-- Restaurant orders
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "orderDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "discountType" TEXT;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "discountValue" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "RestaurantOrder" ADD COLUMN IF NOT EXISTS "taxPercentage" DOUBLE PRECISION DEFAULT 13;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Inventory
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "storeStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "barStock" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "goodStockLevel" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "lowStockLevel" DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "criticalStockLevel" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "storageLocation" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "trackExpiry" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "expiryAlertDays" INTEGER DEFAULT 7;

UPDATE "InventoryItem" SET "category" = 'Other' WHERE "category" IS NULL OR "category" = '';
UPDATE "InventoryItem" SET "storeStock" = "currentStock"
  WHERE "storeStock" = 0 AND "barStock" = 0 AND "currentStock" > 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'InventoryItem' AND column_name = 'minStock'
  ) THEN
    UPDATE "InventoryItem" SET "lowStockLevel" = "minStock"
      WHERE "minStock" IS NOT NULL AND "minStock" > 0 AND "lowStockLevel" = 20;
  END IF;
END $$;

-- Business rate cards currency unique key (safe if table exists)
DO $$
BEGIN
  IF to_regclass('"BusinessRateCard"') IS NOT NULL THEN
    ALTER TABLE "BusinessRateCard" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NPR';
  END IF;
END $$;
