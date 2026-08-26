-- Room rates can be NPR / USD / INR. Prisma already expected this column.
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'NPR';
