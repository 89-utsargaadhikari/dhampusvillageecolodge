-- Guest special requests / notes on a booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "notes" TEXT;
