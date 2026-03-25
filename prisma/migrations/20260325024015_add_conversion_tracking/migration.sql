-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "conversionBonusPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CheckpointConversion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "type" "ConversionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckpointConversion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CheckpointConversion" ADD CONSTRAINT "CheckpointConversion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointConversion" ADD CONSTRAINT "CheckpointConversion_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
