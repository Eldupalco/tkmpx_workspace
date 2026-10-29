-- CreateIndex
CREATE INDEX "attendances_userId_date_idx" ON "attendances"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_userId_dayOfWeek_key" ON "schedules"("userId", "dayOfWeek");
