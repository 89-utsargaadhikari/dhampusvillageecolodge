-- Allow deleting restaurant orders even when a linked menu item is missing
ALTER TABLE "OrderItem" ALTER COLUMN "menuItemId" DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_menuItemId_fkey'
  ) THEN
    ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_menuItemId_fkey";
  END IF;
END $$;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "RestaurantMenuItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
