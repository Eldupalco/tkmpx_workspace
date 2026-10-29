-- DropIndex
DROP INDEX "attendances_userId_date_idx";

-- AlterTable: add the four Daily Time Record punch columns
ALTER TABLE "attendances" ADD COLUMN     "amIn" TIMESTAMP(3),
ADD COLUMN     "amOut" TIMESTAMP(3),
ADD COLUMN     "lateMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pmIn" TIMESTAMP(3),
ADD COLUMN     "pmOut" TIMESTAMP(3),
ADD COLUMN     "undertimeMinutes" INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing single sessions become the morning half; leave rows keep no punches
UPDATE "attendances"
SET "amIn" = "checkInTime", "amOut" = "checkOutTime"
WHERE "status" NOT IN ('on_leave', 'leave');

-- AlterTable: drop the old single check-in/check-out columns
ALTER TABLE "attendances" DROP COLUMN "checkInTime",
DROP COLUMN "checkOutTime";

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "breakEnd" TEXT NOT NULL DEFAULT '13:00',
ADD COLUMN     "breakStart" TEXT NOT NULL DEFAULT '12:00';

-- CreateIndex
CREATE UNIQUE INDEX "attendances_userId_date_key" ON "attendances"("userId", "date");
