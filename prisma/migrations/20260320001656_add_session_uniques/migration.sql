/*
  Warnings:

  - A unique constraint covering the columns `[eventId,cookieId]` on the table `ParticipantSession` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ParticipantSession_cookieId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantSession_eventId_cookieId_key" ON "ParticipantSession"("eventId", "cookieId");
