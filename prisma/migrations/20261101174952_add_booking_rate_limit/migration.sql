-- CreateTable
CREATE TABLE "BookingAttempt" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingAttempt_email_createdAt_idx" ON "BookingAttempt"("email", "createdAt");
