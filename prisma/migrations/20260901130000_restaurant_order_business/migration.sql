-- Link restaurant orders (walk-in / restaurant-only bills) to a company/business partner
ALTER TABLE "RestaurantOrder" ADD COLUMN "businessId" INTEGER;

ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
