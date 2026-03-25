-- CreateTable
CREATE TABLE "ManualPointAdjustment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualPointAdjustment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ManualPointAdjustment" ADD CONSTRAINT "ManualPointAdjustment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
